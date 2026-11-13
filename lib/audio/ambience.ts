"use client";

import { getGraph, glide, loopSource, makeLoop, peekGraph, type AudioGraph } from "./context";
import type { AmbienceId } from "@/types";

/**
 * Procedural ambience. Every texture is built from looping noise buffers
 * shaped by filters and slow LFOs, plus a few scheduled "events"
 * (thunder, birds, cups) so the soundscape never feels like a loop.
 */

interface Sound {
  output: GainNode;
  stop: () => void;
}

type Builder = (g: AudioGraph, out: GainNode) => () => void;

function lfo(g: AudioGraph, freq: number, depth: number, target: AudioParam, type: OscillatorType = "sine") {
  const o = g.ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const d = g.ctx.createGain();
  d.gain.value = depth;
  o.connect(d).connect(target);
  o.start();
  return o;
}

function filtered(
  g: AudioGraph,
  buffer: AudioBuffer,
  chain: { type: BiquadFilterType; freq: number; q?: number }[],
  gain: number,
  out: AudioNode,
) {
  const { src, start } = loopSource(g.ctx, buffer);
  let node: AudioNode = src;
  const filters: BiquadFilterNode[] = [];
  for (const f of chain) {
    const bq = g.ctx.createBiquadFilter();
    bq.type = f.type;
    bq.frequency.value = f.freq;
    if (f.q !== undefined) bq.Q.value = f.q;
    node.connect(bq);
    node = bq;
    filters.push(bq);
  }
  const amp = g.ctx.createGain();
  amp.gain.value = gain;
  node.connect(amp).connect(out);
  start();
  return { src, filters, amp };
}

/** Repeatedly schedules `fire` with a random gap; returns a cancel function. */
function every(minS: number, maxS: number, fire: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  let alive = true;
  const loop = () => {
    timer = setTimeout(() => {
      if (!alive) return;
      fire();
      loop();
    }, (minS + Math.random() * (maxS - minS)) * 1000);
  };
  loop();
  return () => {
    alive = false;
    clearTimeout(timer);
  };
}

/** Sparse impulses (raindrops / crackles), rendered once into a looping buffer. */
function impulseBuffer(g: AudioGraph, seconds: number, perSecond: number, decayMs: [number, number], amp: [number, number]) {
  const sr = g.ctx.sampleRate;
  return makeLoop(g.ctx, seconds, () => {
    let level = 0;
    let decay = 0.9;
    const p = perSecond / sr;
    return () => {
      if (Math.random() < p) {
        level = amp[0] + Math.random() * (amp[1] - amp[0]);
        const ms = decayMs[0] + Math.random() * (decayMs[1] - decayMs[0]);
        decay = Math.exp(-1 / ((ms / 1000) * sr));
      }
      level *= decay;
      return (Math.random() * 2 - 1) * level;
    };
  });
}

const cache = new WeakMap<AudioGraph, Record<string, AudioBuffer>>();
function buffers(g: AudioGraph) {
  let c = cache.get(g);
  if (!c) {
    c = {};
    cache.set(g, c);
  }
  return c;
}

const builders: Record<AmbienceId, Builder> = {
  rain(g, out) {
    const b = buffers(g);
    b.drops ??= impulseBuffer(g, 6, 140, [1.5, 6], [0.05, 0.4]);
    const sheet = filtered(g, g.noise, [{ type: "highpass", freq: 400 }, { type: "lowpass", freq: 6500 }], 0.18, out);
    const roof = filtered(g, g.brown, [{ type: "lowpass", freq: 600 }], 0.25, out);
    const drops = filtered(g, b.drops, [{ type: "bandpass", freq: 3000, q: 0.6 }], 0.5, out);
    const gust = lfo(g, 0.07, 0.05, sheet.amp.gain);
    return () => {
      for (const n of [sheet.src, roof.src, drops.src, gust]) n.stop();
    };
  },

  thunder(g, out) {
    const heavy = filtered(g, g.noise, [{ type: "highpass", freq: 200 }, { type: "lowpass", freq: 2800 }], 0.22, out);
    const body = filtered(g, g.brown, [{ type: "lowpass", freq: 700 }], 0.35, out);
    const swell = lfo(g, 0.045, 0.06, heavy.amp.gain);
    const strike = () => {
      const ctx = g.ctx;
      const t = ctx.currentTime + 0.05;
      const near = Math.random() < 0.35;
      const src = ctx.createBufferSource();
      src.buffer = g.brown;
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(near ? 900 : 260, t);
      lp.frequency.exponentialRampToValueAtTime(110, t + 3);
      const amp = ctx.createGain();
      const peak = near ? 1.6 : 0.9 + Math.random() * 0.5;
      const len = 4 + Math.random() * 4;
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(peak, t + (near ? 0.04 : 0.6));
      amp.gain.setTargetAtTime(peak * 0.5, t + 0.8, 0.4);
      amp.gain.setTargetAtTime(peak * 0.7, t + 1.6, 0.3);
      amp.gain.setTargetAtTime(0.0001, t + 2.2, len / 4);
      src.connect(lp).connect(amp).connect(out);
      src.start(t, Math.random() * 2);
      src.stop(t + len + 2);
      src.onended = () => amp.disconnect();
    };
    const first = setTimeout(strike, 3500);
    const cancel = every(14, 34, strike);
    return () => {
      clearTimeout(first);
      cancel();
      for (const n of [heavy.src, body.src, swell]) n.stop();
    };
  },

  fire(g, out) {
    const b = buffers(g);
    b.crackle ??= impulseBuffer(g, 6, 22, [0.6, 3], [0.1, 0.6]);
    b.pops ??= impulseBuffer(g, 7, 1.6, [8, 25], [0.4, 0.9]);
    const roar = filtered(g, g.brown, [{ type: "lowpass", freq: 380 }], 0.45, out);
    const crackle = filtered(g, b.crackle, [{ type: "highpass", freq: 900 }, { type: "bandpass", freq: 2600, q: 0.5 }], 0.7, out);
    const pops = filtered(g, b.pops, [{ type: "bandpass", freq: 1400, q: 1.2 }], 0.5, out);
    const hiss = filtered(g, g.noise, [{ type: "bandpass", freq: 5200, q: 0.8 }], 0.012, out);
    const flicker = lfo(g, 0.23, 0.12, roar.amp.gain);
    return () => {
      for (const n of [roar.src, crackle.src, pops.src, hiss.src, flicker]) n.stop();
    };
  },

  forest(g, out) {
    const wind = filtered(g, g.pink, [{ type: "lowpass", freq: 650, q: 0.8 }], 0.35, out);
    const windSweep = lfo(g, 0.05, 280, wind.filters[0].frequency);
    const windAmp = lfo(g, 0.031, 0.12, wind.amp.gain);
    const leaves = filtered(g, g.noise, [{ type: "highpass", freq: 2500 }], 0.025, out);
    const leavesAmp = lfo(g, 0.13, 0.015, leaves.amp.gain);
    const bird = () => {
      const ctx = g.ctx;
      const base = 2400 + Math.random() * 2200;
      const notes = 2 + Math.floor(Math.random() * 5);
      const gap = 0.07 + Math.random() * 0.08;
      const pan = ctx.createStereoPanner();
      pan.pan.value = Math.random() * 1.6 - 0.8;
      const level = ctx.createGain();
      level.gain.value = 0.25 + Math.random() * 0.35;
      pan.connect(level);
      level.connect(out);
      const send = ctx.createGain();
      send.gain.value = 0.5;
      level.connect(send).connect(g.ambienceVerb);
      let t = ctx.currentTime + 0.05;
      let last: OscillatorNode | null = null;
      for (let i = 0; i < notes; i++) {
        const o = ctx.createOscillator();
        const amp = ctx.createGain();
        const f = base * (1 + (Math.random() - 0.5) * 0.15);
        const len = 0.05 + Math.random() * 0.05;
        o.frequency.setValueAtTime(f, t);
        o.frequency.exponentialRampToValueAtTime(f * (Math.random() < 0.5 ? 1.35 : 0.75), t + len);
        amp.gain.setValueAtTime(0.0001, t);
        amp.gain.exponentialRampToValueAtTime(0.09, t + 0.01);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.connect(amp).connect(pan);
        o.start(t);
        o.stop(t + len + 0.02);
        last = o;
        t += len + gap;
      }
      if (last) last.onended = () => level.disconnect();
    };
    const cancel = every(2.5, 9, bird);
    return () => {
      cancel();
      for (const n of [wind.src, windSweep, windAmp, leaves.src, leavesAmp]) n.stop();
    };
  },

  ocean(g, out) {
    const wash = filtered(g, g.noise, [{ type: "lowpass", freq: 700, q: 0.4 }], 0.22, out);
    const sweep = lfo(g, 0.085, 520, wash.filters[0].frequency);
    const surge = lfo(g, 0.085, 0.16, wash.amp.gain);
    const wash2 = filtered(g, g.pink, [{ type: "lowpass", freq: 1100 }], 0.12, out);
    const surge2 = lfo(g, 0.061, 0.1, wash2.amp.gain);
    const deep = filtered(g, g.brown, [{ type: "lowpass", freq: 220 }], 0.3, out);
    return () => {
      for (const n of [wash.src, sweep, surge, wash2.src, surge2, deep.src]) n.stop();
    };
  },

  cafe(g, out) {
    const voices = [320, 560, 880, 1250].map((freq, i) => {
      const v = filtered(g, g.pink, [{ type: "bandpass", freq, q: 3.5 }], 0.14, out);
      // Syllable-rate wobble from two detuned LFOs makes a believable murmur.
      const a = lfo(g, 3.1 + i * 0.7, 0.07, v.amp.gain);
      const b = lfo(g, 0.17 + i * 0.05, 0.05, v.amp.gain);
      return [v.src, a, b];
    });
    const room = filtered(g, g.brown, [{ type: "lowpass", freq: 260 }], 0.2, out);
    const clink = () => {
      const ctx = g.ctx;
      const t = ctx.currentTime + 0.05;
      const base = 1800 + Math.random() * 1600;
      const level = ctx.createGain();
      level.gain.value = 0.5;
      level.connect(out);
      const send = ctx.createGain();
      send.gain.value = 0.7;
      level.connect(send).connect(g.ambienceVerb);
      let last: OscillatorNode | null = null;
      for (const ratio of [1, 2.32, 3.91]) {
        const o = ctx.createOscillator();
        o.frequency.value = base * ratio;
        const amp = ctx.createGain();
        amp.gain.setValueAtTime(0.0001, t);
        amp.gain.exponentialRampToValueAtTime(0.03 / ratio, t + 0.003);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.5 / ratio + 0.15);
        o.connect(amp).connect(level);
        o.start(t);
        o.stop(t + 0.7);
        last = o;
      }
      if (last) last.onended = () => level.disconnect();
    };
    const cancel = every(3, 11, clink);
    return () => {
      cancel();
      room.src.stop();
      voices.flat().forEach((n) => n.stop());
    };
  },
};

export const AMBIENCE_IDS = Object.keys(builders) as AmbienceId[];

class AmbienceEngine {
  private sounds = new Map<AmbienceId, Sound>();

  /** Apply desired levels (0 = off). Starts or stops sounds as needed. */
  apply(levels: Partial<Record<AmbienceId, number>>, masterVolume: number, create: boolean) {
    const g = create ? getGraph() : peekGraph();
    if (!g) return;
    glide(g.ambienceGain.gain, masterVolume * masterVolume, g.ctx, 0.3);
    for (const id of AMBIENCE_IDS) {
      const level = levels[id] ?? 0;
      const existing = this.sounds.get(id);
      if (level > 0) {
        if (!existing) {
          const output = g.ctx.createGain();
          output.gain.value = 0;
          output.connect(g.ambienceGain);
          const stop = builders[id](g, output);
          this.sounds.set(id, { output, stop });
          glide(output.gain, level * level, g.ctx, 1.2);
        } else {
          glide(existing.output.gain, level * level, g.ctx, 0.2);
        }
      } else if (existing) {
        this.sounds.delete(id);
        glide(existing.output.gain, 0, g.ctx, 0.5);
        setTimeout(() => {
          existing.stop();
          existing.output.disconnect();
        }, 900);
      }
    }
  }

  stopAll() {
    this.apply({}, 1, false);
  }
}

export const ambienceEngine = new AmbienceEngine();
