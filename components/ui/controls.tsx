"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ---------- Slider ---------- */

export function Slider({
  value,
  onChange,
  label,
  min = 0,
  max = 1,
  step = 0.01,
  className,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn("cozy-range w-full", className)}
      style={{ ["--fill" as string]: `${pct}%` }}
    />
  );
}

/* ---------- Switch ---------- */

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <div className="text-[15px] text-ink">{label}</div>
        {description ? <div className="mt-0.5 text-[13px] leading-snug text-muted">{description}</div> : null}
      </label>
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ease-cozy disabled:opacity-40",
          checked ? "bg-accent-strong" : "bg-ink/15",
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={cn("absolute top-0.5 block size-5 rounded-full bg-raised shadow", checked ? "right-0.5" : "left-0.5")}
        />
      </button>
    </div>
  );
}

/* ---------- Segmented control ---------- */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  layoutId,
  size = "md",
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
  layoutId: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-full bg-ink/[0.05] p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative rounded-full font-medium transition-colors duration-200",
              size === "md" ? "px-3.5 py-1.5 text-[13px]" : "px-2.5 py-1 text-xs",
              active ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-raised shadow-soft"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Text field ---------- */

export function Field({
  label,
  hint,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string | null }) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-muted">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error || hint ? `${id}-desc` : undefined}
        className={cn(
          "h-11 rounded-2xl border border-line-strong bg-raised/70 px-4 text-[15px] text-ink placeholder:text-muted/60",
          "transition-[border-color,box-shadow] duration-200 outline-none focus:border-accent-strong focus:ring-4 focus:ring-accent/25",
          error && "border-danger/60",
        )}
        {...props}
      />
      {error ? (
        <p id={`${id}-desc`} className="text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-desc`} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ---------- Number stepper (durations) ---------- */

export function Stepper({
  value,
  onChange,
  min,
  max,
  label,
  suffix = "min",
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  label: string;
  suffix?: string;
}) {
  const btn =
    "size-8 rounded-full text-lg leading-none text-ink/70 hover:bg-ink/[0.07] hover:text-ink transition-colors disabled:opacity-30";
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <button type="button" className={btn} aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, Math.round(n))));
        }}
        className="tabular w-12 rounded-lg bg-transparent text-center text-[15px] font-medium text-ink outline-none focus:bg-ink/[0.05] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" className={btn} aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
      <span className="ml-1 w-7 text-[13px] text-muted">{suffix}</span>
    </div>
  );
}
