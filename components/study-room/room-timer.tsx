"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import type { RoomTimerMode, StudyRoom } from "@/types";
import type { TimerAction } from "@/lib/rooms";
import { TimerRing } from "@/components/timer/timer-ring";
import { Segmented } from "@/components/ui/controls";
import { IconButton } from "@/components/ui/button";
import { cn, formatClock } from "@/lib/utils";

const LABELS: Record<RoomTimerMode, string> = { focus: "Focus", short: "Short break", long: "Long break" };

/** The shared timer. Any member can drive it; changes sync to everyone. */
export function RoomTimer({
  room,
  remaining,
  onAction,
}: {
  room: StudyRoom;
  remaining: number;
  onAction: (a: TimerAction, mode?: RoomTimerMode) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const running = room.timer_status === "running";
  const focus = room.timer_mode === "focus";
  const progress = room.timer_duration_ms ? 1 - remaining / room.timer_duration_ms : 0;

  const run = async (a: TimerAction, mode?: RoomTimerMode) => {
    setBusy(true);
    try {
      await onAction(a, mode);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Shared room timer" className="flex w-full max-w-sm flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <TimerRing progress={progress} tone={focus ? "focus" : "break"} size={170} stroke={5} label={`${LABELS[room.timer_mode]} progress`} className="w-[170px] shrink-0">
        <span className="text-[11px] font-medium text-muted">
          {running ? (focus ? "Focusing together" : "Break time") : room.timer_status === "paused" ? "Paused" : "Ready"}
        </span>
        <span className="tabular font-display text-4xl font-light leading-none [font-variation-settings:'SOFT'_100,'opsz'_144]">
          {formatClock(remaining)}
        </span>
      </TimerRing>

      <div className="flex flex-col items-center gap-3 sm:items-start">
        <Segmented
          label="Room timer mode"
          layoutId="room-mode"
          size="sm"
          value={room.timer_mode}
          onChange={(m) => void run("set_mode", m)}
          options={(["focus", "short", "long"] as const).map((m) => ({ value: m, label: LABELS[m] }))}
        />
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            disabled={busy}
            onClick={() => void run(running ? "pause" : "start")}
            className={cn(
              "flex h-11 min-w-32 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium shadow-soft transition-colors disabled:opacity-60",
              running ? "bg-surface-2 text-ink" : "bg-ink text-bg hover:bg-ink/90",
            )}
          >
            {running ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4" fill="currentColor" />}
            {running ? "Pause" : room.timer_status === "paused" ? "Resume" : focus ? "Start together" : "Start break"}
          </motion.button>
          <IconButton label="Reset room timer" size="sm" disabled={busy || room.timer_status === "idle"} onClick={() => void run("reset")}>
            <RotateCcw />
          </IconButton>
          <IconButton label={focus ? "Skip to break" : "Skip to focus"} size="sm" disabled={busy} onClick={() => void run("skip")}>
            <SkipForward />
          </IconButton>
        </div>
        <p className="text-xs text-muted">
          Round {(room.cycle_count % 4) + 1} of 4 · {room.focus_minutes}/{room.short_minutes}/{room.long_minutes} min
        </p>
      </div>
    </section>
  );
}
