"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LifeBuoy } from "lucide-react";
import { BrassCorner } from "./BrassCorner";
import { Figs } from "./Figs";
import { SECTIONS, sectionIndex } from "./nav";
import { SosSheet } from "./SosSheet";
import { useSettings } from "@/lib/hooks";
import { useSyncState } from "@/lib/client-store";
import { daysBetween, todayYmd } from "@/lib/date";
import { useHydrated } from "@/lib/useHydrated";

const SYNC_LABEL: Record<string, string> = {
  idle: "Al día",
  saved: "Guardado",
  saving: "Guardando…",
  offline: "Sin conexión",
  error: "No se guardó, reintentando",
  db_missing: "Falta conectar la base de datos",
};

export function BookShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const [settings] = useSettings();
  const sync = useSyncState();
  const [sos, setSos] = useState(false);
  const [turn, setTurn] = useState<{ key: number; dir: "fwd" | "back" } | null>(null);
  const prevIdx = useRef(sectionIndex(pathname));

  // Apply cover & paper choices
  useEffect(() => {
    const d = document.documentElement;
    d.dataset.cover = settings.cover;
    d.dataset.paper = settings.paper;
  }, [settings.cover, settings.paper]);

  // Page turn when the section changes
  useEffect(() => {
    const idx = sectionIndex(pathname);
    if (idx !== prevIdx.current && idx >= 0 && prevIdx.current >= 0) {
      setTurn({ key: Date.now(), dir: idx > prevIdx.current ? "fwd" : "back" });
    }
    prevIdx.current = idx;
  }, [pathname]);

  // Keyboard: Alt+1..7 jumps sections
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && /^[1-7]$/.test(e.key)) {
        const s = SECTIONS[Number(e.key) - 1];
        if (s) window.location.assign(s.href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const full = pathname.startsWith("/lienzo");
  const dayN = hydrated ? daysBetween(settings.startDate, todayYmd()) + 1 : 0;
  const current = sectionIndex(pathname);

  return (
    <div className="desk">
      <div className="book">
        <BrassCorner className="tl" />
        <BrassCorner className="tr" />
        <BrassCorner className="bl" />
        <BrassCorner className="br" />

        <header className="mobile-head">
          <span className="engraved">{dayN > 0 ? <Figs>{`Día ${dayN} del cambio`}</Figs> : "Bitácora"}</span>
          <button className="brass-btn" onClick={() => setSos(true)}>
            <LifeBuoy aria-hidden /> Momento difícil
          </button>
        </header>

        <div className="cover-bar">
          <span className="sync-dot" data-state={sync} role="status" aria-live="polite">
            <i aria-hidden /> {SYNC_LABEL[sync]}
          </span>
          <button className="brass-btn" onClick={() => setSos(true)}>
            <LifeBuoy aria-hidden /> Momento difícil
          </button>
        </div>

        <nav className="tabs" aria-label="Secciones">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Link key={s.href} href={s.href} className="tab" aria-current={i === current ? "page" : undefined} title={`${s.label} (Alt+${i + 1})`}>
                <Icon aria-hidden />
                <span className="tab-label">{s.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={`spread${full ? " full" : ""}`}>
          <div className="mobile-scroll" key={pathname}>
            {hydrated ? children : null}
          </div>
          <div className="gutter" aria-hidden />
          {!full && <div className="ribbon" aria-hidden />}
          {turn && <div key={turn.key} className={`turn ${turn.dir}`} onAnimationEnd={() => setTurn(null)} aria-hidden />}
        </div>

        <nav className="mobile-tabs" aria-label="Secciones">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Link key={s.href} href={s.href} aria-current={i === current ? "page" : undefined}>
                <Icon aria-hidden />
                {s.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {sos && <SosSheet onClose={() => setSos(false)} />}
    </div>
  );
}
