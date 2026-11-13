import { mtof, type AudioGraph } from "./context";

/**
 * Lightweight synthesized instruments. Each call schedules one note and
 * cleans up its nodes automatically when the note has finished.
 */

export interface Voice {
  g: AudioGraph;
  out: AudioNode; // dry destination
  verb: AudioNode; // reverb send
}

function sendTo(v: Voice, node: AudioNode, wet: number) {
  node.connect(v.out);
  if (wet > 0) {
    const s = v.g.ctx.createGain();
    s.gain.value = wet;
    node.connect(s).connect(v.verb);
  }
}

function env(param: AudioParam, t: number, peak: number, attack: number, decay: number) {
  param.setValueAtTime(0.0001, t);
  param.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

/** Rhodes-like FM electric piano. */
export function epiano(v: Voice, t: number, midi: number, vel: number, dur: number) {
  const { ctx } = v.g;
  const f = mtof(midi);
  const car = ctx.createOscillator();
  car.frequency.value = f;
  const mod = ctx.createOscillator();
  mod.frequency.value = f;
  const modGain = ctx.createGain();
  modGain.gain.setValueAtTime(f * 1.6 * vel, t);
  modGain.gain.exponentialRampToValueAtTime(f * 0.12 + 0.01, t + 0.9);
  mod.connect(modGain).connect(car.frequency);

  // Bell "tine" partial
  const tine = ctx.createOscillator();
  tine.frequency.value = f * 4.02;
  const tineGain = ctx.createGain();
  env(tineGain.gain, t, 0.03 * vel, 0.002, 0.35);
  tine.connect(tineGain);

  const amp = ctx.createGain();
  const decay = Math.max(1.2, dur + 0.8);
  env(amp.gain, t, 0.16 * vel, 0.006, decay);
  car.connect(amp);
  tineGain.connect(amp);

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2600;
  amp.connect(lp);
  sendTo(v, lp, 0.35);

  const end = t + decay + 0.1;
  for (const o of [car, mod, tine]) {
    o.start(t);
    o.stop(end);
  }
  car.onended = () => lp.disconnect();
}

/** Soft felt-piano. */
export function piano(v: Voice, t: number, midi: number, vel: number, dur: number) {
  const { ctx } = v.g;
  const f = mtof(midi);
  const brightness = 1 - Math.min(1, (midi - 40) / 60);
  const decay = Math.max(1.4, Math.min(4.5, dur + 2.2 * brightness + 0.8));

  const amp = ctx.createGain();
  env(amp.gain, t, 0.14 * vel, 0.004, decay);

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(900 + 3200 * vel, t);
  lp.frequency.exponentialRampToValueAtTime(700, t + decay * 0.7);
  lp.Q.value = 0.3;

  const partials: [number, OscillatorType, number][] = [
    [1, "triangle", 1],
    [1.0015, "sine", 0.6],
    [2, "sine", 0.28],
    [3.003, "sine", 0.09],
  ];
  const oscs: OscillatorNode[] = [];
  for (const [ratio, type, gain] of partials) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f * ratio;
    const g = ctx.createGain();
    g.gain.value = gain;
    o.connect(g).connect(lp);
    oscs.push(o);
  }
  lp.connect(amp);
  sendTo(v, amp, 0.45);
  const end = t + decay + 0.1;
  for (const o of oscs) {
    o.start(t);
    o.stop(end);
  }
  oscs[0].onended = () => amp.disconnect();
}

/** Plucked mallet / kalimba-like tone. */
export function pluck(v: Voice, t: number, midi: number, vel: number) {
  const { ctx } = v.g;
  const f = mtof(midi);
  const o = ctx.createOscillator();
  o.type = "triangle";
  o.frequency.value = f;
  const o2 = ctx.createOscillator();
  o2.type = "sine";
  o2.frequency.value = f * 3.0;
  const g2 = ctx.createGain();
  env(g2.gain, t, 0.05 * vel, 0.002, 0.12);
  const amp = ctx.createGain();
  env(amp.gain, t, 0.13 * vel, 0.003, 0.9);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(3500, t);
  lp.frequency.exponentialRampToValueAtTime(600, t + 0.6);
  o.connect(lp);
  o2.connect(g2).connect(lp);
  lp.connect(amp);
  sendTo(v, amp, 0.5);
  o.start(t);
  o2.start(t);
  o.stop(t + 1.1);
  o2.stop(t + 1.1);
  o.onended = () => amp.disconnect();
}

/** Warm detuned pad with slow attack. */
export function pad(v: Voice, t: number, midi: number, vel: number, dur: number, attack = 1.4) {
  const { ctx } = v.g;
  const f = mtof(midi);
  const amp = ctx.createGain();
  const peak = 0.045 * vel;
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.linearRampToValueAtTime(peak, t + attack);
  amp.gain.setValueAtTime(peak, t + Math.max(attack, dur));
  amp.gain.linearRampToValueAtTime(0.0001, t + Math.max(attack, dur) + 2.4);

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;
  lp.Q.value = 0.6;

  const oscs: OscillatorNode[] = [];
  for (const detune of [-8, 7]) {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = f;
    o.detune.value = detune;
    o.connect(lp);
    oscs.push(o);
  }
  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.value = f;
  const subG = ctx.createGain();
  subG.gain.value = 0.8;
  sub.connect(subG).connect(lp);
  oscs.push(sub);

  lp.connect(amp);
  sendTo(v, amp, 0.6);
  const end = t + Math.max(attack, dur) + 2.6;
  for (const o of oscs) {
    o.start(t);
    o.stop(end);
  }
  oscs[0].onended = () => amp.disconnect();
}

/** Round sine/triangle bass. */
export function bass(v: Voice, t: number, midi: number, vel: number, dur: number) {
  const { ctx } = v.g;
  const f = mtof(midi);
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.value = f;
  const o2 = ctx.createOscillator();
  o2.type = "triangle";
  o2.frequency.value = f;
  const g2 = ctx.createGain();
  g2.gain.value = 0.35;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 320;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(0.32 * vel, t + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.12 * vel, t + Math.min(dur, 0.5));
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
  o.connect(lp);
  o2.connect(g2).connect(lp);
  lp.connect(amp);
  sendTo(v, amp, 0);
  o.start(t);
  o2.start(t);
  o.stop(t + dur + 0.2);
  o2.stop(t + dur + 0.2);
  o.onended = () => amp.disconnect();
}

/* ------------------------------------------------------------------ */
/*  Drums                                                              */
/* ------------------------------------------------------------------ */

export function kick(v: Voice, t: number, vel: number) {
  const { ctx } = v.g;
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(130, t);
  o.frequency.exponentialRampToValueAtTime(46, t + 0.12);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(0.75 * vel, t + 0.004);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
  o.connect(amp);
  sendTo(v, amp, 0);
  o.start(t);
  o.stop(t + 0.45);
  o.onended = () => amp.disconnect();
}

function noiseHit(
  v: Voice,
  t: number,
  peak: number,
  decay: number,
  filter: BiquadFilterType,
  freq: number,
  q = 0.7,
  wet = 0.15,
) {
  const { ctx, noise } = v.g;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  f.Q.value = q;
  const amp = ctx.createGain();
  env(amp.gain, t, peak, 0.002, decay);
  src.connect(f).connect(amp);
  sendTo(v, amp, wet);
  src.start(t, Math.random() * (noise.duration - 1));
  src.stop(t + decay + 0.05);
  src.onended = () => amp.disconnect();
}

export function snare(v: Voice, t: number, vel: number) {
  noiseHit(v, t, 0.22 * vel, 0.2, "bandpass", 1700, 0.6, 0.3);
  const { ctx } = v.g;
  const o = ctx.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(200, t);
  o.frequency.exponentialRampToValueAtTime(150, t + 0.08);
  const amp = ctx.createGain();
  env(amp.gain, t, 0.12 * vel, 0.002, 0.09);
  o.connect(amp);
  sendTo(v, amp, 0.1);
  o.start(t);
  o.stop(t + 0.15);
  o.onended = () => amp.disconnect();
}

export function rim(v: Voice, t: number, vel: number) {
  noiseHit(v, t, 0.12 * vel, 0.05, "bandpass", 2600, 2.5, 0.25);
}

export function hat(v: Voice, t: number, vel: number, open = false) {
  noiseHit(v, t, 0.07 * vel, open ? 0.22 : 0.045, "highpass", 7200, 0.7, 0.05);
}

export function shaker(v: Voice, t: number, vel: number) {
  noiseHit(v, t, 0.04 * vel, 0.07, "bandpass", 6200, 1.2, 0.1);
}
