const pad = (n: number) => String(n).padStart(2, "0");

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayYmd(): string {
  return ymd(new Date());
}

/** Local date and time, e.g. 2026-11-12T21:40:05 (no zone, like the rest of the app). */
export function nowLocal(): string {
  const d = new Date();
  return `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function addDays(s: string, n: number): string {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

/** Whole calendar days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  const ms = parseYmd(b).getTime() - parseYmd(a).getTime();
  return Math.round(ms / 86_400_000);
}

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
export const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function weekday(s: string): string {
  return WEEKDAYS[parseYmd(s).getDay()];
}

export function longDate(s: string): string {
  const d = parseYmd(s);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

export function shortDate(s: string): string {
  const d = parseYmd(s);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function monthName(m: number): string {
  return MONTHS[m];
}

/** Next occurrence (today or later) of an important date. Accepts MM-DD or YYYY-MM-DD. */
export function nextOccurrence(date: string, from: string = todayYmd()): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date >= from ? date : null;
  if (!/^\d{2}-\d{2}$/.test(date)) return null;
  const year = parseYmd(from).getFullYear();
  const thisYear = `${year}-${date}`;
  return thisYear >= from ? thisYear : `${year + 1}-${date}`;
}

/** Elapsed whole days and hours since an ISO datetime. */
export function elapsed(iso: string, now = Date.now()) {
  const ms = Math.max(0, now - new Date(iso).getTime());
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return { days, hours, ms };
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Roman numerals, for the cover year. */
export function roman(n: number): string {
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}
