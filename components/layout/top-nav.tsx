"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Armchair, BookOpenText, Settings2, Users } from "lucide-react";
import { Logo } from "./logo";
import { AccountMenu } from "./account-menu";
import { useUiStore } from "@/lib/stores/ui";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Study", icon: Armchair },
  { href: "/rooms", label: "Rooms", icon: Users },
  { href: "/journal", label: "Journal", icon: BookOpenText },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const focusMode = useUiStore((s) => s.focusMode);
  if (focusMode) return null;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="rounded-xl" aria-label="Study Paws home">
          <Logo className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
        </Link>

        <nav aria-label="Main" className="flex items-center gap-0.5 rounded-full bg-ink/[0.04] p-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors duration-200 sm:px-4",
                  active ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-raised shadow-soft"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <Icon className="relative size-4" aria-hidden="true" />
                <span className="relative hidden md:inline">{label}</span>
                <span className="sr-only md:hidden">{label}</span>
              </Link>
            );
          })}
        </nav>

        <AccountMenu />
      </div>
    </header>
  );
}
