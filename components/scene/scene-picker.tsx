"use client";

import type { SceneId } from "@/types";
import { cn } from "@/lib/utils";

export const SCENE_LABELS: Record<SceneId, string> = {
  rainy: "Rainy Night City",
  sunny: "Sunny Hillside Town",
  night: "Starry Night",
  snowy: "Snowy Cabin",
};

const SWATCH: Record<SceneId, string> = {
  rainy: "linear-gradient(180deg,#1F2B45,#4A5A7A)",
  sunny: "linear-gradient(180deg,#BFD8E0,#F7DDB0)",
  night: "linear-gradient(180deg,#1E2741,#3E4A69)",
  snowy: "linear-gradient(180deg,#C5D0D9,#ECF0F2)",
};

const SCENES = Object.keys(SCENE_LABELS) as SceneId[];

export function ScenePicker({ value, onChange }: { value: SceneId; onChange: (s: SceneId) => void }) {
  return (
    <div role="radiogroup" aria-label="Window view" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {SCENES.map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "flex flex-col gap-2 rounded-2xl p-2 text-left transition-colors",
            value === id ? "bg-raised shadow-soft" : "hover:bg-ink/[0.04]",
          )}
        >
          <span
            className={cn(
              "relative block h-14 overflow-hidden rounded-xl ring-[5px] transition-[box-shadow]",
              value === id ? "ring-accent-strong/60" : "ring-[var(--scene-frame)]/35",
            )}
            style={{ background: SWATCH[id] }}
            aria-hidden="true"
          >
            <span className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-[var(--scene-frame)]/70" />
            <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-[var(--scene-frame)]/70" />
          </span>
          <span className="px-1 text-xs font-medium text-ink">{SCENE_LABELS[id]}</span>
        </button>
      ))}
    </div>
  );
}
