"use client";

import { useState } from "react";
import { Check, Images } from "lucide-react";
import type { RoomArt, SceneId } from "@/types";
import { usePreferences } from "@/lib/stores/preferences";
import { ART_SCENES, findArtScene } from "./art";
import { ScenePicker, SCENE_LABELS } from "./scene-picker";
import { Popover } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const CLASSIC_SWATCH: Record<SceneId, string> = {
  rainy: "linear-gradient(180deg,#1F2B45,#4A5A7A)",
  sunny: "linear-gradient(180deg,#BFD8E0,#F7DDB0)",
  night: "linear-gradient(180deg,#1E2741,#3E4A69)",
  snowy: "linear-gradient(180deg,#C5D0D9,#ECF0F2)",
};

function Card({
  selected,
  label,
  blurb,
  onClick,
  children,
}: {
  selected: boolean;
  label: string;
  blurb: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "group flex flex-col gap-1.5 rounded-2xl p-1.5 text-left transition-colors",
        selected ? "bg-raised shadow-soft" : "hover:bg-ink/[0.04]",
      )}
    >
      <span
        className={cn(
          "cx-still pointer-events-none relative block aspect-[8/5] overflow-hidden rounded-xl ring-[3px] transition-[box-shadow]",
          selected ? "ring-accent-strong/70" : "ring-transparent",
        )}
        aria-hidden="true"
      >
        {children}
        {selected ? (
          <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-accent-strong text-bg">
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : null}
      </span>
      <span className="px-0.5">
        <span className="block text-xs font-medium text-ink">{label}</span>
        <span className="block truncate text-[11px] text-muted">{blurb}</span>
      </span>
    </button>
  );
}

/** Choose the room you see at home: one of the illustrated scenes, or the classic room. */
export function RoomArtPicker({ compact = false }: { compact?: boolean }) {
  const roomArt = usePreferences((p) => p.roomArt);
  const scene = usePreferences((p) => p.scene);
  const set = usePreferences((p) => p.set);
  const choose = (v: RoomArt) => set({ roomArt: v });

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Room scene" className={cn("grid gap-2", compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
        {ART_SCENES.map(({ id, label, blurb, Scene }) => (
          <Card key={id} selected={roomArt === id} label={label} blurb={blurb} onClick={() => choose(id)}>
            <Scene />
          </Card>
        ))}
        <Card selected={roomArt === "classic"} label="Classic room" blurb={`Window view: ${SCENE_LABELS[scene]}`} onClick={() => choose("classic")}>
          <span className="absolute inset-0 bg-[#E3D6C3]" />
          <span className="absolute left-[26%] top-[12%] h-[48%] w-[38%] rounded-sm ring-4 ring-[#A18672]" style={{ background: CLASSIC_SWATCH[scene] }} />
          <span className="absolute inset-x-0 bottom-0 h-[24%] bg-[#A7876C]" />
        </Card>
      </div>
      {roomArt === "classic" ? (
        <div className="rounded-2xl bg-ink/[0.035] p-2">
          <div className="mb-2 px-1 text-xs font-medium text-muted">Window view</div>
          <ScenePicker value={scene} onChange={(s) => set({ scene: s })} />
        </div>
      ) : null}
    </div>
  );
}

/** Home-page button that opens the picker in a popover. */
export function RoomArtButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const roomArt = usePreferences((p) => p.roomArt);
  const current = findArtScene(roomArt)?.label ?? "Classic room";
  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Change the scene"
        className="inline-flex items-center gap-2 rounded-full bg-ink/[0.05] px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
      >
        <Images className="size-4" aria-hidden="true" />
        <span className="max-sm:hidden">Scene:</span> {current}
      </button>
      <Popover open={open} onClose={() => setOpen(false)} align="start" className="w-[min(92vw,560px)] p-3">
        <div className="mb-2 px-1">
          <div className="font-display text-lg text-ink">Choose your scene</div>
          <div className="text-xs text-muted">Only you see this. Shared study rooms keep the room’s own view.</div>
        </div>
        <RoomArtPicker compact />
      </Popover>
    </div>
  );
}
