"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MusicCategory, RepeatMode } from "@/types";
import { TRACKS } from "@/lib/audio/tracks";

export interface MusicState {
  trackId: string;
  category: MusicCategory | "all";
  playing: boolean;
  volume: number; // 0..1
  muted: boolean;
  repeat: RepeatMode;
  elapsed: number; // seconds into the current track
}

export const useMusicStore = create<MusicState>()(
  persist(
    (): MusicState => ({
      trackId: TRACKS[0].id,
      category: "all" as MusicCategory | "all",
      playing: false,
      volume: 0.55,
      muted: false,
      repeat: "all" as RepeatMode,
      elapsed: 0,
    }),
    {
      name: "sp-music",
      version: 1,
      skipHydration: true,
      partialize: (s) => ({
        trackId: s.trackId,
        category: s.category,
        volume: s.volume,
        muted: s.muted,
        repeat: s.repeat,
      }),
    },
  ),
);
