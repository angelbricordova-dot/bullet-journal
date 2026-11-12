"use client";

import { useSettings } from "@/lib/hooks";
import { play } from "@/lib/sfx";

/** Spread the silk ribbon marks, or null when it's been taken out. */
export function useRibbon(): number | null {
  const [s] = useSettings();
  return s.ribbon === undefined ? 1 : s.ribbon;
}

export function useRibbonControl(cur: number) {
  const [s, setS] = useSettings();
  const ribbon = s.ribbon === undefined ? 1 : s.ribbon;
  const here = ribbon === cur;
  const toggle = () => {
    play("ribbon");
    setS((p) => ({ ...p, ribbon: here ? null : cur }));
  };
  return { ribbon, here, toggle };
}
