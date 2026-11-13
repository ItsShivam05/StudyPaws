"use client";

import { getGraph, mtof, peekGraph } from "./context";

/** Soft two-note bell used for session transitions. */
export function playChime(volume: number, kind: "focus-done" | "break-done" = "focus-done") {
  const g = peekGraph() ?? getGraph();
  if (!g || volume <= 0) return;
  const { ctx } = g;
  const notes = kind === "focus-done" ? [76, 83, 88] : [79, 74];
  const level = ctx.createGain();
  level.gain.value = volume * volume * 0.9;
  level.connect(g.fxGain);
  const send = ctx.createGain();
  send.gain.value = 0.6;
  level.connect(send).connect(g.ambienceVerb);

  notes.forEach((midi, i) => {
    const t = ctx.currentTime + 0.05 + i * 0.32;
    const f = mtof(midi);
    for (const [ratio, amp, decay] of [
      [1, 0.22, 2.4],
      [2.76, 0.06, 1.1],
      [5.4, 0.025, 0.5],
    ] as const) {
      const o = ctx.createOscillator();
      o.frequency.value = f * ratio;
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(amp, t + 0.006);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      o.connect(gn).connect(level);
      o.start(t);
      o.stop(t + decay + 0.05);
    }
  });
  setTimeout(() => level.disconnect(), 4000);
}

/** A tiny purr when you pet the cat. */
export function playPurr(volume = 0.5) {
  const g = getGraph();
  if (!g) return;
  const { ctx } = g;
  const t = ctx.currentTime + 0.02;
  const src = ctx.createBufferSource();
  src.buffer = g.brown;
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 280;
  const amp = ctx.createGain();
  amp.gain.value = 0;
  // ~24 Hz amplitude flutter is what makes it read as a purr.
  const flutter = ctx.createOscillator();
  flutter.frequency.value = 24;
  const depth = ctx.createGain();
  depth.gain.value = 0.5 * volume;
  flutter.connect(depth).connect(amp.gain);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(1, t + 0.25);
  env.gain.setValueAtTime(1, t + 1.1);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
  src.connect(lp).connect(amp).connect(env).connect(g.fxGain);
  src.start(t);
  flutter.start(t);
  src.stop(t + 1.9);
  flutter.stop(t + 1.9);
  src.onended = () => env.disconnect();
}
