"use client";

import { useState } from "react";
import type { DayTotal } from "@/lib/stats";
import { cn, formatDuration } from "@/lib/utils";

/**
 * Last 7 days of focused time. Single series → one hue, no legend; values
 * on hover/focus, plus a visually-hidden table for screen readers.
 */
export function WeeklyChart({ week, goalMinutes }: { week: DayTotal[]; goalMinutes: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const maxMinutes = Math.max(goalMinutes, ...week.map((d) => d.seconds / 60), 30);
  // Round the scale up to a friendly number
  const step = maxMinutes > 240 ? 120 : maxMinutes > 120 ? 60 : 30;
  const top = Math.ceil(maxMinutes / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const goalPct = (goalMinutes / top) * 100;
  const todayIdx = week.length - 1;

  return (
    <figure className="w-full">
      <div className="relative flex h-52 gap-3">
        {/* y-axis labels */}
        <div className="relative w-9 shrink-0 text-right text-[11px] text-muted" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="tabular absolute right-0 -translate-y-1/2" style={{ bottom: `calc(${(t / top) * 100}% - 0px)` }}>
              {t >= 60 ? `${t / 60}h` : `${t}m`}
            </span>
          ))}
        </div>

        <div className="relative flex-1">
          {/* gridlines */}
          {ticks.map((t) => (
            <div
              key={t}
              className={cn("absolute inset-x-0 border-t", t === 0 ? "border-line-strong" : "border-line")}
              style={{ bottom: `${(t / top) * 100}%` }}
              aria-hidden="true"
            />
          ))}
          {/* goal line */}
          <div
            className="absolute inset-x-0 border-t border-dashed border-wood/60"
            style={{ bottom: `${goalPct}%` }}
            aria-hidden="true"
          >
            <span className="absolute -top-5 right-0 text-[11px] text-muted">Goal {formatDuration(goalMinutes * 60)}</span>
          </div>

          <div className="absolute inset-0 flex items-end gap-[2px]">
            {week.map((d, i) => {
              const pct = (d.seconds / 60 / top) * 100;
              const active = hover === i;
              return (
                <button
                  key={d.key}
                  type="button"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  aria-label={`${d.label}: ${formatDuration(d.seconds)} focused, ${d.sessions} sessions`}
                  className="group relative flex h-full flex-1 items-end justify-center rounded-lg outline-offset-2"
                >
                  <span
                    className={cn(
                      "block w-full max-w-9 rounded-t-[4px] transition-[height,background-color] duration-700 ease-cozy",
                      d.seconds === 0 ? "bg-transparent" : active ? "bg-accent-strong" : i === todayIdx ? "bg-accent-strong/85" : "bg-accent-strong/55",
                    )}
                    style={{ height: d.seconds === 0 ? 0 : `max(${pct}%, 4px)` }}
                  />
                  {active ? (
                    <span className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-xl bg-ink px-3 py-1.5 text-xs text-bg shadow-float">
                      <span className="block font-medium">{d.date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</span>
                      <span className="tabular block opacity-80">
                        {formatDuration(d.seconds)} · {d.sessions} {d.sessions === 1 ? "session" : "sessions"}
                      </span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="ml-12 mt-2 flex gap-[2px] text-center text-[11px] text-muted" aria-hidden="true">
        {week.map((d, i) => (
          <span key={d.key} className={cn("flex-1", i === todayIdx && "font-medium text-ink")}>
            {i === todayIdx ? "Today" : d.label}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Focused time over the last seven days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Focused</th>
            <th scope="col">Sessions</th>
          </tr>
        </thead>
        <tbody>
          {week.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.date.toDateString()}</th>
              <td>{formatDuration(d.seconds)}</td>
              <td>{d.sessions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
