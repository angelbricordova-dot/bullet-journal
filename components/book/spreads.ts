import { BookBookmark, BookOpen, CalendarDays, ChartLine, Cross, Flame, ListOrdered, NotebookPen, Settings2 } from "lucide-react";

/** Order of the spreads in the book. Index = spread number; each tab sits on its leaf. */
export const SPREAD_LIST = [
  { key: "indice", label: "Índice", hint: "Portada, tiempo que queda y el índice", icon: ListOrdered },
  { key: "hoy", label: "Hoy", hint: "Registro del día, hábitos, sueño, gratitud", icon: BookOpen },
  { key: "mes", label: "Mes", hint: "Bienvenida del mes, metas y calendario", icon: CalendarDays },
  { key: "trackers", label: "Trackers", hint: "Hábitos con puntos, sueño y ánimo", icon: ChartLine },
  { key: "retos", label: "Retos", hint: "Rachas, caídas y victorias", icon: Flame },
  { key: "fe", label: "Fe", hint: "Versículos y diario de oración", icon: Cross },
  { key: "libros", label: "Libros", hint: "Lecturas y hoja libre", icon: BookBookmark },
  { key: "resumen", label: "Resumen", hint: "El mes en números y tus datos de Real", icon: NotebookPen },
  { key: "ajustes", label: "Ajustes", hint: "Portada, papel, hábitos y copia", icon: Settings2 },
] as const;

export type SpreadKey = (typeof SPREAD_LIST)[number]["key"];

export const SPREAD_INDEX = Object.fromEntries(SPREAD_LIST.map((s, i) => [s.key, i])) as Record<SpreadKey, number>;
