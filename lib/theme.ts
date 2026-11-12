"use client";

import { useSyncExternalStore } from "react";
import { useSettings } from "./hooks";

export type ThemeChoice = "dia" | "noche" | "auto";

/** Night between 7 pm and 6 am when set to automatic. */
export function resolveTheme(choice: ThemeChoice | undefined, hour: number): "dia" | "noche" {
  if (choice === "noche") return "noche";
  if (choice === "auto") {
    return hour >= 19 || hour < 6 ? "noche" : "dia";
  }
  return "dia";
}

// one shared clock for "auto", however many components ask
let hour = -1; // read on the client only
const subs = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
function subscribe(cb: () => void) {
  subs.add(cb);
  if (!timer)
    timer = setInterval(() => {
      const h = new Date().getHours();
      if (h !== hour) {
        hour = h;
        subs.forEach((f) => f());
      }
    }, 60_000);
  return () => {
    subs.delete(cb);
    if (!subs.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}
const getHour = () => {
  if (hour < 0) hour = new Date().getHours();
  return hour;
};
const serverHour = () => 12;

export function useTheme(): { choice: ThemeChoice; theme: "dia" | "noche"; setChoice: (c: ThemeChoice) => void } {
  const [s, setS] = useSettings();
  const choice = (s.theme ?? "dia") as ThemeChoice;
  const h = useSyncExternalStore(subscribe, getHour, serverHour);
  const theme = resolveTheme(choice, h);
  return { choice, theme, setChoice: (c) => setS((p) => ({ ...p, theme: c })) };
}

/** Ink drawn on day paper, shown legibly on night paper. */
export function nightInk(color: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (!m) return color;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (l < 0.3) {
    // dark inks become warm light ink, keeping a hint of their hue
    const mix = (c: number, t: number) => Math.round(c * 0.25 + t * 0.75);
    return `rgb(${mix(r, 232)}, ${mix(g, 220)}, ${mix(b, 196)})`;
  }
  const up = (c: number) => Math.min(255, Math.round(c + (255 - c) * 0.3));
  return `rgb(${up(r)}, ${up(g)}, ${up(b)})`;
}
