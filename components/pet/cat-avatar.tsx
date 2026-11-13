import type { AvatarId } from "@/types";
import { COATS } from "@/lib/avatars";
import { CatHead } from "./cat-parts";
import { cn } from "@/lib/utils";

/** Small cat-face avatar used for participants and the account menu. */
export function CatAvatar({
  avatar,
  className,
  sleepy,
  ring,
  title,
}: {
  avatar: AvatarId;
  className?: string;
  sleepy?: boolean;
  ring?: boolean;
  title?: string;
}) {
  const coat = COATS[avatar] ?? COATS.ginger;
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2",
        ring && "ring-2 ring-accent-strong ring-offset-2 ring-offset-bg",
        className,
      )}
      title={title}
    >
      <svg viewBox="48 26 124 112" className="size-[92%] translate-y-[6%]" aria-hidden="true">
        <CatHead coat={coat} eyes={sleepy ? "closed" : "open"} blush={0.35} />
      </svg>
    </span>
  );
}
