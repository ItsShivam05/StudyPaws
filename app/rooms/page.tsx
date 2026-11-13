"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Globe2, Lock, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { PublicRoomSummary, SceneId } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { friendlyError } from "@/lib/supabase/client";
import { auth, useAuthStore } from "@/lib/supabase/auth";
import { createRoom, listMyRooms, listPublicRooms, normalizeCode, ROOM_CODE_RE, type MyRoom } from "@/lib/rooms";
import { Button, IconButton } from "@/components/ui/button";
import { Field, Segmented } from "@/components/ui/controls";
import { PawLoader } from "@/components/ui/spinner";
import { IdentityDialog } from "@/components/study-room/identity-dialog";
import { SetupNotice } from "@/components/study-room/setup-notice";
import { ScenePicker, SCENE_LABELS } from "@/components/scene/scene-picker";
import { cn, timeAgo } from "@/lib/utils";

export default function RoomsPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Header />
        <div className="mt-10">
          <SetupNotice />
        </div>
      </div>
    );
  }
  return <Lobby />;
}

function Header() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight tracking-tight [font-variation-settings:'SOFT'_100]">
        Study together
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        Open a quiet room, share the link, and focus side by side. Everyone sees the same timer, and friends&apos; cats
        join yours on the windowsill.
      </p>
    </div>
  );
}

function Lobby() {
  const router = useRouter();
  const { user, ready } = useAuthStore();
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [scene, setScene] = useState<SceneId>("rainy");
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [identityFor, setIdentityFor] = useState<null | "create">(null);
  const [publicRooms, setPublicRooms] = useState<PublicRoomSummary[] | null>(null);
  const [myRooms, setMyRooms] = useState<MyRoom[] | null>(null);
  const [loadingLists, setLoadingLists] = useState(false);

  const userId = user?.id ?? null;
  const fetchLists = useCallback(
    () =>
      Promise.all([
        listPublicRooms().catch(() => [] as PublicRoomSummary[]),
        userId ? listMyRooms(userId).catch(() => [] as MyRoom[]) : Promise.resolve([] as MyRoom[]),
      ]),
    [userId],
  );

  const loadLists = async () => {
    setLoadingLists(true);
    try {
      const [pub, mine] = await fetchLists();
      setPublicRooms(pub);
      setMyRooms(mine);
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void fetchLists().then(([pub, mine]) => {
      if (cancelled) return;
      setPublicRooms(pub);
      setMyRooms(mine);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, fetchLists]);

  const doCreate = async () => {
    setCreating(true);
    try {
      const room = await createRoom(name.trim() || "Cozy study room", isPublic, scene);
      toast("Room created", { description: "Share the invite link so friends can join." });
      router.push(`/rooms/${room.code}`);
    } catch (e) {
      toast.error(friendlyError(e));
      setCreating(false);
    }
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) return void doCreate();
    const known = useAuthStore.getState().guestName;
    if (!known) return setIdentityFor("create");
    // Name remembered from before: no need to ask again.
    setCreating(true);
    try {
      await auth.ensureIdentity(known);
      await doCreate();
    } catch (err) {
      toast.error(friendlyError(err));
      setCreating(false);
    }
  };

  const onJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const c = normalizeCode(code);
    if (!ROOM_CODE_RE.test(c)) {
      setCodeError("Room codes are 8 letters and numbers, like K7PM2QXA.");
      return;
    }
    setCodeError(null);
    router.push(`/rooms/${c}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Header />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
        {/* Create */}
        <motion.form
          onSubmit={onCreate}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5 rounded-[32px] bg-surface/70 p-6 sm:p-8"
          aria-labelledby="create-room"
        >
          <div>
            <h2 id="create-room" className="font-display text-2xl">
              Open a room
            </h2>
            <p className="mt-1 text-sm text-muted">You can change these later.</p>
          </div>
          <Field
            label="Room name"
            placeholder="Late-night library"
            maxLength={48}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-muted">Who can find it</span>
            <Segmented
              label="Room privacy"
              layoutId="privacy"
              value={isPublic ? "public" : "private"}
              onChange={(v) => setIsPublic(v === "public")}
              options={[
                { value: "private", label: <span className="flex items-center gap-1.5"><Lock className="size-3.5" />Invite only</span> },
                { value: "public", label: <span className="flex items-center gap-1.5"><Globe2 className="size-3.5" />Listed publicly</span> },
              ]}
            />
            <p className="text-xs text-muted">
              {isPublic
                ? "Anyone can see and join it from the lobby."
                : "Only people with the invite link or code can get in."}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-muted">Window view</span>
            <ScenePicker value={scene} onChange={setScene} />
          </div>
          <Button type="submit" variant="primary" size="lg" loading={creating} className="self-start">
            <Plus className="size-4" aria-hidden="true" /> Create room
          </Button>
        </motion.form>

        <div className="flex flex-col gap-10">
          {/* Join */}
          <form onSubmit={onJoin} className="flex flex-col gap-3" aria-labelledby="join-room">
            <h2 id="join-room" className="font-display text-2xl">
              Join with a code
            </h2>
            <div className="flex items-start gap-2">
              <Field
                label="Invite code or link"
                placeholder="K7PM2QXA"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                error={codeError}
                className="flex-1"
                autoCapitalize="characters"
                spellCheck={false}
              />
              <Button type="submit" variant="soft" className="mt-[26px] h-11" aria-label="Join room">
                Join <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </form>

          {/* Lists */}
          <div className="flex flex-col gap-8">
            {user && myRooms && myRooms.length > 0 ? (
              <RoomList
                title="Your rooms"
                items={myRooms.map((r) => ({
                  code: r.room.code,
                  name: r.room.name,
                  scene: r.room.scene,
                  meta: `${r.role === "owner" ? "Host" : "Member"} · ${r.room.is_public ? "public" : "invite only"} · active ${timeAgo(r.room.last_active_at)}`,
                }))}
              />
            ) : null}

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-xl">Open rooms</h2>
                <IconButton label="Refresh rooms" size="sm" onClick={() => void loadLists()} disabled={loadingLists}>
                  <RefreshCw className={cn(loadingLists && "animate-spin")} />
                </IconButton>
              </div>
              {publicRooms === null ? (
                <PawLoader label="Peeking into rooms…" />
              ) : publicRooms.length === 0 ? (
                <p className="rounded-3xl bg-ink/[0.03] px-5 py-6 text-sm leading-relaxed text-muted">
                  No public rooms right now. Open one and it&apos;ll appear here for others to join.
                </p>
              ) : (
                <RoomList
                  items={publicRooms.map((r) => ({
                    code: r.code,
                    name: r.name,
                    scene: r.scene,
                    meta: `${r.member_count} ${r.member_count === 1 ? "member" : "members"} · active ${timeAgo(r.last_active_at)}`,
                  }))}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <IdentityDialog
        open={identityFor !== null}
        onClose={() => setIdentityFor(null)}
        actionLabel="Create room"
        onReady={() => {
          setIdentityFor(null);
          void doCreate();
        }}
      />
    </div>
  );
}

const SCENE_SWATCH: Record<SceneId, string> = {
  rainy: "linear-gradient(180deg,#1F2B45,#4A5A7A)",
  sunny: "linear-gradient(180deg,#BFD8E0,#F7DDB0)",
  night: "linear-gradient(180deg,#1E2741,#3E4A69)",
  snowy: "linear-gradient(180deg,#C5D0D9,#ECF0F2)",
};

function RoomList({ title, items }: { title?: string; items: { code: string; name: string; scene: SceneId; meta: string }[] }) {
  return (
    <div>
      {title ? <h2 className="mb-3 font-display text-xl">{title}</h2> : null}
      <ul className="flex flex-col gap-1">
        {items.map((r) => (
          <li key={r.code}>
            <Link
              href={`/rooms/${r.code}`}
              className="group flex items-center gap-4 rounded-3xl px-3 py-3 transition-colors hover:bg-ink/[0.04]"
            >
              <span
                className="size-11 shrink-0 rounded-2xl ring-4 ring-[var(--scene-frame)]/40"
                style={{ background: SCENE_SWATCH[r.scene] }}
                title={SCENE_LABELS[r.scene]}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{r.name}</span>
                <span className="block truncate text-xs text-muted">{r.meta}</span>
              </span>
              <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
