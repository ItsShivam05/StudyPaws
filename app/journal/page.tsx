"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Flame, Target } from "lucide-react";
import { useStats } from "@/hooks/use-stats";
import { usePreferences } from "@/lib/stores/preferences";
import { useNotesStore, NOTES_MAX } from "@/lib/stores/notes";
import { useUiStore } from "@/lib/stores/ui";
import { WeeklyChart } from "@/components/statistics/weekly-chart";
import { Stepper } from "@/components/ui/controls";
import { cn, formatDuration } from "@/lib/utils";

export default function JournalPage() {
  const stats = useStats();
  const hydrated = useUiStore((s) => s.hydrated);
  const goal = usePreferences((p) => p.dailyGoalMinutes);
  const setPrefs = usePreferences((p) => p.set);
  const todayPct = Math.min(1, stats.todaySeconds / 60 / goal);

  const tiles = [
    { label: "Focused today", value: formatDuration(stats.todaySeconds), hint: `${stats.todaySessions} completed ${stats.todaySessions === 1 ? "session" : "sessions"}` },
    { label: "This week", value: formatDuration(stats.weekSeconds), hint: "last 7 days" },
    { label: "Current streak", value: `${stats.streak} ${stats.streak === 1 ? "day" : "days"}`, hint: `best ${stats.bestStreak}` },
    { label: "Sessions completed", value: String(stats.completedSessions), hint: `${formatDuration(stats.totalSeconds)} in total` },
  ];

  return (
    <div className={cn("mx-auto max-w-6xl px-4 py-8 transition-opacity duration-500 sm:px-6 sm:py-10", hydrated ? "opacity-100" : "opacity-0")}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight tracking-tight [font-variation-settings:'SOFT'_100]">
            Study journal
          </h1>
          <p className="mt-1 text-[15px] text-muted">A gentle record of the time you&apos;ve spent learning.</p>
        </div>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.5 }}
            className="border-l border-line-strong pl-4"
          >
            <dt className="text-xs text-muted">{t.label}</dt>
            <dd className="tabular mt-1 font-display text-3xl tracking-tight sm:text-4xl">{t.value}</dd>
            <dd className="mt-1 text-xs text-muted">{t.hint}</dd>
          </motion.div>
        ))}
      </dl>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="week-title">
          <h2 id="week-title" className="mb-6 font-display text-2xl">
            Your week
          </h2>
          {stats.weekSeconds === 0 ? (
            <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-[28px] bg-ink/[0.03] text-center">
              <p className="font-display text-lg">Nothing here yet</p>
              <p className="max-w-xs text-sm text-muted">
                Finish a focus session and it&apos;ll bloom here.{" "}
                <Link href="/" className="text-ink underline underline-offset-4">
                  Start one now
                </Link>
                .
              </p>
            </div>
          ) : (
            <WeeklyChart week={stats.week} goalMinutes={goal} />
          )}
        </section>

        <section aria-labelledby="goal-title" className="flex flex-col gap-5">
          <h2 id="goal-title" className="font-display text-2xl">
            Daily goal
          </h2>
          <div className="flex items-center gap-5">
            <GoalRing pct={todayPct} />
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted">
                {todayPct >= 1 ? (
                  <span className="flex items-center gap-1.5 text-ink">
                    <Check className="size-4" aria-hidden="true" /> Reached for today
                  </span>
                ) : (
                  <>{formatDuration(Math.max(0, goal * 60 - stats.todaySeconds))} to go today</>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Target className="size-4 text-muted" aria-hidden="true" />
                <Stepper
                  label="Daily goal in minutes"
                  value={goal}
                  min={10}
                  max={960}
                  onChange={(v) => setPrefs({ dailyGoalMinutes: v })}
                />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Flame className="size-3.5" aria-hidden="true" /> Focus at least a minute a day to keep your streak.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Notes />
    </div>
  );
}

function GoalRing({ pct }: { pct: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="size-24 shrink-0 -rotate-90" role="img" aria-label={`${Math.round(pct * 100)}% of daily goal`}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--c-line-strong)" strokeWidth="4" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke={pct >= 1 ? "var(--c-glow)" : "var(--c-accent-strong)"}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
      />
      <text x="40" y="45" textAnchor="middle" transform="rotate(90 40 40)" className="fill-ink font-display text-[15px]">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

function Notes() {
  const content = useNotesStore((s) => s.content);
  const setContent = useNotesStore((s) => s.setContent);

  return (
    <section aria-labelledby="notes-title" className="mt-14">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="notes-title" className="font-display text-2xl">
          Notes
        </h2>
        <span className="text-xs text-muted" aria-live="polite">
          Saved in this browser · {content.length.toLocaleString()}/{NOTES_MAX.toLocaleString()}
        </span>
      </div>
      <label htmlFor="notes" className="sr-only">
        Personal study notes
      </label>
      <textarea
        id="notes"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={NOTES_MAX}
        placeholder="Today's plan, a formula to remember, a thought to come back to…"
        className="thin-scroll min-h-64 w-full resize-y rounded-[28px] bg-[repeating-linear-gradient(transparent,transparent_31px,var(--c-line)_31px,var(--c-line)_32px)] bg-surface/60 px-6 py-[6px] text-[15px] leading-8 text-ink outline-none transition-shadow placeholder:text-muted/60 focus:ring-4 focus:ring-accent/25"
      />
    </section>
  );
}
