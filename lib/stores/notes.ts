"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotesState {
  content: string;
  updatedAt: number;
  setContent: (content: string) => void;
  replace: (content: string, updatedAt: number) => void;
}

export const NOTES_MAX = 20000;

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      content: "",
      updatedAt: 0,
      setContent: (content) => set({ content: content.slice(0, NOTES_MAX), updatedAt: Date.now() }),
      replace: (content, updatedAt) => set({ content: content.slice(0, NOTES_MAX), updatedAt }),
    }),
    { name: "sp-notes", version: 1, skipHydration: true },
  ),
);
