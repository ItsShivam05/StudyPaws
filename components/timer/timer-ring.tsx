"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Round so server and client render identical SVG attributes. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Circular progress ring. `progress` is 0 → 1 (elapsed fraction). */
export function TimerRing({
  progress,
  tone = "focus",
  size = 280,
  stroke = 6,
  children,
  className,
  label,
}: {
  progress: number;
  tone?: "focus" | "break";
  size?: number;
  stroke?: number;
  children?: ReactNode;
  className?: string;
  label: string;
}) {
  const r = (size - stroke * 2) / 2 - 6;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));
  const angle = p * 2 * Math.PI - Math.PI / 2;
  const dotX = r2(size / 2 + r * Math.cos(angle));
  const dotY = r2(size / 2 + r * Math.sin(angle));

  return (
    <div
      className={cn("relative mx-auto aspect-square w-full", className)}
      style={{ maxWidth: size }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-line-strong)" strokeWidth={stroke * 0.5} />
        {/* tick marks */}
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * 2 * Math.PI;
          const inner = r - stroke - 6;
          const outer = inner - (i % 5 === 0 ? 6 : 3);
          return (
            <line
              key={i}
              x1={r2(size / 2 + inner * Math.cos(a))}
              y1={r2(size / 2 + inner * Math.sin(a))}
              x2={r2(size / 2 + outer * Math.cos(a))}
              y2={r2(size / 2 + outer * Math.sin(a))}
              stroke="var(--c-ink)"
              strokeOpacity={i % 5 === 0 ? 0.18 : 0.08}
              strokeWidth={1.2}
              strokeLinecap="round"
            />
          );
        })}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone === "focus" ? "var(--c-accent-strong)" : "var(--c-glow)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={r2(c)}
          strokeDashoffset={r2(c * (1 - p))}
          style={{ transition: "stroke-dashoffset 400ms linear, stroke 600ms ease" }}
        />
      </svg>
      {p > 0.002 && (
        <svg viewBox={`0 0 ${size} ${size}`} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
          <circle
            cx={dotX}
            cy={dotY}
            r={stroke * 0.95}
            fill="var(--c-raised)"
            stroke={tone === "focus" ? "var(--c-accent-strong)" : "var(--c-glow)"}
            strokeWidth={2.5}
            style={{ transition: "cx 400ms linear, cy 400ms linear" }}
          />
        </svg>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
