"use client";

import { useDoc } from "./client-store";
import { DEFAULT_CHALLENGES, DEFAULT_MONEY, DEFAULT_SETTINGS, emptyDay } from "./defaults";
import type { Challenge, DayDoc, MoneyDoc, Prayer, Settings } from "./types";

export function useSettings() {
  const [raw, set, loaded] = useDoc<Settings>("settings", DEFAULT_SETTINGS);
  const settings: Settings = { ...DEFAULT_SETTINGS, ...raw };
  return [settings, set, loaded] as const;
}

export function useDay(date: string) {
  const [raw, set, loaded] = useDoc<DayDoc>(`day:${date}`, emptyDay());
  const day: DayDoc = { ...emptyDay(), ...raw };
  return [day, set, loaded] as const;
}

export function useChallenges() {
  return useDoc<Challenge[]>("challenges", DEFAULT_CHALLENGES);
}

export function useMoney() {
  const [raw, set, loaded] = useDoc<MoneyDoc>("money", DEFAULT_MONEY);
  return [{ ...DEFAULT_MONEY, ...raw }, set, loaded] as const;
}

export function usePrayers() {
  return useDoc<Prayer[]>("prayers", []);
}

export function dayScore(day: DayDoc | undefined, habitIds: string[]): number {
  if (!day || habitIds.length === 0) return 0;
  const done = habitIds.filter((id) => day.habits?.[id]).length;
  return done / habitIds.length;
}
