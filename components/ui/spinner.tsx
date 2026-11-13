import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("animate-spin", className)} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Cozy full-area loading state: a little paw print pulse. */
export function PawLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted" role="status">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className="size-5 animate-pulse fill-wood/60"
            style={{ animationDelay: `${i * 180}ms` }}
            aria-hidden="true"
          >
            <ellipse cx="12" cy="16" rx="5" ry="4" />
            <circle cx="6" cy="10" r="2.2" />
            <circle cx="10" cy="6.5" r="2.2" />
            <circle cx="14" cy="6.5" r="2.2" />
            <circle cx="18" cy="10" r="2.2" />
          </svg>
        ))}
      </div>
      <span className="text-sm">{label}</span>
    </div>
  );
}
