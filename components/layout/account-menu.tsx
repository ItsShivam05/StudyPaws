"use client";

import Link from "next/link";
import { useAuthStore, myAvatar } from "@/lib/supabase/auth";
import { CatAvatar } from "@/components/pet/cat-avatar";

/**
 * There are no accounts — once you've picked a name (by creating or joining a
 * room, or in Settings) your cat and name show here and link to Settings.
 */
export function AccountMenu() {
  const ready = useAuthStore((s) => s.ready);
  const name = useAuthStore((s) => s.profile?.display_name ?? s.guestName);
  const avatar = useAuthStore((s) => myAvatar(s));

  if (!ready) return <div className="size-9" aria-hidden="true" />;
  if (!name) return <div className="size-9" aria-hidden="true" />;

  return (
    <Link
      href="/settings#you"
      aria-label={`${name} — edit your name and cat`}
      title="Edit your name and cat"
      className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-ink/[0.05] sm:pr-3"
    >
      <CatAvatar avatar={avatar} className="size-8" />
      <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">{name}</span>
    </Link>
  );
}
