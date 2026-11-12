"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minus, Plus, X } from "lucide-react";
import { addDays, shortDate } from "@/lib/date";
import styles from "./weeks.module.css";

/** Your life in weeks, drawn on a canvas (thousands of dots stay light). */

const INK = "#1c2333";
const RED = "#a8321f";
const EMPTY = "rgba(28,35,51,.32)";

function layout(years: number) {
  // in "dot" units: 52 columns in groups of 4, rows grouped by 5 years
  const colX = (c: number) => 3 + c + Math.floor(c / 4) * 0.45;
  const rowY = (r: number) => 1.2 + r + Math.floor(r / 5) * 0.6;
  return { colX, rowY, w: colX(51) + 1.2, h: rowY(years - 1) + 1.2 };
}

function draw(canvas: HTMLCanvasElement, years: number, lived: number, scale: number, hover: number | null) {
  const { colX, rowY, w, h } = layout(years);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(w * scale * dpr);
  canvas.height = Math.round(h * scale * dpr);
  const g = canvas.getContext("2d")!;
  g.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
  g.clearRect(0, 0, w, h);
  g.font = `0.7px system-ui, sans-serif`;
  g.fillStyle = "rgba(28,35,51,.55)";
  g.textBaseline = "middle";
  for (let r = 0; r < years; r += 5) g.fillText(String(r), 0, rowY(r) + 0.5);
  const R = 0.38;
  for (let r = 0; r < years; r++) {
    for (let c = 0; c < 52; c++) {
      const i = r * 52 + c;
      const x = colX(c) + 0.5;
      const y = rowY(r) + 0.5;
      g.beginPath();
      g.arc(x, y, i === hover ? R * 1.35 : R, 0, Math.PI * 2);
      if (i < lived) {
        g.fillStyle = INK;
        g.fill();
      } else if (i === lived) {
        g.fillStyle = RED;
        g.fill();
      } else {
        g.lineWidth = 0.09;
        g.strokeStyle = EMPTY;
        g.stroke();
      }
    }
  }
}

function hitWeek(e: React.MouseEvent<HTMLCanvasElement>, years: number): number | null {
  const { colX, rowY, w } = layout(years);
  const rect = e.currentTarget.getBoundingClientRect();
  const u = ((e.clientX - rect.left) / rect.width) * w;
  const v = ((e.clientY - rect.top) / rect.width) * w;
  let col = -1;
  for (let c = 0; c < 52; c++) if (u >= colX(c) && u < colX(c) + 1) col = c;
  let row = -1;
  for (let r = 0; r < years; r++) if (v >= rowY(r) && v < rowY(r) + 1) row = r;
  return col < 0 || row < 0 ? null : row * 52 + col;
}

function weekLabel(i: number, birth: string, lived: number) {
  const start = addDays(birth, i * 7);
  const age = Math.floor(i / 52);
  const when = i < lived ? "vivida" : i === lived ? "esta semana" : "por vivir";
  return `Semana ${(i + 1).toLocaleString("es-VE")} · ${age} años · ${shortDate(start)} ${start.slice(0, 4)} · ${when}`;
}

export function WeeksGrid({ years, lived, birth }: { years: number; lived: number; birth: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const { w, h } = layout(years);

  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const paint = () => {
      const availW = c.parentElement!.clientWidth || 300;
      const ph = parseFloat(getComputedStyle(c).getPropertyValue("--ph"));
      const maxH = Number.isFinite(ph) && ph > 0 ? ph - 200 : Infinity;
      const cssW = Math.max(160, Math.min(availW, (maxH * w) / h));
      c.style.width = `${cssW}px`;
      draw(c, years, lived, cssW / w, hover);
    };
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(c.parentElement!);
    return () => ro.disconnect();
  }, [years, lived, hover, w, h]);

  return (
    <div className={styles.wrap}>
      <canvas
        ref={ref}
        className={styles.canvas}
        style={{ aspectRatio: `${w} / ${h}` }}
        onMouseMove={(e) => setHover(hitWeek(e, years))}
        onMouseLeave={() => setHover(null)}
        onClick={() => setOpen(true)}
        role="img"
        aria-label={`${lived} semanas vividas de ${years * 52}. Toca para ampliar.`}
      />
      <div className={styles.under}>
        <span className="caption">{hover !== null ? weekLabel(hover, birth, lived) : " "}</span>
        <button className={styles.zoomBtn} onClick={() => setOpen(true)}>
          <Maximize2 aria-hidden /> Ampliar
        </button>
      </div>
      {open && <Zoom years={years} lived={lived} birth={birth} onClose={() => setOpen(false)} />}
    </div>
  );
}

function Zoom({ years, lived, birth, onClose }: { years: number; lived: number; birth: string; onClose: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { w, h } = layout(years);
  const fit = Math.max(6, Math.min((innerHeight - 140) / h, (innerWidth - 80) / w));
  const [scale, setScale] = useState(fit);
  const [hover, setHover] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (ref.current) draw(ref.current, years, lived, scale, hover);
  }, [years, lived, scale, hover]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [onClose]);

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Tu vida en semanas, ampliada" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.bar}>
        <span className={`engraved ${styles.title}`}>Tu vida en semanas</span>
        <span className={styles.info}>{hover !== null ? weekLabel(hover, birth, lived) : `${lived.toLocaleString("es-VE")} semanas vividas`}</span>
        <button onClick={() => setScale((s) => Math.max(fit * 0.6, s / 1.25))} aria-label="Alejar">
          <Minus />
        </button>
        <button onClick={() => setScale((s) => Math.min(60, s * 1.25))} aria-label="Acercar">
          <Plus />
        </button>
        <button onClick={onClose} aria-label="Cerrar">
          <X />
        </button>
      </div>
      <div
        className={styles.scroller}
        onWheel={(e) => {
          if (!e.ctrlKey && !e.metaKey) return;
          e.preventDefault();
          setScale((s) => Math.max(fit * 0.6, Math.min(60, s * (e.deltaY > 0 ? 0.9 : 1.1))));
        }}
      >
        <canvas
          ref={ref}
          style={{ width: w * scale, height: h * scale }}
          onMouseMove={(e) => setHover(hitWeek(e, years))}
          onMouseLeave={() => setHover(null)}
        />
      </div>
    </div>,
    document.body,
  );
}
