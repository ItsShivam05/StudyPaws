/**
 * Shared Web Audio graph.
 *
 *   music voices ──► musicDry ─┐
 *                └► musicVerb ─► reverb ─┤
 *                                       ├► musicTone (lowpass "tape") ► musicGain ► master ► out
 *   ambience sounds ─► ambienceGain ────────────────────────────────────────────────► master
 *   chimes / purrs  ─► fxGain ──────────────────────────────────────────────────────► master
 *
 * Everything is synthesized at runtime, so no audio files ship with the app.
 */

export interface AudioGraph {
  ctx: AudioContext;
  master: GainNode;
  musicDry: GainNode;
  musicVerb: GainNode;
  musicTone: BiquadFilterNode;
  musicGain: GainNode;
  ambienceGain: GainNode;
  ambienceVerb: GainNode;
  fxGain: GainNode;
  noise: AudioBuffer; // 4s stereo white noise, seamless when looped
  brown: AudioBuffer; // 6s stereo brown noise, crossfaded loop
  pink: AudioBuffer; // 6s pink noise
}

let graph: AudioGraph | null = null;

type Ctor = typeof AudioContext;

function getCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext ??
    null
  );
}

export function isAudioSupported() {
  return getCtor() !== null;
}

/** Returns the graph if it was already created (never creates one). */
export function peekGraph() {
  return graph;
}

/** Creates (on first call) and resumes the audio graph. Call from a user gesture. */
export function getGraph(): AudioGraph | null {
  const Ctor = getCtor();
  if (!Ctor) return null;
  if (!graph) {
    const ctx = new Ctor({ latencyHint: "playback" });
    const master = ctx.createGain();
    master.gain.value = 0.9;

    // Gentle limiter so stacked sounds never clip.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.01;
    comp.release.value = 0.25;
    master.connect(comp).connect(ctx.destination);

    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(ctx, 2.8, 3.2);

    const musicTone = ctx.createBiquadFilter();
    musicTone.type = "lowpass";
    musicTone.frequency.value = 4200;
    musicTone.Q.value = 0.4;

    const musicGain = ctx.createGain();
    musicGain.gain.value = 0;

    const musicDry = ctx.createGain();
    const musicVerb = ctx.createGain();
    musicVerb.gain.value = 1;
    musicDry.connect(musicTone);
    musicVerb.connect(reverb);
    const reverbReturn = ctx.createGain();
    reverbReturn.gain.value = 0.55;
    reverb.connect(reverbReturn).connect(musicTone);
    musicTone.connect(musicGain).connect(master);

    const ambienceGain = ctx.createGain();
    ambienceGain.connect(master);
    const ambienceVerb = ctx.createGain();
    const ambienceReverb = ctx.createConvolver();
    ambienceReverb.buffer = makeImpulse(ctx, 3.5, 2.5);
    ambienceVerb.connect(ambienceReverb).connect(ambienceGain);

    const fxGain = ctx.createGain();
    fxGain.connect(master);

    graph = {
      ctx,
      master,
      musicDry,
      musicVerb,
      musicTone,
      musicGain,
      ambienceGain,
      ambienceVerb,
      fxGain,
      noise: makeWhiteNoise(ctx, 4),
      brown: makeLoop(ctx, 6, brownGenerator),
      pink: makeLoop(ctx, 6, pinkGenerator),
    };
  }
  if (graph.ctx.state === "suspended") {
    void graph.ctx.resume().catch(() => {});
  }
  return graph;
}

/* ------------------------------------------------------------------ */
/*  Buffer helpers                                                     */
/* ------------------------------------------------------------------ */

function makeImpulse(ctx: BaseAudioContext, seconds: number, decay: number) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function makeWhiteNoise(ctx: BaseAudioContext, seconds: number) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return buf;
}

type SampleGen = () => (i: number) => number;

function brownGenerator(): (i: number) => number {
  let last = 0;
  return () => {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    return last * 3.5;
  };
}

function pinkGenerator(): (i: number) => number {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  return () => {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    const out = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
    b6 = w * 0.115926;
    return out * 0.11;
  };
}

/**
 * Generates `seconds` of audio plus a tail, then crossfades the tail into
 * the head so the buffer loops without a click.
 */
export function makeLoop(ctx: BaseAudioContext, seconds: number, gen: SampleGen, channels = 2) {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * seconds);
  const fade = Math.floor(sr * 0.5);
  const buf = ctx.createBuffer(channels, len, sr);
  for (let c = 0; c < channels; c++) {
    const next = gen();
    const raw = new Float32Array(len + fade);
    for (let i = 0; i < raw.length; i++) raw[i] = next(i);
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = raw[i];
    for (let i = 0; i < fade; i++) {
      const t = i / fade;
      d[i] = raw[len + i] * (1 - t) + raw[i] * t;
    }
  }
  return buf;
}

/** Loops a buffer from a random offset. */
export function loopSource(ctx: BaseAudioContext, buffer: AudioBuffer, rate = 1) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.playbackRate.value = rate;
  return { src, start: (t = 0) => src.start(t, Math.random() * buffer.duration) };
}

export function mtof(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Small seeded RNG so generative tracks are varied but reproducible. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smoothly move an AudioParam to a value. */
export function glide(param: AudioParam, value: number, ctx: BaseAudioContext, seconds = 0.25) {
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.setTargetAtTime(value, now, seconds / 3);
}
