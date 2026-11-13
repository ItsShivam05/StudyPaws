"use client";

import { getGraph, glide, loopSource, makeLoop, mulberry32, peekGraph, type AudioGraph } from "./context";
import * as inst from "./instruments";
import { CHORD_TONES, TRACKS, findTrack, trackDurationSeconds, type TrackDef } from "./tracks";
import { createTicker } from "./ticker";
import { useMusicStore } from "@/lib/stores/music";
import type { MusicCategory, RepeatMode } from "@/types";

const SCALES = {
  major: [0, 2, 4, 7, 9],
  minor: [0, 3, 5, 7, 10],
};

/** Close-position voicing around `center`, which gives smooth voice leading for free. */
function voicing(root: number, offset: number, quality: keyof typeof CHORD_TONES, center: number) {
  const base = root + offset;
  const all = CHORD_TONES[quality].map((i) => (base + i) % 12);
  const pcs = all.length >= 5 ? all.slice(1) : all; // rootless for extended chords
  const low = center - 6;
  const notes = pcs.map((pc) => low + ((((pc - low) % 12) + 12) % 12));
  return Array.from(new Set(notes)).sort((a, b) => a - b);
}

/* ------------------------------------------------------------------ */
/*  One playthrough of a generative track                              */
/* ------------------------------------------------------------------ */

class Song {
  readonly def: TrackDef;
  private g: AudioGraph;
  private v: inst.Voice;
  private rng: () => number;
  private step = 0;
  private nextTime = 0;
  private readonly totalSteps: number;
  private readonly stepDur: number;
  private melodyNotes: number[];
  private melodyIdx: number;
  private melodyHoldUntil = -1;

  constructor(g: AudioGraph, def: TrackDef, variation: number) {
    this.g = g;
    this.def = def;
    this.v = { g, out: g.musicDry, verb: g.musicVerb };
    this.rng = mulberry32(def.seed * 7919 + variation);
    this.totalSteps = def.lengthBars * 16;
    this.stepDur = 60 / def.bpm / 4;
    const scale = SCALES[def.scale];
    this.melodyNotes = [];
    for (let oct = 1; oct <= 3; oct++) {
      for (const s of scale) {
        const n = def.root + oct * 12 + s;
        if (n >= def.root + 12 && n <= def.root + 31) this.melodyNotes.push(n);
      }
    }
    this.melodyIdx = Math.floor(this.melodyNotes.length / 2);
  }

  get elapsedSeconds() {
    return this.step * this.stepDur;
  }

  /** Re-anchor scheduling (after a pause). */
  anchor(time: number) {
    this.nextTime = time;
  }

  get finished() {
    return this.step >= this.totalSteps;
  }

  /** Schedule every step that starts before `until`. */
  schedule(until: number) {
    while (this.nextTime < until && this.step < this.totalSteps) {
      const swing = this.step % 2 === 1 ? this.def.swing * this.stepDur : 0;
      this.playStep(this.step, this.nextTime + swing);
      this.nextTime += this.stepDur;
      this.step++;
    }
  }

  private human(t: number) {
    return t + (this.rng() - 0.5) * 0.01;
  }

  private playStep(stepIndex: number, t: number) {
    const d = this.def;
    const r = this.rng;
    const bar = Math.floor(stepIndex / 16);
    const s = stepIndex % 16;
    const barLen = this.stepDur * 16;
    const intro = bar < 4 && d.drums !== "none";
    const outro = bar >= d.lengthBars - 4;
    const chordIdx = Math.floor(bar / d.barsPerChord) % d.progression.length;
    const [offset, quality] = d.progression[chordIdx];
    const chordStart = bar % d.barsPerChord === 0 && s === 0;
    const chordDur = barLen * d.barsPerChord;
    const center = d.chords === "pad" ? 60 : 63;
    const chord = voicing(d.root, offset, quality, center);
    const bassNote = 36 + ((d.root + offset) % 12);
    const fadeVel = outro ? Math.max(0.35, (d.lengthBars - bar) / 4) : 1;

    /* ---- chords ---- */
    if (d.arpeggiate) {
      if (s % 2 === 0) {
        const pattern = [0, 1, 2, 3, 2, 1, 2, 3];
        const idx = pattern[(s / 2) % pattern.length] % chord.length;
        const play = d.chords === "pluck" ? inst.pluck : inst.piano;
        if (s === 0 && bar % d.barsPerChord === 0) {
          inst.piano(this.v, t, bassNote + 12, 0.55 * fadeVel, chordDur);
        }
        if (s !== 0 || d.chords === "pluck") {
          const vel = (s % 4 === 0 ? 0.48 : 0.36) * fadeVel * (0.9 + r() * 0.2);
          play(this.v, this.human(t), chord[idx], vel, this.stepDur * 3);
        }
      }
    } else if (chordStart) {
      chord.forEach((n, i) => {
        const strum = d.chords === "pad" ? 0 : i * 0.012 + r() * 0.006;
        const vel = 0.62 * fadeVel * (0.9 + r() * 0.15);
        this.playChordNote(t + strum, n, vel, d.chords === "pad" ? chordDur : chordDur * 0.6);
      });
    } else if (d.chords === "epiano" && s === 10 && r() < 0.3 && !outro) {
      // Syncopated re-hit for a little movement
      chord.slice(1).forEach((n, i) => inst.epiano(this.v, t + i * 0.01, n, 0.35, this.stepDur * 4));
    }

    /* ---- pad layer ---- */
    if (d.pad && chordStart) {
      for (const n of voicing(d.root, offset, quality, 55)) {
        inst.pad(this.v, t, n, 0.5 * fadeVel, chordDur, 0.8);
      }
    }

    /* ---- bass ---- */
    if (d.bass && !intro) {
      if (s === 0) inst.bass(this.v, t, bassNote, 0.9 * fadeVel, this.stepDur * 6);
      else if (s === 10 && r() < 0.55) inst.bass(this.v, t, bassNote + (r() < 0.5 ? 7 : 12), 0.6 * fadeVel, this.stepDur * 3);
    }

    /* ---- drums ---- */
    if (!intro && !outro) this.playDrums(s, t, bar);

    /* ---- melody ---- */
    if (d.melody && !intro && s % 2 === 0 && stepIndex >= this.melodyHoldUntil) {
      const phraseRest = bar % 8 === 7 || bar % 4 === 3 ? 0.4 : 1;
      const density = d.melodyDensity * phraseRest * (outro ? 0.5 : 1);
      if (r() < density) {
        // Random walk, gently pulled toward chord tones on strong beats
        const stepSize = Math.floor(r() * 5) - 2;
        this.melodyIdx = Math.max(0, Math.min(this.melodyNotes.length - 1, this.melodyIdx + stepSize));
        let note = this.melodyNotes[this.melodyIdx];
        if (s % 8 === 0) {
          const tones = chord.map((c) => c % 12);
          if (!tones.includes(note % 12)) {
            const up = this.melodyNotes.find((m, i) => i > this.melodyIdx && tones.includes(m % 12));
            if (up) note = up;
          }
        }
        const lenSteps = 2 * (1 + Math.floor(r() * 3));
        this.melodyHoldUntil = stepIndex + lenSteps;
        const vel = (0.5 + r() * 0.25) * fadeVel;
        const dur = this.stepDur * lenSteps;
        const tt = this.human(t);
        if (d.melody === "epiano") inst.epiano(this.v, tt, note, vel * 0.9, dur);
        else if (d.melody === "piano") inst.piano(this.v, tt, note, vel * 0.85, dur);
        else inst.pluck(this.v, tt, note, vel);
      }
    }
  }

  private playChordNote(t: number, midi: number, vel: number, dur: number) {
    switch (this.def.chords) {
      case "epiano":
        return inst.epiano(this.v, t, midi, vel, dur);
      case "piano":
        return inst.piano(this.v, t, midi, vel * 0.8, dur);
      case "pad":
        return inst.pad(this.v, t, midi, vel * 1.1, dur, 2.2);
      case "pluck":
        return inst.pluck(this.v, t, midi, vel);
    }
  }

  private playDrums(s: number, t: number, bar: number) {
    const r = this.rng;
    const v = this.v;
    const h = (x: number) => this.human(x);
    switch (this.def.drums) {
      case "boombap": {
        if (s === 0) inst.kick(v, t, 1);
        if (s === 10) inst.kick(v, h(t), 0.8);
        if (s === 7 && r() < 0.35) inst.kick(v, h(t), 0.55);
        if (s === 4 || s === 12) inst.snare(v, h(t), 0.85);
        if (s % 2 === 0) inst.hat(v, h(t), s % 4 === 0 ? 0.8 : 0.55, s === 14 && r() < 0.12);
        else if (r() < 0.14) inst.hat(v, h(t), 0.3);
        if (bar % 4 === 3 && s === 15 && r() < 0.5) inst.snare(v, h(t), 0.35);
        break;
      }
      case "soft": {
        if (s === 0) inst.kick(v, t, 0.75);
        if (s === 8 && r() < 0.6) inst.kick(v, h(t), 0.55);
        if (s === 4 || s === 12) inst.rim(v, h(t), 0.7);
        if (s % 2 === 0) inst.hat(v, h(t), s % 4 === 0 ? 0.45 : 0.3);
        break;
      }
      case "shaker": {
        if (s % 2 === 0) inst.shaker(v, h(t), s % 4 === 0 ? 0.9 : 0.55);
        if (s === 0 && bar % 2 === 0) inst.kick(v, t, 0.45);
        break;
      }
      default:
        break;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Player                                                             */
/* ------------------------------------------------------------------ */

const LOOKAHEAD_VISIBLE = 0.3;
const LOOKAHEAD_HIDDEN = 2.0;

class MusicPlayer {
  private song: Song | null = null;
  private stopTicker: (() => void) | null = null;
  private crackleGain: GainNode | null = null;
  private variation = 0;
  private lastUiUpdate = 0;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;

  private get store() {
    return useMusicStore;
  }

  queue() {
    const { category } = this.store.getState();
    const list = category === "all" ? TRACKS : TRACKS.filter((t) => t.category === category);
    return list.length ? list : TRACKS;
  }

  private targetVolume() {
    const { volume, muted } = this.store.getState();
    return muted ? 0 : volume * volume; // perceptual curve
  }

  private ensureCrackle(g: AudioGraph) {
    if (this.crackleGain) return this.crackleGain;
    const buf = makeLoop(g.ctx, 5, () => {
      let decay = 0;
      return () => {
        if (Math.random() < 0.00035) decay = 0.15 + Math.random() * 0.5;
        decay *= 0.82;
        const hiss = (Math.random() * 2 - 1) * 0.012;
        return hiss + (Math.random() * 2 - 1) * decay;
      };
    });
    const { src, start } = loopSource(g.ctx, buf);
    const hp = g.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 900;
    const gain = g.ctx.createGain();
    gain.gain.value = 0;
    src.connect(hp).connect(gain).connect(g.musicDry);
    start();
    this.crackleGain = gain;
    return gain;
  }

  private applyTrackColour(g: AudioGraph, def: TrackDef) {
    glide(g.musicTone.frequency, def.tone, g.ctx, 0.8);
    glide(this.ensureCrackle(g).gain, def.crackle * 0.35, g.ctx, 0.8);
  }

  private newSong(g: AudioGraph, def: TrackDef) {
    this.variation++;
    this.song = new Song(g, def, this.variation);
    this.song.anchor(g.ctx.currentTime + 0.12);
    this.applyTrackColour(g, def);
    this.store.setState({ trackId: def.id, elapsed: 0 });
  }

  private tick = () => {
    const g = peekGraph();
    if (!g || !this.song) return;
    const ahead = typeof document !== "undefined" && document.hidden ? LOOKAHEAD_HIDDEN : LOOKAHEAD_VISIBLE;
    this.song.schedule(g.ctx.currentTime + ahead);

    const now = performance.now();
    if (now - this.lastUiUpdate > 500) {
      this.lastUiUpdate = now;
      this.store.setState({ elapsed: Math.max(0, this.song.elapsedSeconds - ahead) });
    }

    if (this.song.finished) this.onTrackEnd(g);
  };

  private onTrackEnd(g: AudioGraph) {
    const { repeat, trackId } = this.store.getState();
    const queue = this.queue();
    const idx = queue.findIndex((t) => t.id === trackId);
    if (repeat === "one") {
      this.newSong(g, findTrack(trackId));
      return;
    }
    if (repeat === "off" && idx === queue.length - 1) {
      this.pause();
      this.song = null;
      this.store.setState({ elapsed: 0 });
      return;
    }
    const next = queue[(idx + 1) % queue.length];
    // Leave a short breath between pieces
    const g2 = g;
    this.song = new Song(g2, next, ++this.variation);
    this.song.anchor(g.ctx.currentTime + 1.2);
    this.applyTrackColour(g, next);
    this.store.setState({ trackId: next.id, elapsed: 0 });
  }

  play() {
    const g = getGraph();
    if (!g) return false;
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
    const { trackId } = this.store.getState();
    const queue = this.queue();
    const def = queue.find((t) => t.id === trackId) ?? queue[0];
    if (!this.song || this.song.def.id !== def.id) this.newSong(g, def);
    else this.song.anchor(g.ctx.currentTime + 0.08);
    this.applyTrackColour(g, def);
    glide(g.musicGain.gain, this.targetVolume(), g.ctx, 0.6);
    if (!this.stopTicker) this.stopTicker = createTicker(50, this.tick);
    this.store.setState({ playing: true });
    return true;
  }

  pause() {
    const g = peekGraph();
    if (g) glide(g.musicGain.gain, 0, g.ctx, 0.35);
    this.store.setState({ playing: false });
    // Stop scheduling once the fade is done; keep the song position for resume.
    if (this.stopTimer) clearTimeout(this.stopTimer);
    this.stopTimer = setTimeout(() => {
      this.stopTicker?.();
      this.stopTicker = null;
      this.stopTimer = null;
    }, 400);
  }

  toggle() {
    if (this.store.getState().playing) this.pause();
    else this.play();
  }

  select(id: string) {
    const def = findTrack(id);
    const wasPlaying = this.store.getState().playing;
    this.store.setState({ trackId: def.id, elapsed: 0 });
    const g = peekGraph();
    if (!wasPlaying || !g) {
      this.song = null;
      if (wasPlaying) this.play();
      return;
    }
    // Quick crossfade into the new track
    glide(g.musicGain.gain, 0, g.ctx, 0.25);
    setTimeout(() => {
      this.newSong(g, def);
      glide(g.musicGain.gain, this.targetVolume(), g.ctx, 0.6);
    }, 280);
  }

  next() {
    const queue = this.queue();
    const idx = queue.findIndex((t) => t.id === this.store.getState().trackId);
    this.select(queue[(idx + 1 + queue.length) % queue.length].id);
  }

  prev() {
    const queue = this.queue();
    const idx = queue.findIndex((t) => t.id === this.store.getState().trackId);
    // Like most players: restart if we are a few seconds in
    if (this.song && this.song.elapsedSeconds > 5 && idx >= 0) {
      this.select(queue[idx].id);
      return;
    }
    this.select(queue[(idx - 1 + queue.length) % queue.length].id);
  }

  setVolume(volume: number) {
    this.store.setState({ volume, muted: volume === 0 ? this.store.getState().muted : false });
    this.syncGain();
  }

  setMuted(muted: boolean) {
    this.store.setState({ muted });
    this.syncGain();
  }

  setRepeat(repeat: RepeatMode) {
    this.store.setState({ repeat });
  }

  setCategory(category: MusicCategory | "all") {
    this.store.setState({ category });
    const queue = this.queue();
    if (!queue.some((t) => t.id === this.store.getState().trackId)) this.select(queue[0].id);
  }

  private syncGain() {
    const g = peekGraph();
    if (g && this.store.getState().playing) glide(g.musicGain.gain, this.targetVolume(), g.ctx, 0.15);
  }
}

export const musicPlayer = new MusicPlayer();
export { trackDurationSeconds };
