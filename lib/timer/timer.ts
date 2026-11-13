"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TimerMode, TimerStatus } from "@/types";
import { usePreferences } from "@/lib/stores/preferences";
import { useStatsStore } from "@/lib/stores/stats";

/**
 * Personal Pomodoro timer.
 *
 * The timer never counts down by decrementing. While running it stores the
 * wall-clock moment it ends (`endsAt`), so the remaining time is always
 * `endsAt - now` — accurate after tab switches, sleep, or a page reload.
 */

export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  durationMs: number;
  remainingMs: number; // authoritative while idle/paused
  endsAt: number | null; // authoritative while running
  startedAt: number | null; // wall time the current focus block began
  cycle: number; // focus blocks finished since the last long break
}

export type TimerEvent =
  | { type: "complete"; mode: TimerMode; next: TimerMode; stale: boolean; autoStarted: boolean }
  | { type: "start"; mode: TimerMode };

type Listener = (e: TimerEvent) => void;
const listeners = new Set<Listener>();
export function onTimerEvent(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function emit(e: TimerEvent) {
  listeners.forEach((l) => l(e));
}

export const MIN_PARTIAL_MS = 60_000;

export function minutesFor(mode: TimerMode) {
  const p = usePreferences.getState();
  switch (mode) {
    case "focus":
      return p.focusMinutes;
    case "short":
      return p.shortMinutes;
    case "long":
      return p.longMinutes;
    case "custom":
      return p.customMinutes;
  }
}

export const isFocusMode = (m: TimerMode) => m === "focus" || m === "custom";

export const useTimerStore = create<TimerState>()(
  persist(
    (): TimerState => ({
      mode: "focus" as TimerMode,
      status: "idle" as TimerStatus,
      durationMs: 25 * 60_000,
      remainingMs: 25 * 60_000,
      endsAt: null,
      startedAt: null,
      cycle: 0,
    }),
    { name: "sp-timer", version: 1, skipHydration: true },
  ),
);

export function remainingOf(s: TimerState, now = Date.now()) {
  if (s.status === "running" && s.endsAt) return Math.min(s.durationMs, Math.max(0, s.endsAt - now));
  return s.remainingMs;
}

/** Records focused time from the current block (used on completion and on early stops). */
function recordFocus(s: TimerState, endedAt: number, completed: boolean) {
  if (!isFocusMode(s.mode)) return;
  const focusedMs = completed ? s.durationMs : s.durationMs - remainingOf(s, endedAt);
  if (!completed && focusedMs < MIN_PARTIAL_MS) return;
  const started = s.startedAt ?? endedAt - focusedMs;
  useStatsStore.getState().add({
    startedAt: new Date(started).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    durationSeconds: Math.max(1, Math.round(focusedMs / 1000)),
    completed,
    roomId: null,
  });
}

const set = (patch: Partial<TimerState>) => useTimerStore.setState(patch);
const get = () => useTimerStore.getState();

function idleIn(mode: TimerMode): Partial<TimerState> {
  const ms = minutesFor(mode) * 60_000;
  return { mode, status: "idle", durationMs: ms, remainingMs: ms, endsAt: null, startedAt: null };
}

export const timer = {
  start() {
    const s = get();
    if (s.status === "running") return;
    const now = Date.now();
    set({
      status: "running",
      endsAt: now + s.remainingMs,
      startedAt: s.startedAt ?? now,
    });
    if (s.status === "idle") emit({ type: "start", mode: s.mode });
  },

  pause() {
    const s = get();
    if (s.status !== "running") return;
    set({ status: "paused", remainingMs: remainingOf(s), endsAt: null });
  },

  toggle() {
    if (get().status === "running") timer.pause();
    else timer.start();
  },

  reset() {
    const s = get();
    if (s.status !== "idle") recordFocus(s, Date.now(), false);
    set(idleIn(s.mode));
  },

  setMode(mode: TimerMode) {
    const s = get();
    if (s.status !== "idle") recordFocus(s, Date.now(), false);
    set(idleIn(mode));
  },

  /** Jump to the next block without completion credit (partial focus still counts). */
  skip() {
    const s = get();
    if (s.status !== "idle") recordFocus(s, Date.now(), false);
    set(idleIn(nextMode(s.mode, s.cycle, false)));
  },

  setCustomMinutes(minutes: number) {
    usePreferences.getState().set({ customMinutes: minutes });
    timer.setMode("custom");
  },

  /** Re-read durations after the user changes settings (only affects an idle timer). */
  syncDurations() {
    const s = get();
    if (s.status === "idle") set(idleIn(s.mode));
  },

  /** Called by the ticker. Completes the block once its end time has passed. */
  tick(now = Date.now()) {
    const s = get();
    if (s.status !== "running" || !s.endsAt || now < s.endsAt) return;
    const endedAt = s.endsAt;
    const stale = now - endedAt > 60_000; // finished while the app was closed
    const wasFocus = isFocusMode(s.mode);
    recordFocus(s, endedAt, true);

    const cycle = wasFocus ? s.cycle + 1 : s.mode === "long" ? 0 : s.cycle;
    const next = nextMode(s.mode, cycle, true);
    const prefs = usePreferences.getState();
    const auto = !stale && (wasFocus ? prefs.autoStartBreaks : prefs.autoStartFocus);
    set({ ...idleIn(next), cycle });
    if (auto) timer.start();
    emit({ type: "complete", mode: s.mode, next, stale, autoStarted: auto });
  },
};

function nextMode(mode: TimerMode, cycle: number, completed: boolean): TimerMode {
  if (isFocusMode(mode)) {
    const interval = usePreferences.getState().longBreakInterval;
    return completed && cycle > 0 && cycle % interval === 0 ? "long" : "short";
  }
  return "focus";
}

export const MODE_LABELS: Record<TimerMode, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
  custom: "Custom",
};
