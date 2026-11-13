import type { StudySession } from "@/types";
import { dayKey } from "@/lib/utils";

export interface DayTotal {
  key: string;
  label: string; // Mon, Tue…
  date: Date;
  seconds: number;
  sessions: number;
}

export interface StatsSummary {
  todaySeconds: number;
  todaySessions: number;
  completedSessions: number;
  totalSeconds: number;
  streak: number;
  bestStreak: number;
  week: DayTotal[];
  weekSeconds: number;
}

const DAY = 86400000;

export function summarize(sessions: StudySession[], now = new Date()): StatsSummary {
  const byDay = new Map<string, { seconds: number; sessions: number }>();
  let completed = 0;
  let total = 0;
  for (const s of sessions) {
    const k = dayKey(new Date(s.endedAt));
    const d = byDay.get(k) ?? { seconds: 0, sessions: 0 };
    d.seconds += s.durationSeconds;
    if (s.completed) d.sessions += 1;
    byDay.set(k, d);
    if (s.completed) completed++;
    total += s.durationSeconds;
  }

  const todayKey = dayKey(now);
  const today = byDay.get(todayKey) ?? { seconds: 0, sessions: 0 };

  // A day counts toward the streak once you focus for at least a minute.
  const active = (k: string) => (byDay.get(k)?.seconds ?? 0) >= 60;

  // Current streak: today if active, otherwise counting back from yesterday
  // (so the streak doesn't "break" until a whole day is missed).
  let streak = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!active(todayKey)) cursor.setDate(cursor.getDate() - 1);
  while (active(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Best streak across history
  const keys = [...byDay.keys()].filter(active).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of keys) {
    const [y, m, d] = k.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    run = prev && Math.round((date.getTime() - prev.getTime()) / DAY) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }

  const week: DayTotal[] = [];
  const fmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const k = dayKey(date);
    const d = byDay.get(k);
    week.push({ key: k, label: fmt.format(date), date, seconds: d?.seconds ?? 0, sessions: d?.sessions ?? 0 });
  }

  return {
    todaySeconds: today.seconds,
    todaySessions: today.sessions,
    completedSessions: completed,
    totalSeconds: total,
    streak,
    bestStreak: Math.max(best, streak),
    week,
    weekSeconds: week.reduce((a, d) => a + d.seconds, 0),
  };
}
