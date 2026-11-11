import { BookOpen, Coins, Cross, Flame, ChartLine, PenTool, Settings2 } from "lucide-react";

export const SECTIONS = [
  { href: "/hoy", label: "Hoy", icon: BookOpen },
  { href: "/retos", label: "Retos", icon: Flame },
  { href: "/progreso", label: "Progreso", icon: ChartLine },
  { href: "/fe", label: "Fe", icon: Cross },
  { href: "/dinero", label: "Dinero", icon: Coins },
  { href: "/lienzo", label: "Lienzo", icon: PenTool },
  { href: "/ajustes", label: "Ajustes", icon: Settings2 },
] as const;

export function sectionIndex(pathname: string): number {
  return SECTIONS.findIndex((s) => pathname === s.href || pathname.startsWith(s.href + "/"));
}
