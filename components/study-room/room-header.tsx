"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Globe2, Lock, LogOut, Settings2, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { StudyRoom } from "@/types";
import { inviteUrl, leaveRoom } from "@/lib/rooms";
import { friendlyError } from "@/lib/supabase/client";
import { Button, IconButton } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { RoomSettingsDialog } from "./room-settings-dialog";

export function RoomHeader({ room, meId, onLeft }: { room: StudyRoom; meId: string | null; onLeft: () => void }) {
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const isOwner = room.owner_id === meId;

  const copy = async () => {
    const url = inviteUrl(room.code);
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: `Study with me: ${room.name}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Invite link copied", { description: "Send it to a friend — they'll land right in the room." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // User cancelled share or clipboard blocked; show the code instead.
      toast(`Room code: ${room.code}`);
    }
  };

  const leave = async () => {
    setLeaving(true);
    try {
      await leaveRoom(room.id);
      toast("You left the room");
      onLeft();
    } catch (e) {
      toast.error(friendlyError(e));
      setLeaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/rooms"
          aria-label="Back to rooms"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
        >
          <ArrowLeft className="size-[18px]" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate font-display text-[clamp(1.5rem,3vw,2rem)] leading-tight tracking-tight [font-variation-settings:'SOFT'_100]">
            {room.name}
          </h1>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
            {room.is_public ? <Globe2 className="size-3.5" aria-hidden="true" /> : <Lock className="size-3.5" aria-hidden="true" />}
            <span>{room.is_public ? "Public room" : "Invite only"}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular tracking-wider">
              Code <span className="font-medium text-ink">{room.code}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button variant="primary" size="sm" onClick={copy}>
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
          {copied ? "Copied" : "Invite"}
        </Button>
        <IconButton label="Copy room code" size="sm" onClick={async () => {
          try {
            await navigator.clipboard.writeText(room.code);
            toast("Room code copied");
          } catch {
            toast(`Room code: ${room.code}`);
          }
        }}>
          <Copy />
        </IconButton>
        {isOwner ? (
          <IconButton label="Room settings" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings2 />
          </IconButton>
        ) : null}
        <IconButton label="Leave room" size="sm" onClick={() => setConfirmLeave(true)}>
          <LogOut />
        </IconButton>
      </div>

      {isOwner ? <RoomSettingsDialog key={settingsOpen ? "open" : "closed"} room={room} open={settingsOpen} onClose={() => setSettingsOpen(false)} onDeleted={onLeft} /> : null}

      <Dialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Leave this room?"
        description={
          isOwner
            ? "You're the host. Hosting passes to the next member; if you're the last one here, the room closes."
            : "You can rejoin any time with the invite link."
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmLeave(false)}>
            Stay
          </Button>
          <Button variant="primary" loading={leaving} onClick={leave}>
            Leave room
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
