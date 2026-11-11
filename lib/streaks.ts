import type { Challenge, DayDoc } from "./types";
import { addDays, daysBetween, elapsed, todayYmd } from "./date";

/** Consecutive days (ending today, or yesterday if today isn't done yet) where a habit was done. */
export function habitStreak(
  habitId: string,
  days: Record<string, DayDoc | undefined>,
  from: string = todayYmd(),
  notBefore?: string,
): number {
  let d = from;
  if (!days[`day:${d}`]?.habits?.[habitId]) d = addDays(d, -1);
  let n = 0;
  while (days[`day:${d}`]?.habits?.[habitId]) {
    if (notBefore && d < notBefore) break;
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function bestHabitStreak(habitId: string, days: Record<string, DayDoc | undefined>, notBefore?: string): number {
  const dates = Object.keys(days)
    .filter((k) => k.startsWith("day:") && days[k]?.habits?.[habitId])
    .map((k) => k.slice(4))
    .filter((d) => !notBefore || d >= notBefore)
    .sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of dates) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** For an abstinence challenge: the moment the current run started. */
export function runStart(c: Challenge): string {
  const last = c.falls.length ? c.falls[c.falls.length - 1].date : null;
  return last && new Date(last).getTime() > new Date(c.start).getTime() ? last : c.start;
}

export function abstainNow(c: Challenge, now = Date.now()) {
  return elapsed(runStart(c), now);
}

export function bestAbstain(c: Challenge, now = Date.now()): number {
  const marks = [c.start, ...c.falls.map((f) => f.date)].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  let best = 0;
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? new Date(marks[i + 1]).getTime() : now;
    best = Math.max(best, Math.floor((end - new Date(marks[i]).getTime()) / 86_400_000));
  }
  return best;
}

export function challengeDays(c: Challenge, days: Record<string, DayDoc | undefined>): number {
  if (c.kind === "abstain") return abstainNow(c).days;
  return c.habitId ? habitStreak(c.habitId, days, todayYmd(), c.start.slice(0, 10)) : 0;
}

export function challengeBest(c: Challenge, days: Record<string, DayDoc | undefined>): number {
  if (c.kind === "abstain") return bestAbstain(c);
  return c.habitId ? bestHabitStreak(c.habitId, days, c.start.slice(0, 10)) : 0;
}
