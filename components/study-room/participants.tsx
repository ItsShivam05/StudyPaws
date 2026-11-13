"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crown } from "lucide-react";
import type { PresenceState, PresenceStatus, RoomMember } from "@/types";
import { CatAvatar } from "@/components/pet/cat-avatar";
import { cn, timeAgo } from "@/lib/utils";

const STATUS: Record<PresenceStatus, { label: string; dot: string }> = {
  focusing: { label: "Focusing", dot: "bg-accent-strong" },
  break: { label: "On a break", dot: "bg-glow" },
  idle: { label: "Here", dot: "bg-accent" },
  away: { label: "Stepped away", dot: "bg-ink/30" },
};

export function Participants({
  members,
  online,
  meId,
}: {
  members: RoomMember[];
  online: Map<string, PresenceState>;
  meId: string | null;
}) {
  // Online first, then most recently seen.
  const sorted = [...members].sort((a, b) => {
    const ao = online.has(a.user_id) ? 1 : 0;
    const bo = online.has(b.user_id) ? 1 : 0;
    if (ao !== bo) return bo - ao;
    return b.last_seen_at.localeCompare(a.last_seen_at);
  });
  const onlineCount = members.filter((m) => online.has(m.user_id)).length;

  return (
    <section aria-labelledby="participants-title">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="participants-title" className="font-display text-xl">
          In the room
        </h2>
        <span className="text-xs text-muted">
          {onlineCount} online · {members.length} {members.length === 1 ? "member" : "members"}
        </span>
      </div>
      {members.length <= 1 ? (
        <p className="mb-3 rounded-3xl bg-ink/[0.03] px-4 py-3 text-sm leading-relaxed text-muted">
          It&apos;s just you for now. Tap <span className="font-medium text-ink">Invite</span> and send the link to a friend.
        </p>
      ) : null}
      <ul className="flex flex-col gap-0.5">
        <AnimatePresence initial={false}>
          {sorted.map((m) => {
            const p = online.get(m.user_id);
            const name = p?.display_name ?? m.profile?.display_name ?? "Study buddy";
            const avatar = p?.avatar ?? m.profile?.avatar ?? "ginger";
            const st = p ? STATUS[p.status] : null;
            return (
              <motion.li
                key={m.user_id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn("flex items-center gap-3 rounded-2xl px-2 py-2", !p && "opacity-55")}
              >
                <span className="relative">
                  <CatAvatar avatar={avatar} className="size-10" sleepy={!p || p.status === "away"} />
                  <span
                    className={cn("absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-bg", st ? st.dot : "bg-ink/20")}
                    aria-hidden="true"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="truncate">{name}</span>
                    {m.user_id === meId ? <span className="text-xs font-normal text-muted">(you)</span> : null}
                    {m.role === "owner" ? <Crown className="size-3.5 text-wood" aria-label="Host" /> : null}
                  </span>
                  <span className="block text-xs text-muted">
                    {st ? st.label : `Offline · seen ${timeAgo(m.last_seen_at)}`}
                  </span>
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </section>
  );
}
