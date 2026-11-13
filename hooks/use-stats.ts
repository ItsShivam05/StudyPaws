"use client";

import { useMemo } from "react";
import { useStatsStore } from "@/lib/stores/stats";
import { summarize } from "@/lib/stats";
import { useNow } from "./use-now";
import { dayKey } from "@/lib/utils";

export function useStats() {
  const sessions = useStatsStore((s) => s.sessions);
  // Re-evaluate when the calendar day changes.
  const day = dayKey(new Date(useNow(60_000)));
  return useMemo(() => {
    void day;
    return summarize(sessions);
  }, [sessions, day]);
}
