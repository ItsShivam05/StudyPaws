-- =====================================================================
--  Study Paws — schema, row level security, RPCs and realtime
-- =====================================================================
--  Design notes
--  * Every table has RLS enabled. Clients only ever use the anon /
--    publishable key; anything privileged goes through SECURITY DEFINER
--    functions that validate the caller with auth.uid().
--  * Private rooms are invisible to non-members. The 8-character invite
--    code is the credential: join_room(code) is the only way in.
--  * Guests use Supabase anonymous sign-ins, so they get a real auth.uid()
--    and the same policies apply to them.
-- =====================================================================

-- ---------------------------------------------------------------------
--  Profiles
-- ---------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Study buddy'
               check (char_length(display_name) between 1 and 32),
  avatar       text not null default 'ginger'
               check (avatar in ('ginger', 'grey', 'midnight', 'calico', 'cream', 'snow')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  Per-user preferences & notes
-- ---------------------------------------------------------------------
create table public.user_preferences (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  settings   jsonb not null default '{}'::jsonb
             check (jsonb_typeof(settings) = 'object' and pg_column_size(settings) < 8192),
  updated_at timestamptz not null default now()
);

create table public.study_notes (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  content    text not null default '' check (char_length(content) <= 20000),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  Study rooms
-- ---------------------------------------------------------------------
create table public.study_rooms (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  name               text not null check (char_length(btrim(name)) between 1 and 48),
  is_public          boolean not null default false,
  owner_id           uuid not null references auth.users (id) on delete cascade,
  max_members        integer not null default 12 check (max_members between 2 and 50),
  scene              text not null default 'rainy' check (scene in ('rainy', 'sunny', 'night', 'snowy')),
  ambience           jsonb not null default '{}'::jsonb
                     check (jsonb_typeof(ambience) = 'object' and pg_column_size(ambience) < 1024),
  -- shared timer
  timer_mode         text not null default 'focus' check (timer_mode in ('focus', 'short', 'long')),
  timer_status       text not null default 'idle' check (timer_status in ('idle', 'running', 'paused')),
  timer_duration_ms  integer not null default 1500000 check (timer_duration_ms > 0),
  timer_remaining_ms integer not null default 1500000 check (timer_remaining_ms >= 0),
  timer_ends_at      timestamptz,
  focus_minutes      integer not null default 25 check (focus_minutes between 1 and 180),
  short_minutes      integer not null default 5 check (short_minutes between 1 and 60),
  long_minutes       integer not null default 15 check (long_minutes between 1 and 90),
  cycle_count        integer not null default 0,
  timer_updated_by   uuid references auth.users (id) on delete set null,
  timer_updated_at   timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  last_active_at     timestamptz not null default now(),
  constraint running_has_end check (timer_status <> 'running' or timer_ends_at is not null)
);

create index study_rooms_public_idx on public.study_rooms (last_active_at desc) where is_public;
create index study_rooms_owner_idx on public.study_rooms (owner_id);

create table public.room_members (
  room_id      uuid not null references public.study_rooms (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'member')),
  joined_at    timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index room_members_user_idx on public.room_members (user_id);

create table public.room_messages (
  id         bigint generated always as identity primary key,
  room_id    uuid not null references public.study_rooms (id) on delete cascade,
  user_id    uuid default auth.uid() references auth.users (id) on delete set null,
  kind       text not null check (kind in ('message', 'reaction', 'event')),
  body       text not null check (char_length(body) between 1 and 200),
  created_at timestamptz not null default now()
);

create index room_messages_room_idx on public.room_messages (room_id, created_at desc);

-- ---------------------------------------------------------------------
--  Study sessions (statistics are derived from these)
-- ---------------------------------------------------------------------
create table public.study_sessions (
  id               uuid primary key,              -- generated on the client for idempotent sync
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  room_id          uuid references public.study_rooms (id) on delete set null,
  started_at       timestamptz not null,
  ended_at         timestamptz not null,
  duration_seconds integer not null check (duration_seconds between 1 and 86400),
  completed        boolean not null default true,
  created_at       timestamptz not null default now(),
  constraint ended_after_start check (ended_at >= started_at),
  constraint not_in_future check (ended_at <= now() + interval '5 minutes')
);

create index study_sessions_user_idx on public.study_sessions (user_id, ended_at desc);

-- ---------------------------------------------------------------------
--  Helpers
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Membership check used by policies. SECURITY DEFINER avoids recursive RLS.
create or replace function public.is_room_member(p_room uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.room_members m
    where m.room_id = p_room and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.shares_room_with(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.room_members a
    join public.room_members b on b.room_id = a.room_id
    where a.user_id = (select auth.uid()) and b.user_id = p_user
  );
$$;

create or replace function public.server_now()
returns timestamptz language sql stable as $$ select now() $$;

-- New auth user -> profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_name   text := left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 32);
  v_avatar text := coalesce(new.raw_user_meta_data ->> 'avatar', '');
begin
  if v_name = '' then v_name := 'Study buddy'; end if;
  if v_avatar not in ('ginger', 'grey', 'midnight', 'calico', 'cream', 'snow') then
    v_avatar := (array['ginger', 'grey', 'midnight', 'calico', 'cream', 'snow'])[1 + floor(random() * 6)::int];
  end if;
  insert into public.profiles (id, display_name, avatar)
  values (new.id, v_name, v_avatar)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
--  Row level security
-- ---------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.user_preferences enable row level security;
alter table public.study_notes      enable row level security;
alter table public.study_rooms      enable row level security;
alter table public.room_members     enable row level security;
alter table public.room_messages    enable row level security;
alter table public.study_sessions   enable row level security;

-- profiles: yourself, and people you share a room with
create policy "profiles: read own or roommates" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.shares_room_with(id));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- preferences & notes: owner only
create policy "preferences: own" on public.user_preferences
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "notes: own" on public.study_notes
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- sessions: owner only, immutable once written
create policy "sessions: read own" on public.study_sessions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "sessions: insert own" on public.study_sessions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "sessions: delete own" on public.study_sessions
  for delete to authenticated using (user_id = (select auth.uid()));

-- rooms: members see their rooms; nobody browses private rooms
create policy "rooms: members read" on public.study_rooms
  for select to authenticated using (public.is_room_member(id));
create policy "rooms: owner updates settings" on public.study_rooms
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "rooms: owner deletes" on public.study_rooms
  for delete to authenticated using (owner_id = (select auth.uid()));
-- (no insert policy: rooms are created through create_room())

-- members: visible to fellow members; you may update/leave your own row
create policy "members: read roommates" on public.room_members
  for select to authenticated using (public.is_room_member(room_id));
create policy "members: update own" on public.room_members
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "members: leave" on public.room_members
  for delete to authenticated using (user_id = (select auth.uid()) and role <> 'owner');

-- messages: members read; members post messages/reactions as themselves
create policy "messages: members read" on public.room_messages
  for select to authenticated using (public.is_room_member(room_id));
create policy "messages: members post" on public.room_messages
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and kind in ('message', 'reaction')
    and public.is_room_member(room_id)
  );

-- Column-level privileges: owners may change room settings but never the
-- code, owner or timer columns directly (timer goes through room_timer()).
revoke all on public.study_rooms from anon, authenticated;
grant select, delete on public.study_rooms to authenticated;
grant update (name, is_public, scene, ambience, focus_minutes, short_minutes, long_minutes)
  on public.study_rooms to authenticated;

revoke all on public.room_members from anon, authenticated;
grant select, delete on public.room_members to authenticated;
grant update (last_seen_at) on public.room_members to authenticated;

revoke all on public.room_messages from anon, authenticated;
grant select on public.room_messages to authenticated;
grant insert (room_id, user_id, kind, body) on public.room_messages to authenticated;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar) on public.profiles to authenticated;

revoke all on public.study_sessions from anon, authenticated;
grant select, delete on public.study_sessions to authenticated;
grant insert (id, user_id, room_id, started_at, ended_at, duration_seconds, completed)
  on public.study_sessions to authenticated;

revoke all on public.user_preferences from anon;
revoke all on public.study_notes from anon;
grant select, insert, update, delete on public.user_preferences to authenticated;
grant select, insert, update, delete on public.study_notes to authenticated;

-- ---------------------------------------------------------------------
--  RPCs
-- ---------------------------------------------------------------------
create or replace function public.display_name_of(p_user uuid)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce((select display_name from public.profiles where id = p_user), 'Someone');
$$;

create or replace function public.create_room(p_name text, p_is_public boolean default false, p_scene text default 'rainy')
returns public.study_rooms
language plpgsql security definer set search_path = '' as $$
declare
  v_uid  uuid := auth.uid();
  v_code text;
  v_room public.study_rooms;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 48 then
    raise exception 'invalid_name';
  end if;
  if (select count(*) from public.study_rooms where owner_id = v_uid) >= 20 then
    raise exception 'too_many_rooms';
  end if;
  if p_scene not in ('rainy', 'sunny', 'night', 'snowy') then p_scene := 'rainy'; end if;

  loop
    v_code := '';
    for i in 1..8 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.study_rooms where code = v_code);
  end loop;

  insert into public.study_rooms (code, name, is_public, owner_id, scene, timer_updated_by)
  values (v_code, btrim(p_name), coalesce(p_is_public, false), v_uid, p_scene, v_uid)
  returning * into v_room;

  insert into public.room_members (room_id, user_id, role) values (v_room.id, v_uid, 'owner');
  insert into public.room_messages (room_id, user_id, kind, body)
  values (v_room.id, v_uid, 'event', public.display_name_of(v_uid) || ' opened the room');
  return v_room;
end $$;

create or replace function public.join_room(p_code text)
returns public.study_rooms
language plpgsql security definer set search_path = '' as $$
declare
  v_uid  uuid := auth.uid();
  v_room public.study_rooms;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into v_room from public.study_rooms where code = upper(btrim(p_code)) for update;
  if not found then raise exception 'room_not_found'; end if;

  if exists (select 1 from public.room_members where room_id = v_room.id and user_id = v_uid) then
    update public.room_members set last_seen_at = now() where room_id = v_room.id and user_id = v_uid;
    return v_room;
  end if;

  if (select count(*) from public.room_members where room_id = v_room.id) >= v_room.max_members then
    raise exception 'room_full';
  end if;

  insert into public.room_members (room_id, user_id) values (v_room.id, v_uid);
  insert into public.room_messages (room_id, user_id, kind, body)
  values (v_room.id, v_uid, 'event', public.display_name_of(v_uid) || ' joined the room');
  update public.study_rooms set last_active_at = now() where id = v_room.id returning * into v_room;
  return v_room;
end $$;

create or replace function public.leave_room(p_room uuid)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid  uuid := auth.uid();
  v_role text;
  v_next uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select role into v_role from public.room_members where room_id = p_room and user_id = v_uid;
  if not found then return; end if;

  delete from public.room_members where room_id = p_room and user_id = v_uid;

  if v_role = 'owner' then
    select user_id into v_next from public.room_members
      where room_id = p_room order by joined_at asc limit 1;
    if v_next is null then
      delete from public.study_rooms where id = p_room;
      return;
    end if;
    update public.room_members set role = 'owner' where room_id = p_room and user_id = v_next;
    update public.study_rooms set owner_id = v_next where id = p_room;
  end if;

  insert into public.room_messages (room_id, user_id, kind, body)
  values (p_room, null, 'event', public.display_name_of(v_uid) || ' left the room');
end $$;

-- Shared timer state machine. Every member can drive it; all transitions
-- are computed with the database clock so clients never disagree.
create or replace function public.room_timer(p_room uuid, p_action text, p_mode text default null)
returns public.study_rooms
language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_room  public.study_rooms;
  v_name  text;
  v_event text;
  v_next  text;
  v_ms    int;
  v_cycle int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if not public.is_room_member(p_room) then raise exception 'not_member'; end if;

  select * into v_room from public.study_rooms where id = p_room for update;
  if not found then raise exception 'room_not_found'; end if;
  v_name := public.display_name_of(v_uid);

  if p_action = 'start' then
    if v_room.timer_status = 'running' then return v_room; end if;
    v_event := case
      when v_room.timer_status = 'paused' then v_name || ' resumed the timer'
      when v_room.timer_mode = 'focus' then v_name || ' started a ' || (v_room.timer_duration_ms / 60000) || '-minute focus session'
      else v_name || ' started a break'
    end;
    update public.study_rooms set
      timer_status = 'running',
      timer_ends_at = now() + make_interval(secs => timer_remaining_ms / 1000.0)
    where id = p_room returning * into v_room;

  elsif p_action = 'pause' then
    if v_room.timer_status <> 'running' then return v_room; end if;
    update public.study_rooms set
      timer_status = 'paused',
      timer_remaining_ms = greatest(0, floor(extract(epoch from (timer_ends_at - now())) * 1000))::int,
      timer_ends_at = null
    where id = p_room returning * into v_room;
    v_event := v_name || ' paused the timer';

  elsif p_action = 'reset' then
    -- Re-read the configured length so edited durations apply on reset.
    v_ms := 60000 * case v_room.timer_mode
      when 'focus' then v_room.focus_minutes
      when 'short' then v_room.short_minutes
      else v_room.long_minutes end;
    update public.study_rooms set
      timer_status = 'idle', timer_duration_ms = v_ms, timer_remaining_ms = v_ms, timer_ends_at = null
    where id = p_room returning * into v_room;
    v_event := v_name || ' reset the timer';

  elsif p_action = 'set_mode' then
    if p_mode not in ('focus', 'short', 'long') then raise exception 'invalid_mode'; end if;
    v_ms := 60000 * case p_mode
      when 'focus' then v_room.focus_minutes
      when 'short' then v_room.short_minutes
      else v_room.long_minutes end;
    update public.study_rooms set
      timer_mode = p_mode, timer_status = 'idle',
      timer_duration_ms = v_ms, timer_remaining_ms = v_ms, timer_ends_at = null
    where id = p_room returning * into v_room;

  elsif p_action in ('complete', 'skip') then
    -- 'complete' only succeeds once the end time has really passed (idempotent:
    -- many clients call it at the same moment, one wins).
    if p_action = 'complete' and not (v_room.timer_status = 'running' and v_room.timer_ends_at <= now() + interval '1.5 seconds') then
      return v_room;
    end if;
    v_cycle := v_room.cycle_count;
    if v_room.timer_mode = 'focus' then
      if p_action = 'complete' then v_cycle := v_cycle + 1; end if;
      v_next := case when p_action = 'complete' and v_cycle % 4 = 0 then 'long' else 'short' end;
    else
      v_next := 'focus';
      if v_room.timer_mode = 'long' then v_cycle := 0; end if;
    end if;
    v_ms := 60000 * case v_next
      when 'focus' then v_room.focus_minutes
      when 'short' then v_room.short_minutes
      else v_room.long_minutes end;
    v_event := case
      when p_action = 'skip' then v_name || ' skipped ahead to ' || case v_next when 'focus' then 'focus' else 'a break' end
      when v_room.timer_mode = 'focus' then 'Focus session complete — lovely work, everyone'
      else 'Break is over — ready when you are'
    end;
    update public.study_rooms set
      timer_mode = v_next, timer_status = 'idle', cycle_count = v_cycle,
      timer_duration_ms = v_ms, timer_remaining_ms = v_ms, timer_ends_at = null
    where id = p_room returning * into v_room;
  else
    raise exception 'invalid_action';
  end if;

  update public.study_rooms set
    timer_updated_by = v_uid, timer_updated_at = now(), last_active_at = now()
  where id = p_room returning * into v_room;

  if v_event is not null then
    insert into public.room_messages (room_id, user_id, kind, body)
    values (p_room, case when p_action = 'complete' then null else v_uid end, 'event', left(v_event, 200));
  end if;
  return v_room;
end $$;

-- Re-sync durations of an idle timer after the owner changes them.
create or replace function public.room_apply_durations()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.timer_status = 'idle' and (
       new.focus_minutes is distinct from old.focus_minutes
    or new.short_minutes is distinct from old.short_minutes
    or new.long_minutes  is distinct from old.long_minutes) then
    new.timer_duration_ms := 60000 * case new.timer_mode
      when 'focus' then new.focus_minutes
      when 'short' then new.short_minutes
      else new.long_minutes end;
    new.timer_remaining_ms := new.timer_duration_ms;
  end if;
  return new;
end $$;

create trigger study_rooms_durations before update on public.study_rooms
  for each row execute function public.room_apply_durations();

-- Public lobby: only public rooms, only summary columns (no member identities).
-- Readable without signing in so visitors can browse open rooms.
create or replace function public.list_public_rooms()
returns table (id uuid, code text, name text, scene text, member_count bigint, last_active_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select r.id, r.code, r.name, r.scene,
         (select count(*) from public.room_members m where m.room_id = r.id) as member_count,
         r.last_active_at
  from public.study_rooms r
  where r.is_public
  order by r.last_active_at desc
  limit 30;
$$;

-- Lock down function execution to signed-in users (guests are anonymous users).
revoke execute on function public.create_room(text, boolean, text) from public, anon;
revoke execute on function public.join_room(text) from public, anon;
revoke execute on function public.leave_room(uuid) from public, anon;
revoke execute on function public.room_timer(uuid, text, text) from public, anon;
revoke execute on function public.list_public_rooms() from public;
revoke execute on function public.is_room_member(uuid) from public, anon;
revoke execute on function public.shares_room_with(uuid) from public, anon;
revoke execute on function public.display_name_of(uuid) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.create_room(text, boolean, text) to authenticated;
grant execute on function public.join_room(text) to authenticated;
grant execute on function public.leave_room(uuid) to authenticated;
grant execute on function public.room_timer(uuid, text, text) to authenticated;
grant execute on function public.list_public_rooms() to anon, authenticated;
grant execute on function public.is_room_member(uuid) to authenticated;
grant execute on function public.shares_room_with(uuid) to authenticated;
grant execute on function public.server_now() to anon, authenticated;

-- ---------------------------------------------------------------------
--  Realtime: shared timer, membership and messages
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.study_rooms, public.room_members, public.room_messages;
