"use client";

import { setShared, useShared } from "./shared";
import { todayYmd } from "./date";

export type Tool = "none" | "pen" | "marker" | "eraser";

export const INKS = [
  { id: "ink", label: "Tinta", color: "#1c2333" },
  { id: "red", label: "Bermellón", color: "#a8321f" },
  { id: "pencil", label: "Lápiz", color: "#6b6b6b" },
  { id: "brass", label: "Latón", color: "#9a7a3e" },
] as const;

/** Index of the open spread; -1 means the book is closed. */
export function useSpread() {
  return useShared<number>("book:spread", 1);
}
export function goSpread(n: number) {
  setShared("book:spread", n);
}

export function useBookDate() {
  return useShared<string>("book:date", todayYmd());
}
export function setBookDate(d: string) {
  setShared("book:date", d);
}

export function useBookMonth() {
  return useShared<string>("book:month", todayYmd().slice(0, 7));
}
export function setBookMonth(m: string) {
  setShared("book:month", m);
}

export function useTool() {
  return useShared<Tool>("book:tool", "none");
}
export function useInk() {
  return useShared<string>("book:ink", INKS[0].color);
}
