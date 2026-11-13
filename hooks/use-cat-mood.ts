"use client";

import type { CatMood, TimerMode, TimerStatus } from "@/types";
import { useUiStore } from "@/lib/stores/ui";
import { useNow } from "./use-now";

const DOZE_AFTER_MS = 3 * 60_000;

/**
 * Derives the cat's mood from what you're doing:
 * focusing → studying, on a break → happy, idle for a while → sleeping,
 * just finished → celebrating (via the UI store override).
 */
export function useCatMood(mode: TimerMode | "focus", status: TimerStatus): CatMood {
  const override = useUiStore((s) => s.moodOverride);
  const lastInteraction = useUiStore((s) => s.lastInteraction);
  const hydrated = useUiStore((s) => s.hydrated);
  const now = useNow(1000);

  // Server and first client render must agree: no time-based moods before hydration.
  if (!hydrated) return "idle";
  if (override && override.until > now) return override.mood;
  const focus = mode === "focus" || mode === "custom";
  if (status === "running") return focus ? "studying" : "happy";
  if (now - lastInteraction > DOZE_AFTER_MS) return "sleeping";
  return "idle";
}

export type StudyActivity = "focus" | "break" | "idle";

/**
 * What the timer itself is doing, ignoring temporary moods (petting,
 * celebrating). Drives the student and where the cat sits.
 */
export function useStudyActivity(mode: TimerMode | "focus", status: TimerStatus): StudyActivity {
  const hydrated = useUiStore((s) => s.hydrated);
  if (!hydrated || status !== "running") return "idle";
  return mode === "focus" || mode === "custom" ? "focus" : "break";
}
