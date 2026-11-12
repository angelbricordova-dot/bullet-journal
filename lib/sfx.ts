"use client";

import { useSyncExternalStore } from "react";

/* Paper, leather and ink sounds (generated with ElevenLabs, normalised). */
export type Sfx =
  | "page-turn"
  | "page-turn-2"
  | "book-open"
  | "book-close"
  | "pen"
  | "pencil"
  | "marker"
  | "eraser"
  | "tape"
  | "check"
  | "paper-place"
  | "photo";

const VOL: Partial<Record<Sfx, number>> = {
  "page-turn": 0.8,
  "page-turn-2": 0.6,
  "book-open": 0.75,
  "book-close": 0.75,
  pen: 0.32,
  pencil: 0.3,
  marker: 0.28,
  eraser: 0.3,
  tape: 0.6,
  check: 0.45,
  "paper-place": 0.6,
  photo: 0.6,
};

let ctx: AudioContext | null = null;
const buffers = new Map<Sfx, AudioBuffer>();
const loading = new Map<Sfx, Promise<AudioBuffer | null>>();

const KEY = "bitacora:sound";
let muted = false;
try {
  muted = typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "off";
} catch {}
const subs = new Set<() => void>();

export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(KEY, m ? "off" : "on");
  } catch {}
  if (m) stopLoop();
  subs.forEach((f) => f());
}

export function useMuted() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => muted,
    () => false,
  );
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function load(name: Sfx): Promise<AudioBuffer | null> {
  const c = audio();
  if (!c) return Promise.resolve(null);
  if (buffers.has(name)) return Promise.resolve(buffers.get(name)!);
  if (!loading.has(name)) {
    loading.set(
      name,
      fetch(`/sfx/${name}.mp3`)
        .then((r) => r.arrayBuffer())
        .then((b) => c.decodeAudioData(b))
        .then((buf) => {
          buffers.set(name, buf);
          return buf;
        })
        .catch(() => null),
    );
  }
  return loading.get(name)!;
}

/** Warm the cache on the first gesture so later sounds start instantly. */
export function preloadSfx() {
  (Object.keys(VOL) as Sfx[]).forEach((n) => void load(n));
}

export function play(name: Sfx, opts: { volume?: number; rate?: number; offset?: number; duration?: number } = {}) {
  if (muted) return;
  const c = audio();
  if (!c) return;
  void load(name).then((buf) => {
    if (!buf || muted) return;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = opts.rate ?? 0.94 + Math.random() * 0.12;
    const g = c.createGain();
    const v = (opts.volume ?? 1) * (VOL[name] ?? 0.6);
    g.gain.value = v;
    src.connect(g).connect(c.destination);
    if (opts.duration) {
      g.gain.setValueAtTime(v, c.currentTime + opts.duration * 0.6);
      g.gain.linearRampToValueAtTime(0, c.currentTime + opts.duration);
      src.start(0, opts.offset ?? 0, opts.duration + 0.02);
    } else src.start(0, opts.offset ?? 0);
  });
}

/* ---- looping sounds for drawing: start on pointer down, stop on up ---- */
let loopSrc: AudioBufferSourceNode | null = null;
let loopGain: GainNode | null = null;

export function startLoop(name: Sfx) {
  if (muted) return;
  stopLoop();
  const c = audio();
  if (!c) return;
  void load(name).then((buf) => {
    if (!buf || muted) return;
    stopLoop();
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(VOL[name] ?? 0.3, c.currentTime + 0.05);
    src.connect(g).connect(c.destination);
    src.start(0, Math.random() * Math.max(0, buf.duration - 0.6));
    loopSrc = src;
    loopGain = g;
  });
}

export function stopLoop() {
  if (!loopSrc || !ctx || !loopGain) return;
  const s = loopSrc;
  loopGain.gain.cancelScheduledValues(ctx.currentTime);
  loopGain.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
  setTimeout(() => {
    try {
      s.stop();
    } catch {}
  }, 160);
  loopSrc = null;
  loopGain = null;
}

/* ---- a soft pen stroke while typing on a page ---- */
let lastType = 0;
export function typeTick() {
  const now = performance.now();
  if (now - lastType < 90) return;
  lastType = now;
  play("pencil", { volume: 0.4, rate: 1.3 + Math.random() * 0.3, offset: Math.random() * 1.8, duration: 0.09 });
}
