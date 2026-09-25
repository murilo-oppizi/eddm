// Mechanical keyboard sounds for the price meter: Cream switch samples from kbsim by
// Thomas Lai (MIT, see public/sounds/cream/LICENSE-kbsim.md), via Murilo's ClackBar.
// Web Audio, so a press plays within a few milliseconds. The context is created (and
// the samples decoded) when the pointer first comes near the meter, and resumed on the
// first press, since browsers only allow sound after a user gesture.

const BASE = "/sounds/cream";
const FILES = {
  press1: "press-generic-r1",
  press2: "press-generic-r2",
  press3: "press-generic-r3",
  tick: "press-generic-r0",
  space: "press-space",
  enter: "press-enter",
} as const;

type Sample = keyof typeof FILES;
export type KeySound = "press" | "space" | "enter" | "tick";

const STORAGE_KEY = "eddm-key-sounds";
let ctx: AudioContext | null = null;
let loading: Promise<void> | null = null;
const buffers = new Map<Sample, AudioBuffer>();

/** Whether the visitor has turned sounds off (remembered in this browser). */
export function soundsOn() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundsOn(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Storage blocked (private mode…): the switch just won't be remembered.
  }
}

/** Create the audio context and decode the samples, once. Safe to call often. */
export function prepareSounds() {
  if (typeof window === "undefined" || loading) return loading;
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = new AudioCtx();
  const audio = ctx;
  loading = Promise.all(
    (Object.keys(FILES) as Sample[]).map(async (name) => {
      const res = await fetch(`${BASE}/${FILES[name]}.mp3`);
      buffers.set(name, await audio.decodeAudioData(await res.arrayBuffer()));
    })
  ).then(
    () => undefined,
    () => undefined // a failed load just means no sound
  );
  return loading;
}

let lastTick = 0;

/** Play a key sound. `pitch` nudges the playback rate (1 = as recorded). */
export function playKey(sound: KeySound, { gain = 0.5, pitch = 1 }: { gain?: number; pitch?: number } = {}) {
  if (!ctx || !soundsOn()) return;
  if (ctx.state === "suspended") void ctx.resume();
  if (sound === "tick") {
    // Fader detents: at most one every 40 ms, however fast it's dragged.
    const now = performance.now();
    if (now - lastTick < 40) return;
    lastTick = now;
  }
  const sample: Sample =
    sound === "press" ? (["press1", "press2", "press3"] as const)[Math.floor(Math.random() * 3)] : sound;
  const buffer = buffers.get(sample);
  if (!buffer) return;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  // A hair of random pitch, so repeated presses don't sound like a loop.
  source.playbackRate.value = pitch * (0.97 + Math.random() * 0.06);
  const volume = ctx.createGain();
  volume.gain.value = gain;
  source.connect(volume).connect(ctx.destination);
  source.start();
}
