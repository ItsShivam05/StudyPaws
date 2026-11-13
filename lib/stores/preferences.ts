"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_PREFERENCES, type Preferences } from "@/types";

interface PreferencesState extends Preferences {
  updatedAt: number;
  set: (patch: Partial<Preferences>) => void;
  replace: (prefs: Partial<Preferences>, updatedAt: number) => void;
}

/** Keep remote / imported values within sane bounds. */
export function sanitizePreferences(input: Partial<Preferences>): Partial<Preferences> {
  const out: Partial<Preferences> = {};
  const num = (v: unknown, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : undefined;
  const bool = (v: unknown) => (typeof v === "boolean" ? v : undefined);
  const pick = <T extends string>(v: unknown, allowed: readonly T[]) =>
    typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;

  const entries: Partial<Preferences> = {
    focusMinutes: num(input.focusMinutes, 1, 180),
    shortMinutes: num(input.shortMinutes, 1, 60),
    longMinutes: num(input.longMinutes, 1, 90),
    customMinutes: num(input.customMinutes, 1, 240),
    longBreakInterval: num(input.longBreakInterval, 2, 8),
    autoStartBreaks: bool(input.autoStartBreaks),
    autoStartFocus: bool(input.autoStartFocus),
    soundEnabled: bool(input.soundEnabled),
    chimeVolume:
      typeof input.chimeVolume === "number" ? Math.min(1, Math.max(0, input.chimeVolume)) : undefined,
    notificationsEnabled: bool(input.notificationsEnabled),
    theme: pick(input.theme, ["light", "dark", "system"] as const),
    scene: pick(input.scene, ["rainy", "sunny", "night", "snowy"] as const),
    dailyGoalMinutes: num(input.dailyGoalMinutes, 10, 960),
    catName:
      typeof input.catName === "string" && input.catName.trim()
        ? input.catName.trim().slice(0, 20)
        : undefined,
    catCoat: pick(input.catCoat, ["ginger", "grey", "midnight", "calico", "cream", "snow"] as const),
    showQuote: bool(input.showQuote),
    lowMotion: bool(input.lowMotion),
    showBuddy: bool(input.showBuddy),
    roomArt: pick(input.roomArt, [
      "classic",
      "golden-hour",
      "rainy-night",
      "sunday-morning",
      "midnight-journal",
      "hillside-town",
      "snowy-cabin",
    ] as const),
  };
  for (const [k, v] of Object.entries(entries)) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

export function pickPreferences(s: PreferencesState): Preferences {
  const out = {} as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_PREFERENCES)) {
    out[key] = s[key as keyof Preferences];
  }
  return out as unknown as Preferences;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      updatedAt: 0,
      set: (patch) => set({ ...sanitizePreferences(patch), updatedAt: Date.now() }),
      replace: (prefs, updatedAt) => set({ ...sanitizePreferences(prefs), updatedAt }),
    }),
    {
      name: "sp-preferences",
      version: 2,
      skipHydration: true,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<PreferencesState>;
        if (version < 2) {
          // v2: the study buddy became opt-in (the classic room shows an empty
          // seat instead). Bumping updatedAt makes this local change win over
          // an older copy synced to the cloud, and it gets pushed up next sync.
          return { ...state, showBuddy: false, updatedAt: Date.now() };
        }
        return state;
      },
    },
  ),
);
