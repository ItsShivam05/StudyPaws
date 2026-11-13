"use client";

import { getSupabase } from "./client";
import { useAuthStore } from "./auth";
import { useStatsStore } from "@/lib/stores/stats";
import { pickPreferences, usePreferences } from "@/lib/stores/preferences";
import { useNotesStore } from "@/lib/stores/notes";
import type { StudySession } from "@/types";

/**
 * Keeps local stores and the signed-in user's rows in step.
 *  - sessions: local-first; unsynced rows are uploaded idempotently (client UUIDs)
 *  - preferences / notes: last-writer-wins on `updated_at`
 */

interface SessionRow {
  id: string;
  room_id: string | null;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  completed: boolean;
}

const fromRow = (r: SessionRow): StudySession => ({
  id: r.id,
  roomId: r.room_id,
  startedAt: r.started_at,
  endedAt: r.ended_at,
  durationSeconds: r.duration_seconds,
  completed: r.completed,
  synced: true,
});

let started = false;
let applyingRemote = false;
let currentUser: string | null = null;

function debounce(fn: () => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (t) clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

async function uploadSessions() {
  const sb = getSupabase();
  const userId = currentUser;
  if (!sb || !userId) return;
  const pending = useStatsStore.getState().sessions.filter((s) => !s.synced);
  if (!pending.length) return;
  const rows = pending.map((s) => ({
    id: s.id,
    user_id: userId,
    room_id: s.roomId ?? null,
    started_at: s.startedAt,
    ended_at: s.endedAt,
    duration_seconds: s.durationSeconds,
    completed: s.completed,
  }));
  let { error } = await sb.from("study_sessions").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (error?.code === "23503") {
    // A referenced room no longer exists; keep the time, drop the link.
    ({ error } = await sb
      .from("study_sessions")
      .upsert(rows.map((r) => ({ ...r, room_id: null })), { onConflict: "id", ignoreDuplicates: true }));
  }
  if (!error) {
    if (currentUser === userId) useStatsStore.getState().markSynced(pending.map((p) => p.id));
    return;
  }
  // One bad row (e.g. a clock far in the future) must not block the rest: go row by row.
  if (rows.length > 1) {
    const ok: string[] = [];
    for (const row of rows) {
      const { error: rowError } = await sb.from("study_sessions").upsert(row, { onConflict: "id", ignoreDuplicates: true });
      if (!rowError) ok.push(row.id);
    }
    if (ok.length && currentUser === userId) useStatsStore.getState().markSynced(ok);
  }
}

async function pullSessions(userId: string) {
  const sb = getSupabase();
  if (!sb) return;
  const since = new Date(Date.now() - 400 * 86400000).toISOString();
  const { data, error } = await sb
    .from("study_sessions")
    .select("id, room_id, started_at, ended_at, duration_seconds, completed")
    .gte("ended_at", since)
    .order("ended_at", { ascending: true })
    .limit(5000);
  if (!error && data && currentUser === userId) useStatsStore.getState().mergeRemote((data as SessionRow[]).map(fromRow));
}

async function syncPreferences(userId: string) {
  const sb = getSupabase();
  if (!sb) return;
  const { data } = await sb.from("user_preferences").select("settings, updated_at").eq("user_id", userId).maybeSingle();
  if (currentUser !== userId) return;
  const local = usePreferences.getState();
  const remoteAt = data ? new Date(data.updated_at as string).getTime() : 0;
  if (data && remoteAt >= local.updatedAt) {
    applyingRemote = true;
    usePreferences.getState().replace(data.settings ?? {}, remoteAt);
    applyingRemote = false;
  } else {
    await pushPreferences();
  }
}

async function pushPreferences() {
  const sb = getSupabase();
  const userId = currentUser;
  if (!sb || !userId) return;
  const s = usePreferences.getState();
  await sb.from("user_preferences").upsert({
    user_id: userId,
    settings: pickPreferences(s),
    updated_at: new Date(s.updatedAt || Date.now()).toISOString(),
  });
}

async function syncNotes(userId: string) {
  const sb = getSupabase();
  if (!sb) return;
  const { data } = await sb.from("study_notes").select("content, updated_at").eq("user_id", userId).maybeSingle();
  if (currentUser !== userId) return;
  const local = useNotesStore.getState();
  const remoteAt = data ? new Date(data.updated_at as string).getTime() : 0;
  if (data && remoteAt >= local.updatedAt) {
    applyingRemote = true;
    useNotesStore.getState().replace((data.content as string) ?? "", remoteAt);
    applyingRemote = false;
  } else if (local.content) {
    await pushNotes();
  }
}

async function pushNotes() {
  const sb = getSupabase();
  const userId = currentUser;
  if (!sb || !userId) return;
  const s = useNotesStore.getState();
  await sb.from("study_notes").upsert({
    user_id: userId,
    content: s.content,
    updated_at: new Date(s.updatedAt || Date.now()).toISOString(),
  });
}

async function onUser(userId: string | null, isAnon: boolean) {
  useStatsStore.getState().switchAccount(userId, isAnon);
  currentUser = userId;
  if (!userId) return;
  await Promise.allSettled([
    uploadSessions().then(() => pullSessions(userId)),
    syncPreferences(userId),
    syncNotes(userId),
  ]);
}

export function startSync() {
  if (started || !getSupabase()) return;
  started = true;

  let lastKey = "";
  const check = (s: ReturnType<typeof useAuthStore.getState>) => {
    if (!s.ready) return;
    const key = s.user?.id ?? "none";
    if (key === lastKey) return;
    lastKey = key;
    // Every identity is a browser-bound anonymous user (no accounts).
    void onUser(s.user?.id ?? null, true);
  };
  check(useAuthStore.getState());
  useAuthStore.subscribe(check);

  const upload = debounce(() => void uploadSessions(), 600);
  useStatsStore.subscribe((s, prev) => {
    if (s.sessions !== prev.sessions && s.sessions.some((x) => !x.synced)) upload();
  });

  const savePrefs = debounce(() => void pushPreferences(), 1200);
  usePreferences.subscribe((s, prev) => {
    if (!applyingRemote && s.updatedAt !== prev.updatedAt && currentUser) savePrefs();
  });

  const saveNotes = debounce(() => void pushNotes(), 1500);
  useNotesStore.subscribe((s, prev) => {
    if (!applyingRemote && s.updatedAt !== prev.updatedAt && currentUser) saveNotes();
  });

  // Retry anything that failed while offline.
  window.addEventListener("online", () => void uploadSessions());
}
