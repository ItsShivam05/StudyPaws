import type { MusicCategory } from "@/types";
import { cn } from "@/lib/utils";

const LABEL_COLORS: Record<MusicCategory, string> = {
  lofi: "#E7A467",
  chill: "#A3B18A",
  piano: "#E8DCCB",
  ambient: "#9DB3C2",
  instrumental: "#D8A48A",
};

/** Tiny record that slowly spins while music plays. */
export function Vinyl({
  category,
  spinning,
  className,
}: {
  category: MusicCategory;
  spinning: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-block shrink-0", className)} aria-hidden="true">
      <svg
        viewBox="0 0 48 48"
        className="size-full animate-spin"
        style={{ animationDuration: "6s", animationPlayState: spinning ? "running" : "paused" }}
      >
        <circle cx="24" cy="24" r="23" fill="#2F2722" />
        <circle cx="24" cy="24" r="18" fill="none" stroke="#fff" strokeOpacity="0.07" />
        <circle cx="24" cy="24" r="14" fill="none" stroke="#fff" strokeOpacity="0.07" />
        <path d="M10 14 A17 17 0 0 1 22 7" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="24" cy="24" r="9" fill={LABEL_COLORS[category]} />
        <circle cx="24" cy="24" r="1.8" fill="#2F2722" />
      </svg>
    </span>
  );
}
