import type { ComponentType } from "react";
import type { AmbienceId, ArtSceneId } from "@/types";
import { GoldenHour } from "./golden-hour";
import { RainyNight } from "./rainy-night";
import { SundayMorning } from "./sunday-morning";
import { MidnightJournal } from "./midnight-journal";
import { HillsideTown } from "./hillside-town";
import { SnowyCabin } from "./snowy-cabin";

export interface ArtScene {
  id: ArtSceneId;
  label: string;
  blurb: string;
  Scene: ComponentType;
  /** Where the cat is, in % of the scene box: tap target, hearts and speech bubble. */
  cat: { left: number; top: number; width: number; height: number };
  /** Sounds + track for "Use theme sounds". */
  sounds: { mix: Partial<Record<AmbienceId, number>>; track: string };
}

export const ART_SCENES: ArtScene[] = [
  {
    id: "golden-hour",
    label: "Golden Hour",
    blurb: "Late sun, a cup of tea, a calico on the desk",
    Scene: GoldenHour,
    cat: { left: 34.5, top: 42, width: 15.5, height: 32 },
    sounds: { mix: { cafe: 0.3, forest: 0.2 }, track: "paper-lanterns" },
  },
  {
    id: "rainy-night",
    label: "Rainy Night",
    blurb: "City lights in the rain, typing late",
    Scene: RainyNight,
    cat: { left: 73.5, top: 53, width: 13.5, height: 14 },
    sounds: { mix: { rain: 0.6 }, track: "tea-at-midnight" },
  },
  {
    id: "sunday-morning",
    label: "Sunday Morning",
    blurb: "Reading in bed, sun through the curtains",
    Scene: SundayMorning,
    cat: { left: 24, top: 72, width: 14.5, height: 15 },
    sounds: { mix: { forest: 0.45 }, track: "library-hours" },
  },
  {
    id: "midnight-journal",
    label: "Midnight Journal",
    blurb: "Your own desk by lamplight, pen moving",
    Scene: MidnightJournal,
    cat: { left: 7.5, top: 56, width: 12.5, height: 13 },
    sounds: { mix: { rain: 0.3, fire: 0.3 }, track: "windowsill" },
  },
  {
    id: "hillside-town",
    label: "Hillside Town",
    blurb: "Sunny afternoon above a pastel town",
    Scene: HillsideTown,
    cat: { left: 76, top: 51.5, width: 13.5, height: 13.5 },
    sounds: { mix: { forest: 0.4, cafe: 0.2 }, track: "wooden-desk" },
  },
  {
    id: "snowy-cabin",
    label: "Snowy Cabin",
    blurb: "Snow outside, fire inside, cocoa",
    Scene: SnowyCabin,
    cat: { left: 52, top: 74, width: 13.5, height: 13.5 },
    sounds: { mix: { fire: 0.55 }, track: "snowfall-etude" },
  },
];

export const ART_IDS = ART_SCENES.map((s) => s.id);

export function findArtScene(id: string | null | undefined) {
  return ART_SCENES.find((s) => s.id === id) ?? null;
}
