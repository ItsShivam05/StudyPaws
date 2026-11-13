import type { MusicCategory } from "@/types";

/**
 * Every track is an original generative composition rendered live in the
 * browser, so there are no licensing concerns and nothing to download.
 * Each play is a slightly different take of the same piece.
 */

export type ChordQuality = "maj7" | "m7" | "dom7" | "m9" | "maj9" | "add9" | "six9" | "sus2";

export const CHORD_TONES: Record<ChordQuality, number[]> = {
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  m9: [0, 3, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
  add9: [0, 4, 7, 14],
  six9: [0, 4, 9, 14],
  sus2: [0, 2, 7, 10],
};

export type ChordInstrument = "epiano" | "piano" | "pad" | "pluck";
export type MelodyInstrument = "epiano" | "piano" | "pluck" | null;
export type DrumStyle = "boombap" | "soft" | "shaker" | "none";

export interface TrackDef {
  id: string;
  title: string;
  artist: string;
  category: MusicCategory;
  bpm: number;
  swing: number; // 0..0.35 of a 16th
  root: number; // midi note of the tonic (octave 3)
  scale: "major" | "minor";
  progression: [number, ChordQuality][];
  barsPerChord: 1 | 2;
  lengthBars: number;
  chords: ChordInstrument;
  arpeggiate?: boolean;
  melody: MelodyInstrument;
  melodyDensity: number; // 0..1
  drums: DrumStyle;
  bass: boolean;
  pad: boolean;
  crackle: number; // 0..1
  tone: number; // lowpass cutoff in Hz
  seed: number;
}

export const CATEGORY_LABELS: Record<MusicCategory, string> = {
  lofi: "Lofi hip-hop",
  chill: "Chill beats",
  piano: "Piano",
  ambient: "Ambient",
  instrumental: "Instrumental",
};

export const TRACKS: TrackDef[] = [
  {
    id: "windowsill",
    title: "Rain on the Windowsill",
    artist: "Mochi & Friends",
    category: "lofi",
    bpm: 76,
    swing: 0.22,
    root: 53,
    scale: "major",
    progression: [[2, "m9"], [7, "dom7"], [0, "maj9"], [9, "m7"]],
    barsPerChord: 1,
    lengthBars: 48,
    chords: "epiano",
    melody: "epiano",
    melodyDensity: 0.32,
    drums: "boombap",
    bass: true,
    pad: false,
    crackle: 0.7,
    tone: 3000,
    seed: 11,
  },
  {
    id: "tea-at-midnight",
    title: "Tea at Midnight",
    artist: "Little Kettle",
    category: "lofi",
    bpm: 71,
    swing: 0.26,
    root: 57,
    scale: "minor",
    progression: [[0, "m9"], [5, "m7"], [10, "dom7"], [3, "maj7"]],
    barsPerChord: 1,
    lengthBars: 48,
    chords: "epiano",
    melody: "pluck",
    melodyDensity: 0.28,
    drums: "boombap",
    bass: true,
    pad: false,
    crackle: 0.8,
    tone: 2800,
    seed: 23,
  },
  {
    id: "paper-lanterns",
    title: "Paper Lanterns",
    artist: "Paper Moon Club",
    category: "chill",
    bpm: 86,
    swing: 0.12,
    root: 50,
    scale: "major",
    progression: [[0, "maj7"], [4, "m7"], [5, "maj9"], [7, "sus2"]],
    barsPerChord: 1,
    lengthBars: 48,
    chords: "epiano",
    melody: "pluck",
    melodyDensity: 0.4,
    drums: "soft",
    bass: true,
    pad: true,
    crackle: 0.3,
    tone: 4200,
    seed: 37,
  },
  {
    id: "slow-sunday",
    title: "Slow Sunday",
    artist: "The Window Seat",
    category: "chill",
    bpm: 90,
    swing: 0.18,
    root: 51,
    scale: "major",
    progression: [[5, "m7"], [10, "dom7"], [3, "m7"], [8, "maj7"]],
    barsPerChord: 1,
    lengthBars: 48,
    chords: "epiano",
    melody: "epiano",
    melodyDensity: 0.3,
    drums: "boombap",
    bass: true,
    pad: false,
    crackle: 0.4,
    tone: 3800,
    seed: 41,
  },
  {
    id: "snowfall-etude",
    title: "Snowfall Étude",
    artist: "Quiet Hours",
    category: "piano",
    bpm: 68,
    swing: 0,
    root: 48,
    scale: "major",
    progression: [[0, "maj7"], [9, "m7"], [5, "maj7"], [7, "sus2"]],
    barsPerChord: 1,
    lengthBars: 40,
    chords: "piano",
    arpeggiate: true,
    melody: "piano",
    melodyDensity: 0.22,
    drums: "none",
    bass: false,
    pad: false,
    crackle: 0.15,
    tone: 5200,
    seed: 53,
  },
  {
    id: "library-hours",
    title: "Library Hours",
    artist: "Quiet Hours",
    category: "piano",
    bpm: 62,
    swing: 0,
    root: 55,
    scale: "major",
    progression: [[0, "add9"], [7, "six9"], [9, "m7"], [5, "maj7"]],
    barsPerChord: 2,
    lengthBars: 40,
    chords: "piano",
    arpeggiate: true,
    melody: "piano",
    melodyDensity: 0.18,
    drums: "none",
    bass: false,
    pad: false,
    crackle: 0.1,
    tone: 5200,
    seed: 61,
  },
  {
    id: "moss-and-mist",
    title: "Moss & Mist",
    artist: "Forest Room",
    category: "ambient",
    bpm: 56,
    swing: 0,
    root: 50,
    scale: "minor",
    progression: [[0, "m9"], [8, "maj9"], [3, "maj7"], [10, "add9"]],
    barsPerChord: 2,
    lengthBars: 32,
    chords: "pad",
    melody: "pluck",
    melodyDensity: 0.1,
    drums: "none",
    bass: false,
    pad: false,
    crackle: 0,
    tone: 3200,
    seed: 71,
  },
  {
    id: "northern-quiet",
    title: "Northern Quiet",
    artist: "Forest Room",
    category: "ambient",
    bpm: 52,
    swing: 0,
    root: 52,
    scale: "major",
    progression: [[0, "maj9"], [5, "maj7"], [9, "m7"], [7, "sus2"]],
    barsPerChord: 2,
    lengthBars: 32,
    chords: "pad",
    melody: "piano",
    melodyDensity: 0.09,
    drums: "none",
    bass: false,
    pad: false,
    crackle: 0,
    tone: 3600,
    seed: 83,
  },
  {
    id: "wooden-desk",
    title: "Wooden Desk",
    artist: "Mochi & Friends",
    category: "instrumental",
    bpm: 80,
    swing: 0.1,
    root: 46,
    scale: "major",
    progression: [[0, "maj7"], [5, "maj7"], [2, "m7"], [7, "dom7"]],
    barsPerChord: 1,
    lengthBars: 48,
    chords: "piano",
    melody: "epiano",
    melodyDensity: 0.3,
    drums: "shaker",
    bass: true,
    pad: true,
    crackle: 0.2,
    tone: 4600,
    seed: 97,
  },
  {
    id: "evening-train",
    title: "Evening Train",
    artist: "Paper Moon Club",
    category: "instrumental",
    bpm: 84,
    swing: 0.08,
    root: 47,
    scale: "minor",
    progression: [[0, "m7"], [8, "maj7"], [3, "maj7"], [10, "dom7"]],
    barsPerChord: 1,
    lengthBars: 48,
    chords: "pluck",
    arpeggiate: true,
    melody: "epiano",
    melodyDensity: 0.24,
    drums: "soft",
    bass: true,
    pad: true,
    crackle: 0.25,
    tone: 4000,
    seed: 101,
  },
];

export function trackDurationSeconds(t: TrackDef) {
  return (t.lengthBars * 4 * 60) / t.bpm;
}

export function findTrack(id: string | null | undefined) {
  return TRACKS.find((t) => t.id === id) ?? TRACKS[0];
}
