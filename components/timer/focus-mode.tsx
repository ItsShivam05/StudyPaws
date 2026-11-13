"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minimize2, Pause, Play, SlidersHorizontal } from "lucide-react";
import { useUiStore } from "@/lib/stores/ui";
import { timer, useTimerStore, remainingOf, MODE_LABELS, isFocusMode } from "@/lib/timer/timer";
import { useCatMood, useStudyActivity } from "@/hooks/use-cat-mood";
import { useNow } from "@/hooks/use-now";
import { RoomStage } from "@/components/scene/room-stage";
import { IconButton } from "@/components/ui/button";
import { musicPlayer } from "@/lib/audio/music";
import { useMusicStore } from "@/lib/stores/music";
import { formatClock } from "@/lib/utils";

export function enterFocusMode() {
  useUiStore.getState().setFocusMode(true);
  const el = document.documentElement;
  if (!document.fullscreenElement && el.requestFullscreen) {
    el.requestFullscreen().catch(() => {
      // Fullscreen can be refused (e.g. iOS); the in-app focus view still works.
    });
  }
}

export function exitFocusMode() {
  useUiStore.getState().setFocusMode(false);
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
}

/** Distraction-free view: the room fills the screen with a calm timer overlay. */
export function FocusMode() {
  const open = useUiStore((s) => s.focusMode);
  const setMixerOpen = useUiStore((s) => s.setMixerOpen);
  const s = useTimerStore();
  const playing = useMusicStore((m) => m.playing);
  const now = useNow(250, open && s.status === "running");
  const mood = useCatMood(s.mode, s.status);
  const activity = useStudyActivity(s.mode, s.status);
  const remaining = remainingOf(s, now);

  useEffect(() => {
    if (!open) return;
    const onFs = () => {
      if (!document.fullscreenElement) useUiStore.getState().setFocusMode(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitFocusMode();
      if (e.key === " " && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        timer.toggle();
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Focus mode"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[45] flex items-center justify-center bg-[var(--scene-wall)]"
        >
          <div className="relative w-full max-w-[calc(100dvh*1.6)]">
            <RoomStage mood={mood} activity={activity} rounded={false} art />
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-[4vh]">
            <div className="pointer-events-auto flex flex-col items-center rounded-[28px] bg-raised/75 px-8 py-4 text-center shadow-soft backdrop-blur-md">
              <span className="text-xs font-medium tracking-wide text-muted">
                {MODE_LABELS[s.mode]}
                {s.status === "paused" ? " · paused" : ""}
              </span>
              <span className="tabular font-display text-5xl font-light text-ink sm:text-6xl [font-variation-settings:'SOFT'_100,'opsz'_144]">
                {formatClock(remaining)}
              </span>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-[4vh]">
            <div className="flex items-center gap-2 rounded-full bg-raised/80 p-1.5 shadow-soft backdrop-blur-md">
              <button
                type="button"
                onClick={() => timer.toggle()}
                className="flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-bg"
              >
                {s.status === "running" ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4" fill="currentColor" />}
                {s.status === "running" ? "Pause" : isFocusMode(s.mode) ? "Focus" : "Break"}
              </button>
              <IconButton label={playing ? "Pause music" : "Play music"} onClick={() => musicPlayer.toggle()}>
                {playing ? <Pause /> : <Play />}
              </IconButton>
              <IconButton label="Ambient sounds" onClick={() => setMixerOpen(true)}>
                <SlidersHorizontal />
              </IconButton>
              <IconButton label="Exit focus mode" onClick={exitFocusMode}>
                <Minimize2 />
              </IconButton>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
