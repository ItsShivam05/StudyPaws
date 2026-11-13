import type { AvatarId } from "@/types";
import { COATS } from "@/lib/avatars";
import { CatHead } from "./cat-parts";

/** Small static full-body cat used for friends sitting on the windowsill. */
export function MiniCat({ avatar, sleepy, className }: { avatar: AvatarId; sleepy?: boolean; className?: string }) {
  const coat = COATS[avatar] ?? COATS.ginger;
  return (
    <svg viewBox="40 20 150 190" className={className} aria-hidden="true">
      <path d="M150 182 C186 184 196 158 186 136" fill="none" stroke={coat.shade} strokeWidth="14" strokeLinecap="round" />
      <path d="M58 196 C50 150 72 112 110 112 C148 112 170 150 162 196 Z" fill={coat.base} />
      {coat.patch ? <path d="M132 120 C152 128 164 152 162 178 C150 176 138 160 134 142 Z" fill={coat.patch} /> : null}
      <ellipse cx="110" cy="166" rx="26" ry="26" fill={coat.belly} opacity="0.9" />
      <ellipse cx="92" cy="196" rx="14" ry="8" fill={coat.base} />
      <ellipse cx="128" cy="196" rx="14" ry="8" fill={coat.base} />
      <CatHead coat={coat} eyes={sleepy ? "closed" : "open"} blush={0.35} />
    </svg>
  );
}
