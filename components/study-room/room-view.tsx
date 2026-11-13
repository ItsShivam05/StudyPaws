"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Coffee, Headphones } from "lucide-react";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useStudyRoom, roomRemaining } from "@/hooks/use-study-room";
import { useNow } from "@/hooks/use-now";
import { useCatMood, useStudyActivity } from "@/hooks/use-cat-mood";
import { RoomStage, type Friend } from "@/components/scene/room-stage";
import { PawLoader } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { SetupNotice } from "./setup-notice";
import { IdentityDialog } from "./identity-dialog";
import { RoomHeader } from "./room-header";
import { RoomTimer } from "./room-timer";
import { Participants } from "./participants";
import { ActivityFeed } from "./activity-feed";
import { applyMix } from "@/components/ambience/mixer-sheet";
import { useTimerStore, timer } from "@/lib/timer/timer";
import { ROOM_CODE_RE } from "@/lib/rooms";
import { auth, useAuthStore } from "@/lib/supabase/auth";
import { friendlyError } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function RoomView({ code }: { code: string }) {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-6xl 2xl:max-w-7xl px-4 py-16 sm:px-6">
        <SetupNotice />
      </div>
    );
  }
  if (!ROOM_CODE_RE.test(code)) return <RoomProblem title="That invite link looks incomplete" body="Room codes are 8 letters and numbers. Double-check the link your friend sent." />;
  return <LiveRoom code={code} />;
}

function RoomProblem({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-20 text-center">
      <h1 className="font-display text-3xl">{title}</h1>
      <p className="text-sm leading-relaxed text-muted">{body}</p>
      <Link href="/rooms" className="mt-2 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-bg">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to rooms
      </Link>
    </div>
  );
}

function LiveRoom({ code }: { code: string }) {
  const router = useRouter();
  const r = useStudyRoom(code);
  const now = useNow(250, r.room?.timer_status === "running");
  const personalRunning = useTimerStore((s) => s.status === "running");

  // Drive completion + focus accounting from the page clock.
  const { tick } = r;
  useEffect(() => {
    tick(now);
  }, [now, tick]);

  // Opening an invite link with a remembered name joins straight away.
  const knownName = useAuthStore((s) => s.guestName);
  const autoTried = useRef(false);
  const [autoFailed, setAutoFailed] = useState(false);
  useEffect(() => {
    if (r.status !== "waiting-identity" || !knownName || autoTried.current) return;
    autoTried.current = true;
    auth.ensureIdentity(knownName).catch((e) => {
      toast.error(friendlyError(e));
      setAutoFailed(true);
    });
  }, [r.status, knownName]);

  const room = r.room;
  const mood = useCatMood(room?.timer_mode ?? "focus", room?.timer_status ?? "idle");
  const activity = useStudyActivity(room?.timer_mode ?? "focus", room?.timer_status ?? "idle");

  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of r.members) if (m.profile) map.set(m.user_id, m.profile.display_name);
    for (const p of r.presence) map.set(p.user_id, p.display_name);
    return map;
  }, [r.members, r.presence]);

  const friends: Friend[] = useMemo(
    () =>
      r.presence
        .filter((p) => p.user_id !== r.me?.id)
        .map((p) => ({ id: p.user_id, name: p.display_name, avatar: p.avatar, status: p.status })),
    [r.presence, r.me?.id],
  );

  if (r.status === "waiting-identity" && knownName && !autoFailed) {
    return (
      <div className="py-24">
        <PawLoader label="Walking over to the room…" />
      </div>
    );
  }

  if (r.status === "waiting-identity") {
    return (
      <div className="mx-auto max-w-6xl 2xl:max-w-7xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-md text-center">
          <h1 className="font-display text-3xl">You&apos;re invited to study</h1>
          <p className="mt-2 text-sm text-muted">Tell your friends who you are, and you&apos;ll be at the window in a moment.</p>
        </div>
        <IdentityDialog open onClose={() => router.push("/rooms")} onReady={() => {}} actionLabel="Join room" />
      </div>
    );
  }

  if (r.status === "error") {
    return <RoomProblem title="We couldn't open this room" body={r.error ?? "Please try again in a moment."} />;
  }

  if (r.status === "closed") {
    return <RoomProblem title="This room has closed" body="The room was deleted or you left it. You can open a new one any time." />;
  }

  if (!room || r.status === "joining") {
    return (
      <div className="py-24">
        <PawLoader label="Walking over to the room…" />
      </div>
    );
  }

  const remaining = roomRemaining(room, now, r.offset);
  const hasRoomSounds = Object.values(room.ambience ?? {}).some((v) => (v ?? 0) > 0);

  return (
    <div className="mx-auto max-w-6xl 2xl:max-w-7xl px-4 pt-2 sm:px-6 lg:pt-4">
      <RoomHeader room={room} meId={r.me?.id ?? null} onLeft={() => router.push("/rooms")} />

      <AnimatePresence>
        {personalRunning ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-glow/15 px-5 py-3 text-sm">
              <span>Your solo timer is still running in the background.</span>
              <Button size="sm" variant="ghost" onClick={() => timer.pause()}>
                Pause solo timer
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)] lg:gap-10">
        <div className="flex flex-col gap-6">
          <div className="relative">
            <RoomStage mood={mood} activity={activity} scene={room.scene} friends={friends} />
            {/* floating reactions */}
            <div className="pointer-events-none absolute inset-x-0 bottom-[8%] flex flex-col items-center gap-2" aria-hidden="true">
              <AnimatePresence>
                {r.floaters.map((m) => (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 16, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -18 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className={cn(
                      "max-w-[80%] truncate rounded-full px-4 py-1.5 text-[13px] font-medium shadow-soft backdrop-blur-md",
                      m.kind === "reaction" ? "bg-accent/85 text-accent-ink" : "bg-raised/90 text-ink",
                    )}
                  >
                    {names.get(m.user_id ?? "") ?? "Someone"}: {m.body}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
            <RoomTimer room={room} remaining={remaining} onAction={r.act} />
            <div className="flex flex-col items-center gap-2 sm:items-end">
              <button
                type="button"
                onClick={() => r.setAway(!r.away)}
                aria-pressed={r.away}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  r.away ? "bg-glow/25 text-ink" : "bg-ink/[0.05] text-muted hover:text-ink",
                )}
              >
                <Coffee className="size-4" aria-hidden="true" />
                {r.away ? "I'm back" : "Step away"}
              </button>
              {hasRoomSounds ? (
                <button
                  type="button"
                  onClick={() => {
                    applyMix(room.ambience);
                    toast("Playing the room's sounds");
                  }}
                  className="flex items-center gap-2 rounded-full bg-ink/[0.05] px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
                >
                  <Headphones className="size-4" aria-hidden="true" /> Play room sounds
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-8">
          <Participants members={r.members} online={r.online} meId={r.me?.id ?? null} />
          <ActivityFeed roomId={room.id} meId={r.me?.id ?? null} messages={r.messages} names={names} />
        </aside>
      </div>
    </div>
  );
}
