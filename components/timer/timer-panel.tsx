"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw, SkipForward, Maximize2 } from "lucide-react";
import type { TimerMode } from "@/types";
import { timer, useTimerStore, remainingOf, MODE_LABELS, isFocusMode } from "@/lib/timer/timer";
import { usePreferences } from "@/lib/stores/preferences";
import { useUiStore } from "@/lib/stores/ui";
import { useNow } from "@/hooks/use-now";
import { TimerRing } from "./timer-ring";
import { CustomTimerDialog } from "./custom-timer-dialog";
import { Segmented } from "@/components/ui/controls";
import { IconButton } from "@/components/ui/button";
import { cn, formatClock } from "@/lib/utils";

const MODES: { value: TimerMode; label: string }[] = [
  { value: "focus", label: "Focus" },
  { value: "short", label: "Short break" },
  { value: "long", label: "Long break" },
  { value: "custom", label: "Custom" },
];

export function TimerPanel({ onFocusMode, size = 300 }: { onFocusMode?: () => void; size?: number }) {
  const s = useTimerStore();
  const hydrated = useUiStore((u) => u.hydrated);
  const interval = usePreferences((p) => p.longBreakInterval);
  const customMinutes = usePreferences((p) => p.customMinutes);
  const now = useNow(250, s.status === "running");
  const [customOpen, setCustomOpen] = useState(false);

  const remaining = remainingOf(s, now);
  const progress = s.durationMs > 0 ? 1 - remaining / s.durationMs : 0;
  const focus = isFocusMode(s.mode);
  const running = s.status === "running";

  const statusText = running
    ? focus
      ? "Focusing"
      : "On a break"
    : s.status === "paused"
      ? "Paused"
      : focus
        ? "Ready when you are"
        : "Time to rest";

  return (
    <section aria-label="Study timer" className={cn("flex flex-col items-center gap-6 transition-opacity duration-500", hydrated ? "opacity-100" : "opacity-0")}>
      <Segmented
        label="Timer mode"
        layoutId="timer-mode"
        value={s.mode}
        onChange={(m) => {
          if (m === "custom") setCustomOpen(true);
          else timer.setMode(m);
        }}
        options={MODES.map((m) => ({
          value: m.value,
          label: m.value === "custom" && s.mode === "custom" ? `${customMinutes}m` : m.label,
        }))}
        size="sm"
      />

      <TimerRing progress={progress} tone={focus ? "focus" : "break"} size={size} label={`${MODE_LABELS[s.mode]} progress`}>
        <AnimatePresence mode="wait">
          <motion.span
            key={statusText}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-[13px] font-medium tracking-wide text-muted"
          >
            {statusText}
          </motion.span>
        </AnimatePresence>
        <time
          className="tabular mt-1 font-display text-[clamp(3rem,9vw,4.6rem)] font-light leading-none tracking-tight text-ink [font-variation-settings:'SOFT'_100,'opsz'_144]"
          aria-live="off"
        >
          {formatClock(remaining)}
        </time>
        <div className="mt-3 flex items-center gap-1.5" aria-label={`Session ${(s.cycle % interval) + 1} of ${interval} before a long break`}>
          {Array.from({ length: interval }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i < s.cycle % interval || (s.mode === "long" && s.cycle > 0) ? "w-4 bg-accent-strong" : "w-1.5 bg-ink/15",
              )}
            />
          ))}
        </div>
      </TimerRing>

      <div className="flex items-center gap-3">
        <IconButton label="Reset timer" onClick={() => timer.reset()} disabled={s.status === "idle"}>
          <RotateCcw />
        </IconButton>
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          whileHover={{ y: -1 }}
          onClick={() => timer.toggle()}
          className={cn(
            "flex h-14 min-w-36 items-center justify-center gap-2 rounded-full px-8 text-[15px] font-medium shadow-soft transition-colors duration-300",
            running ? "bg-surface-2 text-ink hover:bg-surface" : "bg-ink text-bg hover:bg-ink/90",
          )}
        >
          {running ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4" fill="currentColor" />}
          {running ? "Pause" : s.status === "paused" ? "Resume" : focus ? "Start focus" : "Start break"}
        </motion.button>
        <IconButton label={focus ? "Skip to break" : "Skip to focus"} onClick={() => timer.skip()}>
          <SkipForward />
        </IconButton>
      </div>

      {onFocusMode ? (
        <button
          type="button"
          onClick={onFocusMode}
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink"
        >
          <Maximize2 className="size-3.5" aria-hidden="true" /> Focus mode
        </button>
      ) : null}

      {/* Announce transitions for screen readers without reading every second */}
      <p className="sr-only" aria-live="polite">
        {MODE_LABELS[s.mode]} — {statusText}
      </p>

      <CustomTimerDialog open={customOpen} onClose={() => setCustomOpen(false)} />
    </section>
  );
}
