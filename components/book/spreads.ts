import { BookOpen, Brain, CalendarDays, ChartLine, Cross, Hourglass, ListOrdered, NotebookPen, Settings2 } from "lucide-react";

/** Order of the spreads in the book. Index = spread number; each tab sits on its leaf. */
export const SPREAD_LIST = [
  { key: "indice", label: "Índice", hint: "Portada, tiempo que queda y el índice", icon: ListOrdered },
  { key: "hoy", label: "Hoy", hint: "Pendientes, hábitos y lo que pasó", icon: BookOpen },
  { key: "mes", label: "Mes", hint: "Bienvenida del mes, metas y calendario", icon: CalendarDays },
  { key: "trackers", label: "Trackers", hint: "Sueño, ánimo y hábitos con puntos", icon: ChartLine },
  { key: "retos", label: "Retos", hint: "El cerebro de pureza y tus rachas", icon: Brain },
  { key: "vida", label: "Vida", hint: "Tu vida en semanas: cada día cuenta", icon: Hourglass },
  { key: "fe", label: "Fe", hint: "Versículos, lectura, gratitud y oración", icon: Cross },
  { key: "resumen", label: "Resumen", hint: "El mes en números y lo que aprendiste", icon: NotebookPen },
  { key: "ajustes", label: "Ajustes", hint: "Portada, modo, letra, papel, hábitos y copia", icon: Settings2 },
] as const;

export type SpreadKey = (typeof SPREAD_LIST)[number]["key"];

export const SPREAD_INDEX = Object.fromEntries(SPREAD_LIST.map((s, i) => [s.key, i])) as Record<SpreadKey, number>;
