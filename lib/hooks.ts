"use client";

import { useEffect } from "react";
import { seedDoc, useDoc } from "./client-store";
import { DEFAULT_CHALLENGES, DEFAULT_SETTINGS, emptyDay, freshChallenges, freshSettings } from "./defaults";
import { nowLocal, todayYmd } from "./date";
import type { Challenge, DayDoc, Prayer, Settings } from "./types";

export function useSettings() {
  const [raw, set, loaded] = useDoc<Settings>("settings", DEFAULT_SETTINGS);
  // a brand-new (or just wiped) notebook starts its count today
  useEffect(() => {
    if (loaded) seedDoc("settings", () => freshSettings(todayYmd()));
  }, [loaded]);
  const settings: Settings = { ...DEFAULT_SETTINGS, ...raw };
  return [settings, set, loaded] as const;
}

export function useDay(date: string) {
  const [raw, set, loaded] = useDoc<DayDoc>(`day:${date}`, emptyDay());
  const day: DayDoc = { ...emptyDay(), ...raw };
  return [day, set, loaded] as const;
}

export function useChallenges() {
  const doc = useDoc<Challenge[]>("challenges", DEFAULT_CHALLENGES);
  const loaded = doc[2];
  useEffect(() => {
    if (loaded) seedDoc("challenges", () => freshChallenges(todayYmd(), nowLocal()));
  }, [loaded]);
  return doc;
}

export function usePrayers() {
  return useDoc<Prayer[]>("prayers", []);
}

export function dayScore(day: DayDoc | undefined, habitIds: string[]): number {
  if (!day || habitIds.length === 0) return 0;
  const done = habitIds.filter((id) => day.habits?.[id]).length;
  return done / habitIds.length;
}
