"use client";

import { create } from "zustand";
import type { CatMood } from "@/types";

interface UiState {
  /** True once persisted stores have been restored from localStorage. */
  hydrated: boolean;
  /** Temporary mood (petting, celebrating) that wins over the derived one. */
  moodOverride: { mood: CatMood; until: number } | null;
  /** Bumped on every celebration so the scene can play confetti once. */
  celebrateKey: number;
  focusMode: boolean;
  mixerOpen: boolean;
  lastInteraction: number;
  flashMood: (mood: CatMood, ms: number) => void;
  celebrate: () => void;
  setFocusMode: (on: boolean) => void;
  setMixerOpen: (open: boolean) => void;
  touch: () => void;
}

export const useUiStore = create<UiState>()((set, get) => ({
  hydrated: false,
  moodOverride: null,
  celebrateKey: 0,
  focusMode: false,
  mixerOpen: false,
  lastInteraction: Date.now(),
  flashMood: (mood, ms) => set({ moodOverride: { mood, until: Date.now() + ms } }),
  celebrate: () =>
    set({ moodOverride: { mood: "celebrating", until: Date.now() + 6000 }, celebrateKey: get().celebrateKey + 1 }),
  setFocusMode: (focusMode) => set({ focusMode }),
  setMixerOpen: (mixerOpen) => set({ mixerOpen }),
  touch: () => set({ lastInteraction: Date.now() }),
}));
