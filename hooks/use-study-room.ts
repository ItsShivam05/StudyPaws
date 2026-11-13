"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";
import { getSupabase, friendlyError } from "@/lib/supabase/client";
import { useAuthStore, myAvatar } from "@/lib/supabase/auth";
import {
  fetchMembers,
  fetchMessages,
  fetchRoom,
  joinRoom,
  measureClockOffset,
  roomTimer,
  touchMembership,
  type TimerAction,
} from "@/lib/rooms";
import { useStatsStore } from "@/lib/stores/stats";
import { usePreferences } from "@/lib/stores/preferences";
import { useUiStore } from "@/lib/stores/ui";
import { playChime } from "@/lib/audio/chime";
import type { PresenceState, PresenceStatus, RoomMember, RoomMessage, StudyRoom } from "@/types";

export type RoomStatus = "waiting-identity" | "joining" | "ready" | "error" | "closed";

const MIN_RECORD_MS = 60_000;
const MIN_COMPLETED_MS = 15_000;

export function roomRemaining(room: StudyRoom, now: number, offset: number) {
  if (room.timer_status === "running" && room.timer_ends_at) {
    return Math.min(room.timer_duration_ms, Math.max(0, new Date(room.timer_ends_at).getTime() - (now + offset)));
  }
  return room.timer_remaining_ms;
}

/**
 * Everything a study room needs in real time:
 *  - membership via join_room(code)
 *  - shared timer + settings via postgres_changes on study_rooms
 *  - activity feed via postgres_changes on room_messages
 *  - who's online / focusing via Realtime Presence
 */
export function useStudyRoom(code: string) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? null;
  const authReady = useAuthStore((s) => s.ready);
  const profile = useAuthStore((s) => s.profile);
  const avatar = useAuthStore((s) => myAvatar(s));

  // Result of the current join attempt, tagged with what it was for.
  const [join, setJoin] = useState<{ key: string; status: RoomStatus; error: string | null }>({
    key: "",
    status: "joining",
    error: null,
  });
  const joinKey = `${code}:${userId ?? ""}`;
  const setStatus = useCallback(
    (status: RoomStatus, error: string | null = null) => setJoin({ key: joinKey, status, error }),
    [joinKey],
  );
  const [floaters, setFloaters] = useState<RoomMessage[]>([]);
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [presence, setPresence] = useState<PresenceState[]>([]);
  const [away, setAway] = useState(false);
  const [offset, setOffset] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const roomRef = useRef<StudyRoom | null>(null);
  const offsetRef = useRef(0);
  const completingRef = useRef<string | null>(null);
  // Focus time this participant actually spent in the current shared block.
  const focusRef = useRef<{ ms: number; last: number | null; startedAt: number | null }>({ ms: 0, last: null, startedAt: null });

  const recordFocus = useCallback((completed: boolean) => {
    const f = focusRef.current;
    const r = roomRef.current;
    // Early stops need a real minute; a block the room actually finished always counts.
    if (r && f.ms >= (completed ? MIN_COMPLETED_MS : MIN_RECORD_MS)) {
      const end = Date.now();
      useStatsStore.getState().add({
        startedAt: new Date(f.startedAt ?? end - f.ms).toISOString(),
        endedAt: new Date(end).toISOString(),
        durationSeconds: Math.round(f.ms / 1000),
        completed,
        roomId: r.id,
      });
    }
    focusRef.current = { ms: 0, last: null, startedAt: null };
  }, []);

  /** Single entry point for new room state (RPC results and realtime events). */
  const applyRoom = useCallback(
    (next: StudyRoom) => {
      const prev = roomRef.current;
      if (prev && prev.id === next.id) {
        if (new Date(next.timer_updated_at) < new Date(prev.timer_updated_at)) return; // stale event
        const wasFocusBlock = prev.timer_mode === "focus" && prev.timer_status !== "idle";
        const leftFocusBlock = next.timer_mode !== "focus" || next.timer_status === "idle";
        if (wasFocusBlock && leftFocusBlock) {
          const ended =
            prev.timer_status === "running" &&
            prev.timer_ends_at !== null &&
            new Date(prev.timer_ends_at).getTime() <= Date.now() + offsetRef.current + 2500;
          recordFocus(ended);
          if (ended) {
            const prefs = usePreferences.getState();
            useUiStore.getState().celebrate();
            if (prefs.soundEnabled) playChime(prefs.chimeVolume, "focus-done");
          }
        } else if (
          prev.timer_mode !== "focus" &&
          prev.timer_status === "running" &&
          next.timer_mode === "focus" &&
          next.timer_status === "idle"
        ) {
          const prefs = usePreferences.getState();
          if (prefs.soundEnabled) playChime(prefs.chimeVolume, "break-done");
        }
      }
      roomRef.current = next;
      setRoom(next);
    },
    [recordFocus],
  );

  const refreshMembers = useCallback(async (roomId: string) => {
    try {
      setMembers(await fetchMembers(roomId));
    } catch {
      /* keep previous list */
    }
  }, []);

  // Join + subscribe
  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !authReady || !userId) return;

    let cancelled = false;
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    (async () => {
      try {
        const joined = await joinRoom(code);
        if (cancelled) return;
        roomRef.current = null;
        applyRoom(joined);
        const [off, mem, msgs] = await Promise.all([
          measureClockOffset(),
          fetchMembers(joined.id),
          fetchMessages(joined.id),
        ]);
        if (cancelled) return;
        offsetRef.current = off;
        setOffset(off);
        setMembers(mem);
        setMessages(msgs);

        const channel = sb.channel(`room:${joined.id}`, { config: { presence: { key: userId } } });
        channelRef.current = channel;

        channel
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "study_rooms", filter: `id=eq.${joined.id}` },
            (payload) => applyRoom(payload.new as StudyRoom),
          )
          .on("postgres_changes", { event: "DELETE", schema: "public", table: "study_rooms" }, (payload) => {
            if ((payload.old as { id?: string }).id === joined.id) setStatus("closed");
          })
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${joined.id}` },
            (payload) => {
              const m = payload.new as RoomMessage;
              setMessages((list) => (list.some((x) => x.id === m.id) ? list : [...list.slice(-119), m]));
              if (m.kind !== "event") {
                setFloaters((f) => [...f.slice(-3), m]);
                setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== m.id)), 4200);
              }
            },
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "room_members", filter: `room_id=eq.${joined.id}` },
            () => void refreshMembers(joined.id),
          )
          .on("postgres_changes", { event: "DELETE", schema: "public", table: "room_members" }, (payload) => {
            const old = payload.old as { room_id?: string; user_id?: string };
            if (old.room_id && old.room_id !== joined.id) return;
            if (old.user_id === userId) setStatus("closed");
            else void refreshMembers(joined.id);
          })
          .on("presence", { event: "sync" }, () => {
            const state = channel.presenceState<PresenceState>();
            const list = Object.values(state)
              .map((entries) => entries[entries.length - 1])
              .filter(Boolean) as PresenceState[];
            setPresence(list);
          })
          .subscribe(async (s) => {
            if (s === "SUBSCRIBED") {
              // (Re)connected: catch up on anything we missed while offline.
              const [fresh, msgs2] = await Promise.all([fetchRoom(joined.id), fetchMessages(joined.id)]);
              if (cancelled) return;
              if (!fresh) {
                setStatus("closed");
                return;
              }
              applyRoom(fresh);
              setMessages(msgs2);
              void refreshMembers(joined.id);
              setStatus("ready");
            } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
              toast("Reconnecting to the room…", { id: "room-reconnect" });
            }
          });

        heartbeat = setInterval(() => void touchMembership(joined.id, userId), 120_000);
      } catch (e) {
        if (cancelled) return;
        setStatus("error", friendlyError(e));
      }
    })();

    return () => {
      cancelled = true;
      if (heartbeat) clearInterval(heartbeat);
      const r = roomRef.current;
      if (r) {
        if (r.timer_mode === "focus" && r.timer_status !== "idle") recordFocus(false);
        void touchMembership(r.id, userId).catch(() => {});
      }
      if (channelRef.current) {
        void sb.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [code, authReady, userId, applyRoom, refreshMembers, recordFocus, setStatus]);

  // Derived status: no synchronous state juggling in effects.
  const status: RoomStatus = !getSupabase()
    ? "error"
    : !authReady
      ? "joining"
      : !userId
        ? "waiting-identity"
        : join.key === joinKey
          ? join.status
          : "joining";
  const error = !getSupabase()
    ? "Study rooms need Supabase. See the README to connect a project."
    : join.key === joinKey
      ? join.error
      : null;

  // My presence payload
  const myStatus: PresenceStatus = useMemo(() => {
    if (away) return "away";
    if (!room || room.timer_status !== "running") return "idle";
    return room.timer_mode === "focus" ? "focusing" : "break";
  }, [away, room]);

  useEffect(() => {
    const ch = channelRef.current;
    if (!ch || status !== "ready" || !userId) return;
    void ch.track({
      user_id: userId,
      display_name: profile?.display_name ?? "Study buddy",
      avatar,
      status: myStatus,
      online_at: new Date().toISOString(),
    } satisfies PresenceState);
  }, [status, myStatus, profile, avatar, userId]);

  /** Called by the page ticker: accrues my focus time and completes finished blocks. */
  const tick = useCallback(
    (now: number) => {
      const r = roomRef.current;
      if (!r) return;
      const f = focusRef.current;
      if (r.timer_mode === "focus" && r.timer_status === "running" && !away) {
        if (f.last !== null) f.ms += Math.min(now - f.last, 120_000);
        f.startedAt ??= now;
        f.last = now;
      } else {
        f.last = null;
      }
      if (r.timer_status === "running" && r.timer_ends_at && roomRemaining(r, now, offsetRef.current) <= 0) {
        if (completingRef.current !== r.timer_ends_at) {
          completingRef.current = r.timer_ends_at;
          roomTimer(r.id, "complete")
            .then(applyRoom)
            .catch(() => {
              completingRef.current = null;
            });
        }
      }
    },
    [applyRoom, away],
  );

  const act = useCallback(
    async (action: TimerAction, mode?: "focus" | "short" | "long") => {
      const r = roomRef.current;
      if (!r) return;
      try {
        applyRoom(await roomTimer(r.id, action, mode));
      } catch (e) {
        toast.error(friendlyError(e));
      }
    },
    [applyRoom],
  );

  const online = useMemo(() => new Map(presence.map((p) => [p.user_id, p])), [presence]);

  return {
    status,
    error,
    room,
    members,
    messages,
    presence,
    online,
    floaters,
    offset,
    away,
    setAway,
    tick,
    act,
    me: user,
  };
}
