"use client";

import { useEffect, useState } from "react";
import { BookCopy, BookmarkPlus, BookmarkX, Eye, EyeOff, ChevronLeft, ChevronRight, Download, LifeBuoy, PanelLeftClose, PanelLeftOpen, RotateCcw, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { Book3D, DEFAULT_VIEW, useView } from "./book/Book3D";
import { FlatBook } from "./book/FlatBook";
import { ToolPanel } from "./book/Tools";
import { SPREAD_LIST } from "./book/spreads";
import { useRibbonControl } from "./book/ribbon";
import { SosSheet } from "./SosSheet";
import { useHydrated } from "@/lib/useHydrated";
import { useSettings } from "@/lib/hooks";
import { useTheme } from "@/lib/theme";
import { redo, undo, useSyncState } from "@/lib/client-store";
import { goSpread, useSpread, useTool } from "@/lib/book";
import { getShared, setShared, useShared } from "@/lib/shared";
import { play, preloadSfx, setMuted, typeTick, useMuted } from "@/lib/sfx";

const SYNC_LABEL: Record<string, string> = {
  idle: "Al día",
  saved: "Guardado",
  saving: "Guardando…",
  offline: "Sin conexión",
  error: "No se guardó, reintentando",
  db_missing: "Falta conectar la base de datos",
};

const LAST = SPREAD_LIST.length - 1;
const RATIO = 1.36;

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

function pageSize(w: number, h: number, side: number) {
  const availW = w - side - 140;
  let pw = Math.min(600, availW / 2 - 20);
  let ph = pw * RATIO;
  const maxH = h - 130;
  if (ph > maxH) {
    ph = maxH;
    pw = ph / RATIO;
  }
  return { pw: Math.round(pw), ph: Math.round(ph) };
}

export function SyncBadge() {
  const sync = useSyncState();
  return (
    <span className="sync-dot" data-state={sync} role="status" aria-live="polite">
      <i aria-hidden /> {SYNC_LABEL[sync]}
    </span>
  );
}

export function SoundToggle({ className }: { className?: string }) {
  const muted = useMuted();
  return (
    <button className={className} onClick={() => setMuted(!muted)} aria-pressed={!muted} title={muted ? "Activar sonidos" : "Silenciar"}>
      {muted ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />} {muted ? "Sin sonido" : "Sonido"}
    </button>
  );
}

export function ThemeToggle({ className, long }: { className?: string; long?: boolean }) {
  const { theme, setChoice } = useTheme();
  const night = theme === "noche";
  return (
    <button
      className={className}
      onClick={() => {
        const next = night ? "dia" : "noche";
        const apply = () => {
          document.documentElement.dataset.theme = next;
          setChoice(next);
        };
        // a soft cross-fade, like dimming a lamp
        const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
        if (doc.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) doc.startViewTransition(apply);
        else apply();
      }}
      aria-pressed={night} title={night ? "Volver al modo día" : "Modo noche para leer a oscuras"}>
      {night ? <Sun aria-hidden /> : <Moon aria-hidden />} {long ? (night ? "Pasar a modo día" : "Pasar a modo noche") : night ? "Día" : "Noche"}
    </button>
  );
}

function RibbonButton({ cur }: { cur: number }) {
  const { here, toggle } = useRibbonControl(cur);
  return (
    <button onClick={toggle} title={here ? "Quitar el marcapáginas de esta hoja" : "Poner el marcapáginas en esta hoja"}>
      {here ? <BookmarkX aria-hidden /> : <BookmarkPlus aria-hidden />} {here ? "Quitar marca" : "Marcar hoja"}
    </button>
  );
}

export function BookApp() {
  const hydrated = useHydrated();
  const { w, h } = useWindowSize();
  const [settings] = useSettings();
  const [sos, setSos] = useShared("sos:open", false);
  const [toolsOpen] = useShared("desk:tools", true);

  useEffect(() => {
    const d = document.documentElement;
    d.dataset.cover = settings.cover;
    d.dataset.paper = settings.paper;
    d.dataset.font = settings.font ?? "clasico";
    d.dataset.hints = settings.hints === false ? "off" : "on";
  }, [settings.cover, settings.paper, settings.font, settings.hints]);

  const { theme } = useTheme();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "noche" ? "#0b0806" : "#15100c");
  }, [theme]);

  // sounds: warm up on first touch; soft pen while typing on a page
  useEffect(() => {
    const warm = () => preloadSfx();
    window.addEventListener("pointerdown", warm, { once: true });
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      // undo / redo outside text fields (fields keep their own undo)
      const mod = e.ctrlKey || e.metaKey;
      if (mod && !t.closest("input, textarea, [contenteditable]")) {
        const k = e.key.toLowerCase();
        if (k === "z" && !e.shiftKey) {
          e.preventDefault();
          if (undo()) play("paper-place", { volume: 0.4 });
        } else if ((k === "z" && e.shiftKey) || k === "y") {
          e.preventDefault();
          if (redo()) play("paper-place", { volume: 0.4 });
        }
        return;
      }
      if (!mod && e.key.length === 1 && t.closest(".page-content") && t.matches("input, textarea")) typeTick();
      if (!mod && (e.key === "h" || e.key === "H") && !t.closest("input, textarea, select, [contenteditable]")) {
        setShared("desk:clean", !getShared("desk:clean", false));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", warm);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!hydrated) return <div className="desk-bg" />;

  // the 3D desk needs room for two readable pages; otherwise one page at a time
  const side = toolsOpen ? 80 : 0;
  const size = pageSize(w, h, side);
  const wide = size.pw >= 390 && h >= 560;

  return (
    <>
      {wide ? <Desk onSos={() => setSos(true)} pw={size.pw} ph={size.ph} side={side} /> : <FlatBook />}
      {sos && <SosSheet onClose={() => setSos(false)} />}
    </>
  );
}

function Desk({ onSos, pw, ph, side }: { onSos: () => void; pw: number; ph: number; side: number }) {
  const [cur] = useSpread();
  const [, setView] = useView();
  const [tool, setTool] = useTool();
  const [toolsOpen, setToolsOpen] = useShared("desk:tools", true);
  const [clean, setClean] = useShared("desk:clean", false);
  const closed = cur < 0;
  const closedBack = cur > LAST;
  const shut = closed || closedBack;

  return (
    <div className="desk3d" data-tool={tool} data-clean={clean || undefined}>
      {clean && (
        <button className="unclean" onClick={() => setClean(false)} title="Mostrar la interfaz (H)" aria-label="Mostrar la interfaz">
          <Eye aria-hidden />
        </button>
      )}
      <div className="desk-top">
        <span />
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
        <button onClick={() => goSpread(closed ? 1 : closedBack ? LAST : -1)}>
          <BookCopy aria-hidden /> {shut ? "Abrir" : "Cerrar"}
        </button>
        <button onClick={() => goSpread(Math.max(-1, cur - 1))} aria-label="Hoja anterior" disabled={closed}>
          <ChevronLeft aria-hidden />
        </button>
        <span className="desk-where">{closed ? "Portada" : closedBack ? "Contraportada" : SPREAD_LIST[cur]?.label}</span>
        <button onClick={() => goSpread(Math.min(LAST + 1, cur + 1))} aria-label={cur === LAST ? "Cerrar por detrás" : "Hoja siguiente"} title={cur === LAST ? "Cerrar por detrás" : undefined} disabled={cur > LAST}>
          <ChevronRight aria-hidden />
        </button>
        <button
          aria-pressed={toolsOpen}
          title={toolsOpen ? "Ocultar herramientas" : "Mostrar herramientas"}
          onClick={() => {
            if (toolsOpen) setTool("none");
            setToolsOpen(!toolsOpen);
          }}
        >
          {toolsOpen ? <PanelLeftClose aria-hidden /> : <PanelLeftOpen aria-hidden />} Herramientas
        </button>
        <button onClick={() => setView(DEFAULT_VIEW)} title="Arrastra el escritorio para girar el cuaderno; la rueda acerca y aleja">
          <RotateCcw aria-hidden /> Vista
        </button>
        {!shut && <RibbonButton cur={cur} />}
        <SoundToggle />
        <ThemeToggle />
        <button
          onClick={() => {
            setTool("none");
            setClean(true);
          }}
          title="Ocultar toda la interfaz y dejar solo el cuaderno (H)"
        >
          <EyeOff aria-hidden /> Limpiar
        </button>
        <a href="/api/backup" download>
          <Download aria-hidden /> Copia
        </a>
      </nav>
    </div>
  );
}
