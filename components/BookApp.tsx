"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { BookCopy, ChevronLeft, ChevronRight, Download, LifeBuoy, PanelLeftClose, PanelLeftOpen, RotateCcw } from "lucide-react";
import { Book3D, DEFAULT_VIEW, useView } from "./book/Book3D";
import { FlatBook } from "./book/FlatBook";
import { ToolPanel } from "./book/Tools";
import { SPREAD_LIST } from "./book/spreads";
import { SosSheet } from "./SosSheet";
import { Figs } from "./Figs";
import { useHydrated } from "@/lib/useHydrated";
import { useSettings } from "@/lib/hooks";
import { useSyncState } from "@/lib/client-store";
import { goSpread, useSpread } from "@/lib/book";
import { useShared } from "@/lib/shared";
import { nowInfo } from "@/lib/month";

const SYNC_LABEL: Record<string, string> = {
  idle: "Al día",
  saved: "Guardado",
  saving: "Guardando…",
  offline: "Sin conexión",
  error: "No se guardó, reintentando",
  db_missing: "Falta conectar la base de datos",
};

const LAST = SPREAD_LIST.length - 1;

function useWide() {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia("(min-width: 960px) and (min-height: 560px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => matchMedia("(min-width: 960px) and (min-height: 560px)").matches,
    () => true,
  );
}

function useWindowSize() {
  const [s, set] = useState({ w: 1440, h: 900 });
  useEffect(() => {
    const on = () => set({ w: innerWidth, h: innerHeight });
    on();
    addEventListener("resize", on);
    return () => removeEventListener("resize", on);
  }, []);
  return s;
}

export function SyncBadge() {
  const sync = useSyncState();
  return (
    <span className="sync-dot" data-state={sync} role="status" aria-live="polite">
      <i aria-hidden /> {SYNC_LABEL[sync]}
    </span>
  );
}

function NowPlate() {
  const n = nowInfo();
  return (
    <div className="now-plate" title="Siempre a la vista: el mes y lo que queda">
      <span className="engraved now-month">
        {n.month} <Figs>{String(n.year)}</Figs>
      </span>
      <span className="now-left">
        <b className="num">{n.monthLeft}</b> {n.monthLeft === 1 ? "día queda" : "días quedan"}
      </span>
      <span className="now-year num">
        día {n.dayOfYear}/{n.yearDays}
      </span>
    </div>
  );
}

export function BookApp() {
  const hydrated = useHydrated();
  const wide = useWide();
  const [settings] = useSettings();
  const [sos, setSos] = useState(false);

  useEffect(() => {
    const d = document.documentElement;
    d.dataset.cover = settings.cover;
    d.dataset.paper = settings.paper;
  }, [settings.cover, settings.paper]);

  if (!hydrated) return <div className="desk-bg" />;

  return (
    <>
      {wide ? <Desk onSos={() => setSos(true)} /> : <FlatBook onSos={() => setSos(true)} />}
      {sos && <SosSheet onClose={() => setSos(false)} />}
    </>
  );
}

function Desk({ onSos }: { onSos: () => void }) {
  const [cur] = useSpread();
  const [, setView] = useView();
  const [toolsOpen, setToolsOpen] = useShared("desk:tools", true);
  const { w, h } = useWindowSize();
  const closed = cur < 0;

  const side = toolsOpen ? 250 : 0;
  const availW = w - side - 140;
  let pw = Math.min(600, availW / 2 - 20);
  let ph = pw * 1.36;
  const maxH = h - 170;
  if (ph > maxH) {
    ph = maxH;
    pw = ph / 1.36;
  }
  pw = Math.round(pw);
  ph = Math.round(ph);

  return (
    <div className="desk3d">
      <div className="desk-top">
        <NowPlate />
        <div className="desk-actions">
          <SyncBadge />
          <button className="brass-btn" onClick={onSos}>
            <LifeBuoy aria-hidden /> Momento difícil
          </button>
        </div>
      </div>

      {toolsOpen && (
        <aside className="desk-tools" aria-label="Herramientas">
          <ToolPanel />
        </aside>
      )}

      <div className="desk-stage">
        <Book3D pw={pw} ph={ph} offsetX={side / 2} />
      </div>

      <nav className="desk-bar" aria-label="Controles del cuaderno">
        <button onClick={() => goSpread(closed ? 1 : -1)}>
          <BookCopy aria-hidden /> {closed ? "Abrir" : "Cerrar"}
        </button>
        <button onClick={() => goSpread(Math.max(-1, cur - 1))} aria-label="Hoja anterior" disabled={closed}>
          <ChevronLeft aria-hidden />
        </button>
        <span className="desk-where">{closed ? "Portada" : SPREAD_LIST[cur]?.label}</span>
        <button onClick={() => goSpread(Math.min(LAST, cur + 1))} aria-label="Hoja siguiente" disabled={cur >= LAST}>
          <ChevronRight aria-hidden />
        </button>
        <button onClick={() => setToolsOpen(!toolsOpen)}>
          {toolsOpen ? <PanelLeftClose aria-hidden /> : <PanelLeftOpen aria-hidden />} {toolsOpen ? "Guardar herramientas" : "Herramientas"}
        </button>
        <button onClick={() => setView(DEFAULT_VIEW)} title="Arrastra el escritorio para girar el cuaderno; la rueda acerca y aleja">
          <RotateCcw aria-hidden /> Vista
        </button>
        <a href="/api/backup" download>
          <Download aria-hidden /> Copia
        </a>
      </nav>
    </div>
  );
}
