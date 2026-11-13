"use client";

import { Headphones } from "lucide-react";
import { toast } from "sonner";
import type { AmbienceId, ArtSceneId, SceneId } from "@/types";
import { useAmbienceStore } from "@/lib/stores/ambience";
import { useMusicStore } from "@/lib/stores/music";
import { musicPlayer } from "@/lib/audio/music";
import { findTrack } from "@/lib/audio/tracks";
import { applyMix, SOUNDS } from "@/components/ambience/mixer-sheet";
import { SCENE_LABELS } from "./scene-picker";
import { findArtScene } from "./art";
import { cn } from "@/lib/utils";

/** The sound of each window view: an ambience mix and a matching track. */
export const THEME_SOUNDS: Record<SceneId, { mix: Partial<Record<AmbienceId, number>>; track: string }> = {
  rainy: { mix: { rain: 0.6 }, track: "windowsill" },
  sunny: { mix: { forest: 0.5, cafe: 0.25 }, track: "slow-sunday" },
  snowy: { mix: { fire: 0.55 }, track: "snowfall-etude" },
  night: { mix: { forest: 0.25, ocean: 0.3 }, track: "northern-quiet" },
};

export type ThemeKey = SceneId | ArtSceneId;

function soundsFor(theme: ThemeKey) {
  const art = findArtScene(theme);
  return art
    ? { ...art.sounds, label: art.label }
    : { ...THEME_SOUNDS[theme as SceneId], label: SCENE_LABELS[theme as SceneId] };
}

/** True while exactly the theme's sounds and track are playing. */
function useThemeSoundsOn(theme: ThemeKey) {
  const { mix, track } = soundsFor(theme);
  const ambienceMatches = useAmbienceStore((s) => SOUNDS.every(({ id }) => s.enabled[id] === !!mix[id]));
  const musicMatches = useMusicStore((m) => m.playing && m.trackId === track);
  return ambienceMatches && musicMatches;
}

export function playThemeSounds(theme: ThemeKey) {
  const { mix, track, label } = soundsFor(theme);
  applyMix(mix);
  const def = findTrack(track);
  // A library filter that hides this track would make the player skip it.
  const { category } = useMusicStore.getState();
  if (category !== "all" && category !== def.category) useMusicStore.setState({ category: "all" });
  musicPlayer.select(def.id);
  if (!useMusicStore.getState().playing) musicPlayer.play();
  const names = SOUNDS.filter(({ id }) => mix[id]).map(({ label }) => label.toLowerCase());
  toast(`${label} sounds on`, { description: `${names.join(" + ")} · “${def.title}”` });
}

export function stopThemeSounds() {
  applyMix({});
  musicPlayer.pause();
}

export function ThemeSoundsButton({ theme, className }: { theme: ThemeKey; className?: string }) {
  const on = useThemeSoundsOn(theme);
  const { label } = soundsFor(theme);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => (on ? stopThemeSounds() : playThemeSounds(theme))}
      title={on ? "Stop the theme's sounds and music" : `Play sounds and music that suit ${label}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        on ? "bg-glow/25 text-ink" : "bg-ink/[0.05] text-muted hover:text-ink",
        className,
      )}
    >
      <Headphones className="size-4" aria-hidden="true" />
      {on ? "Theme sounds on" : "Use theme sounds"}
    </button>
  );
}
