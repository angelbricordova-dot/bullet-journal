import { daysBetween, monthName, parseYmd, todayYmd } from "./date";

export interface MonthDoc {
  goals: { id: string; text: string; done: boolean }[];
  notes: Record<string, string>; // "1".."31" → short note on the calendar
  summary: string;
}

export const emptyMonth = (): MonthDoc => ({ goals: [], notes: {}, summary: "" });

export function monthInfo(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const first = new Date(y, m - 1, 1);
  const startDow = (first.getDay() + 6) % 7; // Monday = 0
  const today = todayYmd();
  const isCurrent = today.slice(0, 7) === ym;
  const left = isCurrent ? days - parseYmd(today).getDate() : today < `${ym}-01` ? days : 0;
  return { y, m, days, startDow, name: monthName(m - 1), isCurrent, left };
}

export function shiftMonth(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Today's place in the month and the year — the cover always shows this. */
export function nowInfo() {
  const today = todayYmd();
  const d = parseYmd(today);
  const y = d.getFullYear();
  const mi = monthInfo(today.slice(0, 7));
  const yearDays = daysBetween(`${y}-01-01`, `${y + 1}-01-01`);
  const dayOfYear = daysBetween(`${y}-01-01`, today) + 1;
  return {
    today,
    year: y,
    month: mi.name,
    monthDays: mi.days,
    day: d.getDate(),
    monthLeft: mi.days - d.getDate(),
    dayOfYear,
    yearLeft: yearDays - dayOfYear,
    yearDays,
  };
}
