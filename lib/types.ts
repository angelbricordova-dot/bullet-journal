export type BulletKind = "task" | "event" | "note";
export type BulletState = "open" | "done" | "migrated" | "cancelled";

export interface Bullet {
  id: string;
  kind: BulletKind;
  text: string;
  state: BulletState;
}

export interface PlacedSticker {
  id: string;
  kind: string;
  /** position as a fraction of the page (0–1) */
  x: number;
  y: number;
  rot: number;
  page: "left" | "right";
}

export interface DayDoc {
  log: Bullet[];
  habits: Record<string, boolean>;
  sleep?: string; // "23:40" — hora en que se durmió la noche anterior
  wake?: string; // "06:30"
  mood?: number; // 1–5
  gratitude: string[];
  note: string;
  reading?: string; // lectura bíblica
  stickers: PlacedSticker[];
}

export interface Habit {
  id: string;
  name: string;
  hint?: string;
  active: boolean;
}

export interface ImportantDate {
  id: string;
  label: string;
  /** MM-DD for yearly dates, or YYYY-MM-DD for one-off */
  date: string;
}

export type CoverColor = "oxblood" | "saddle" | "black" | "green";
export type PaperStyle = "ruled" | "dots" | "grid" | "plain";
export type FontSet = "clasico" | "romano" | "maquina" | "manuscrito" | "moderno";

export interface Settings {
  owner: string;
  initials: string;
  cover: CoverColor;
  paper: PaperStyle;
  font?: FontSet;
  ribbon?: number | null;
  startDate: string; // YYYY-MM-DD
  habits: Habit[];
  reasons: string[];
  dates: ImportantDate[];
  payday?: string; // YYYY-MM-DD
  birthDate?: string; // YYYY-MM-DD
  lifeYears?: number;
}

export interface Fall {
  date: string; // ISO datetime
  note: string;
}

export interface Challenge {
  id: string;
  name: string;
  why: string;
  kind: "abstain" | "habit";
  habitId?: string;
  start: string; // ISO datetime (abstain) or YYYY-MM-DD (habit)
  target: number; // days
  falls: Fall[];
  wins: string[]; // ISO datetimes of temptations overcome
  cells?: Record<string, string>; // brain cell index → colour (one per clean day)
  archived?: boolean;
}

export interface Prayer {
  id: string;
  text: string;
  date: string; // YYYY-MM-DD
  answered?: string; // YYYY-MM-DD
  answerNote?: string;
  prayed?: string[]; // YYYY-MM-DD days you prayed for it
  note?: string;
}

export interface BoardMeta {
  id: string;
  name: string;
  updated: string;
}
