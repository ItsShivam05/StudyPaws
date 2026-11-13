"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AmbienceId } from "@/types";

export interface AmbienceState {
  levels: Record<AmbienceId, number>;
  enabled: Record<AmbienceId, boolean>;
  master: number;
}

const off: Record<AmbienceId, boolean> = {
  rain: false,
  thunder: false,
  fire: false,
  forest: false,
  ocean: false,
  cafe: false,
};

export const useAmbienceStore = create<AmbienceState>()(
  persist(
    (): AmbienceState => ({
      levels: { rain: 0.6, thunder: 0.45, fire: 0.5, forest: 0.5, ocean: 0.5, cafe: 0.4 },
      enabled: { ...off },
      master: 0.8,
    }),
    {
      name: "sp-ambience",
      version: 1,
      skipHydration: true,
      // Browsers block autoplay, so sounds always start switched off;
      // the mix itself (levels) is remembered.
      partialize: (s) => ({ levels: s.levels, master: s.master }),
    },
  ),
);

/** Levels actually playing (0 when a sound is toggled off). */
export function effectiveLevels(s: AmbienceState) {
  const out: Partial<Record<AmbienceId, number>> = {};
  for (const id of Object.keys(s.levels) as AmbienceId[]) {
    out[id] = s.enabled[id] ? s.levels[id] : 0;
  }
  return out;
}
