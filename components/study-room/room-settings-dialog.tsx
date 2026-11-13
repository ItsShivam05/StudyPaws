"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { SceneId, StudyRoom } from "@/types";
import { deleteRoom, updateRoomSettings } from "@/lib/rooms";
import { friendlyError } from "@/lib/supabase/client";
import { useAmbienceStore, effectiveLevels } from "@/lib/stores/ambience";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Stepper, Switch } from "@/components/ui/controls";
import { ScenePicker } from "@/components/scene/scene-picker";

export function RoomSettingsDialog({
  room,
  open,
  onClose,
  onDeleted,
}: {
  room: StudyRoom;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(room.name);
  const [isPublic, setIsPublic] = useState(room.is_public);
  const [scene, setScene] = useState<SceneId>(room.scene);
  const [focus, setFocus] = useState(room.focus_minutes);
  const [short, setShort] = useState(room.short_minutes);
  const [long, setLong] = useState(room.long_minutes);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      toast.error("Room names need at least one character.");
      return;
    }
    setSaving(true);
    try {
      await updateRoomSettings(room.id, {
        name: name.trim().slice(0, 48),
        is_public: isPublic,
        scene,
        focus_minutes: focus,
        short_minutes: short,
        long_minutes: long,
      });
      toast("Room updated");
      onClose();
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  const shareSounds = async () => {
    const mix = Object.fromEntries(
      Object.entries(effectiveLevels(useAmbienceStore.getState())).filter(([, v]) => (v ?? 0) > 0).map(([k, v]) => [k, Math.round((v ?? 0) * 100) / 100]),
    );
    try {
      await updateRoomSettings(room.id, { ambience: mix });
      toast(Object.keys(mix).length ? "Your sounds are now the room's sounds" : "Room sounds cleared", {
        description: Object.keys(mix).length ? "Members can tap “Play room sounds” to match." : undefined,
      });
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Room settings" className="w-[min(94vw,520px)]">
      <div className="flex flex-col gap-5">
        <Field label="Room name" value={name} maxLength={48} onChange={(e) => setName(e.target.value)} />
        <div className="rounded-3xl bg-ink/[0.035] px-4">
          <Switch
            checked={isPublic}
            onChange={setIsPublic}
            label="List in open rooms"
            description="Public rooms appear in the lobby. Private rooms need the invite link."
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-muted">Window view</span>
          <ScenePicker value={scene} onChange={setScene} />
        </div>
        <div className="flex flex-col gap-1 rounded-3xl bg-ink/[0.035] px-4 py-2">
          {[
            ["Focus", focus, setFocus, 1, 180],
            ["Short break", short, setShort, 1, 60],
            ["Long break", long, setLong, 1, 90],
          ].map(([label, value, set, min, max]) => (
            <div key={label as string} className="flex items-center justify-between py-1">
              <span className="text-sm">{label as string}</span>
              <Stepper
                label={`${label} minutes`}
                value={value as number}
                onChange={set as (n: number) => void}
                min={min as number}
                max={max as number}
              />
            </div>
          ))}
          <p className="pb-1 text-xs text-muted">New lengths apply right away when the timer is idle, otherwise on reset or at the next block.</p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-3xl bg-ink/[0.035] px-4 py-3">
          <div className="text-sm">
            <div>Room sounds</div>
            <div className="text-xs text-muted">Share the ambience you&apos;re playing right now.</div>
          </div>
          <Button size="sm" variant="soft" onClick={shareSounds}>
            Share my mix
          </Button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          {confirmDelete ? (
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                try {
                  await deleteRoom(room.id);
                  toast("Room deleted");
                  onClose();
                  onDeleted();
                } catch (e) {
                  toast.error(friendlyError(e));
                }
              }}
            >
              Yes, delete for everyone
            </Button>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              Delete room
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} onClick={save}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
