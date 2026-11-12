"use client";

import { setShared, useShared } from "./shared";
import { todayYmd } from "./date";

export type Tool =
  | "none"
  | "pen"
  | "pencil"
  | "marker"
  | "line"
  | "arrow"
  | "rect"
  | "ellipse"
  | "text"
  | "note"
  | "tape"
  | "eraser";

export type TapeStyle = "kraft" | "black" | "red" | "linen" | "clear";

export const SHAPE_TOOLS: Tool[] = ["line", "arrow", "rect", "ellipse"];
export const DRAW_TOOLS: Tool[] = ["pen", "pencil", "marker"];

export const INKS = [
  { id: "ink", label: "Tinta azul-negra", color: "#1c2333" },
  { id: "black", label: "Negro", color: "#111111" },
  { id: "red", label: "Bermellón", color: "#a8321f" },
  { id: "blue", label: "Azul", color: "#2b4c8c" },
  { id: "green", label: "Verde", color: "#2f5d46" },
  { id: "brass", label: "Ocre", color: "#9a7a3e" },
  { id: "pencil", label: "Grafito", color: "#5f5f5f" },
] as const;

export const HIGHLIGHTS = [
  { id: "yellow", label: "Amarillo", color: "#e9c93b" },
  { id: "orange", label: "Naranja", color: "#e0884a" },
  { id: "green", label: "Verde", color: "#8cbf6a" },
  { id: "blue", label: "Celeste", color: "#79a9d6" },
] as const;

export const SIZES = [
  { id: 1, label: "Fino" },
  { id: 2, label: "Medio" },
  { id: 3, label: "Grueso" },
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

export function useSize() {
  return useShared<number>("book:size", 2);
}
export function useHighlight() {
  return useShared<string>("book:hl", HIGHLIGHTS[0].color);
}
export function useTapeStyle() {
  return useShared<TapeStyle>("book:tape", "kraft");
}
