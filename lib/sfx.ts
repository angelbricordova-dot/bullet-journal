"use client";

import { useSyncExternalStore } from "react";

/* Paper, leather and ink sounds (generated with ElevenLabs, normalised). */
export type Sfx =
  | "page-a"
  | "page-b"
  | "page-c"
  | "book-open"
  | "book-close"
  | "pen-write"
  | "pencil-write"
  | "marker-write"
  | "eraser"
  | "tape-kraft"
  | "tape-black"
  | "tape-red"
  | "tape-linen"
  | "tape-clear"
  | "check"
  | "paper-place"
  | "photo"
  | "paint"
  | "ribbon";

const VOL: Partial<Record<Sfx, number>> = {
  "page-a": 0.7,
  "page-b": 0.7,
  "page-c": 0.7,
  "book-open": 0.7,
  "book-close": 0.7,
  "pen-write": 0.55,
  "pencil-write": 0.5,
  "marker-write": 0.45,
  eraser: 0.4,
  "tape-kraft": 0.7,
  "tape-black": 0.7,
  "tape-red": 0.7,
  "tape-linen": 0.7,
  "tape-clear": 0.7,
  check: 0.45,
  "paper-place": 0.6,
  photo: 0.6,
  paint: 0.6,
  ribbon: 0.65,
};

const PAGES: Sfx[] = ["page-a", "page-b", "page-c"];
let lastPage = -1;
/** A page turn, never the same take twice in a row. */
export function pageTurn(volume = 1) {
  let i = Math.floor(Math.random() * PAGES.length);
  if (i === lastPage) i = (i + 1) % PAGES.length;
  lastPage = i;
  play(PAGES[i], { volume });
}

export function tapeSound(style: string) {
  const name = (`tape-${style}` as Sfx) in VOL ? (`tape-${style}` as Sfx) : "tape-kraft";
  play(name);
}

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

/* ---- drawing loops: silent until the pen moves, louder the faster it moves ---- */
let loopSrc: AudioBufferSourceNode | null = null;
let loopGain: GainNode | null = null;
let loopName: Sfx | null = null;
let level = 0;

export function startLoop(name: Sfx) {
  if (muted) return;
  stopLoop();
  const c = audio();
  if (!c) return;
  loopName = name;
  level = 0;
  void load(name).then((buf) => {
    if (!buf || muted || loopName !== name) return;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = c.createGain();
    g.gain.value = 0;
    src.connect(g).connect(c.destination);
    src.start(0, Math.random() * Math.max(0, buf.duration - 0.8));
    loopSrc = src;
    loopGain = g;
    setLoopLevel(level);
  });
}

/** 0 = pen resting on the page (silent), 1 = a quick confident stroke. */
export function setLoopLevel(v: number) {
  level = Math.max(0, Math.min(1, v));
  if (!loopGain || !ctx || !loopName) return;
  const target = level * (VOL[loopName] ?? 0.4);
  loopGain.gain.cancelScheduledValues(ctx.currentTime);
  loopGain.gain.setTargetAtTime(target, ctx.currentTime, level > loopGain.gain.value ? 0.025 : 0.06);
  if (loopSrc) loopSrc.playbackRate.setTargetAtTime(0.9 + level * 0.2, ctx.currentTime, 0.05);
}

export function stopLoop() {
  loopName = null;
  if (!loopSrc || !ctx || !loopGain) return;
  const s = loopSrc;
  loopGain.gain.cancelScheduledValues(ctx.currentTime);
  loopGain.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
  setTimeout(() => {
    try {
      s.stop();
    } catch {}
  }, 200);
  loopSrc = null;
  loopGain = null;
}

