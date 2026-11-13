"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StudySession } from "@/types";
import { uuid } from "@/lib/utils";

const KEEP_DAYS = 400;

interface StatsState {
  sessions: StudySession[];
  /** Which account the cached sessions belong to (null = local guest). */
  accountId: string | null;
  accountIsAnon: boolean;
  add: (s: Omit<StudySession, "id" | "synced"> & { id?: string }) => StudySession;
  markSynced: (ids: string[]) => void;
  mergeRemote: (remote: StudySession[]) => void;
  /** Called when the signed-in user changes. */
  switchAccount: (userId: string | null, isAnon: boolean) => void;
}

function prune(list: StudySession[]) {
  const cutoff = Date.now() - KEEP_DAYS * 86400000;
  return list
    .filter((s) => new Date(s.endedAt).getTime() >= cutoff)
    .sort((a, b) => a.endedAt.localeCompare(b.endedAt));
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      sessions: [],
      accountId: null,
      accountIsAnon: false,
      add: (s) => {
        const session: StudySession = { ...s, id: s.id ?? uuid(), synced: false };
        set({ sessions: prune([...get().sessions, session]) });
        return session;
      },
      markSynced: (ids) => {
        const set_ = new Set(ids);
        set({ sessions: get().sessions.map((s) => (set_.has(s.id) ? { ...s, synced: true } : s)) });
      },
      mergeRemote: (remote) => {
        const byId = new Map(get().sessions.map((s) => [s.id, s]));
        for (const r of remote) byId.set(r.id, { ...r, synced: true });
        set({ sessions: prune([...byId.values()]) });
      },
      switchAccount: (userId, isAnon) => {
        const { accountId, accountIsAnon, sessions } = get();
        if (userId === accountId) {
          if (isAnon !== accountIsAnon) set({ accountIsAnon: isAnon });
          return;
        }
        if (userId === null) {
          // Signed out: a real account's data lives in the cloud, so drop the cache.
          // Anonymous / guest data stays on this device.
          set({ sessions: accountId && !accountIsAnon ? [] : sessions, accountId: null, accountIsAnon: false });
          return;
        }
        if (accountId === null || accountIsAnon) {
          // Guest (or anonymous) progress is carried into the new account.
          // Fresh ids so rows owned by the anonymous user never collide.
          set({
            sessions: sessions.map((s) => ({ ...s, id: s.synced ? uuid() : s.id, synced: false })),
            accountId: userId,
            accountIsAnon: isAnon,
          });
          return;
        }
        // Switching between two real accounts: start clean.
        set({ sessions: [], accountId: userId, accountIsAnon: isAnon });
      },
    }),
    {
      name: "sp-stats",
      version: 1,
      skipHydration: true,
      partialize: (s) => ({ sessions: s.sessions, accountId: s.accountId, accountIsAnon: s.accountIsAnon }),
    },
  ),
);
