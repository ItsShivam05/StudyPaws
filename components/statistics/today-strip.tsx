"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useStats } from "@/hooks/use-stats";
import { usePreferences } from "@/lib/stores/preferences";
import { useUiStore } from "@/lib/stores/ui";
import { cn, formatDuration } from "@/lib/utils";

/** Minimal "today" summary shown under the room. */
export function TodayStrip({ className }: { className?: string }) {
  const stats = useStats();
  const goal = usePreferences((p) => p.dailyGoalMinutes);
  const hydrated = useUiStore((s) => s.hydrated);
  const pct = Math.min(1, stats.todaySeconds / 60 / goal);
  const reached = pct >= 1;

  const items = [
    { label: "Focused today", value: formatDuration(stats.todaySeconds) },
    { label: "Sessions", value: String(stats.todaySessions) },
    { label: "Day streak", value: String(stats.streak) },
  ];

  return (
    <Link
      href="/journal"
      className={cn(
        "group block rounded-[28px] px-1 py-1 transition-opacity duration-500",
        hydrated ? "opacity-100" : "opacity-0",
        className,
      )}
      aria-label="Open your study journal"
    >
      <dl className="grid grid-cols-3 gap-2">
        {items.map((it) => (
          <div key={it.label} className="px-3 py-1">
            <dt className="text-xs text-muted">{it.label}</dt>
            <dd className="tabular mt-0.5 font-display text-2xl text-ink">{it.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 px-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{reached ? "Daily goal reached — wonderful" : `Daily goal · ${formatDuration(goal * 60)}`}</span>
          <span className="tabular">{Math.round(pct * 100)}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
          <motion.div
            className={cn("h-full rounded-full", reached ? "bg-glow" : "bg-accent-strong")}
            initial={false}
            animate={{ width: `${pct * 100}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />
        </div>
      </div>
    </Link>
  );
}
