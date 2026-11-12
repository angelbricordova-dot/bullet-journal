"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { GripVertical, Maximize2, RotateCw, X } from "lucide-react";
import { ensureLoaded, useDoc, writeDoc } from "@/lib/client-store";
import { SHAPE_TOOLS, useHighlight, useInk, useSize, useTapeStyle, useTool, type TapeStyle } from "@/lib/book";
import { play, setLoopLevel, startLoop, stopLoop, tapeSound } from "@/lib/sfx";
import { drag, now } from "@/lib/drag";
import { uid } from "@/lib/date";
import { tilt } from "@/lib/random";
import { STICKER_NODES } from "../Stickers";
import styles from "./deco.module.css";

export type { TapeStyle };

/* ------------------------------------------------------------------
 * Everything placed on a page: ink, shapes, washi tape, taped photos,
 * text and sticky notes. Coordinates are normalised by the page width
 * so a page looks the same on the 3D book and on a phone.
 * ---------------------------------------------------------------- */

export interface DecoItem {
  id: string;
  type: "sticker" | "tape" | "photo" | "text" | "note";
  kind?: string;
  style?: TapeStyle;
  src?: string;
  text?: string;
  color?: string;
  x: number; // 0..1 of width
  y: number; // px / width
  rot: number;
  scale: number;
  len?: number;
  w?: number;
}

export type StrokeMode = "pen" | "pencil" | "marker" | "line" | "arrow" | "rect" | "ellipse";

export interface Stroke {
  id: string;
  color: string;
  size: number; // fraction of width
  mode: StrokeMode;
  pts: number[];
}

export interface DecoDoc {
  items: DecoItem[];
  strokes: Stroke[];
}

const EMPTY: DecoDoc = { items: [], strokes: [] };
const BASE_W = 500;

const WIDTH: Record<"pen" | "pencil" | "marker", number[]> = {
  pen: [1.6, 2.6, 4.2],
  pencil: [1.1, 1.7, 2.6],
  marker: [10, 16, 24],
};

/* ---------- placing from the tool panel ---------- */

export type NewItem = Omit<DecoItem, "id" | "x" | "y">;

function activeHost(): HTMLElement | null {
  const hosts = [...document.querySelectorAll<HTMLElement>("[data-deco-host][data-active]")];
  let best: HTMLElement | null = null;
  let bestArea = -1;
  for (const h of hosts) {
    const r = h.getBoundingClientRect();
    const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
    const hgt = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    if (w * hgt >= bestArea) {
      bestArea = w * hgt;
      best = h;
    }
  }
  return best;
}

function localPoint(host: HTMLElement, clientX: number, clientY: number) {
  const r = host.getBoundingClientRect();
  const W = host.offsetWidth;
  const H = host.offsetHeight;
  const x = (clientX - r.left) / r.width;
  const yPx = (clientY - r.top) * (H / r.height);
  return { x, y: yPx / W };
}

async function addTo(hostId: string, item: DecoItem) {
  const key = `deco:${hostId}`;
  const cur = { ...EMPTY, ...((await ensureLoaded<DecoDoc>(key)) ?? {}) };
  writeDoc<DecoDoc>(key, { ...cur, items: [...(cur.items ?? []), item] });
}

/** Place at the centre of whatever page is in view. */
export function placeOnActivePage(item: NewItem) {
  const host = activeHost();
  if (!host) return;
  const r = host.getBoundingClientRect();
  const cx = (Math.max(r.left, 0) + Math.min(r.right, innerWidth)) / 2;
  const cy = (Math.max(r.top, 0) + Math.min(r.bottom, innerHeight)) / 2;
  const p = localPoint(host, cx + (Math.random() - 0.5) * 40, cy + (Math.random() - 0.5) * 40);
  void addTo(host.dataset.decoHost!, { ...item, id: uid(), ...p });
  if (item.type === "tape") tapeSound(item.style ?? "kraft");
  else play(item.type === "photo" ? "photo" : "paper-place");
}

/* ---------- rendering helpers ---------- */

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Torn ends that differ per strip. */
function tornClip(id: string): string {
  let h = hash(id);
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) % 1000) / 1000;
  const L: string[] = [];
  const R: string[] = [];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const y = (i / n) * 100;
    L.push(`${(rnd() * 2.6).toFixed(2)}% ${y.toFixed(1)}%`);
    R.push(`${(100 - rnd() * 2.6).toFixed(2)}% ${(100 - y).toFixed(1)}%`);
  }
  return `polygon(${[...L, ...R].join(", ")})`;
}

export function TapeStrip({ id, style, len }: { id: string; style: TapeStyle; len: number }) {
  return (
    <span className={styles.tapeWrap}>
      <span className={styles.tape} data-style={style} style={{ width: len * BASE_W, clipPath: tornClip(id) }} />
    </span>
  );
}

function pathFor(s: Stroke, W: number): string {
  const p = s.pts;
  const X = (v: number) => (v * W).toFixed(1);
  if (p.length < 2) return "";
  if (s.mode === "line" || s.mode === "arrow" || s.mode === "rect" || s.mode === "ellipse") {
    const [x0, y0, x1, y1] = [p[0] * W, p[1] * W, (p[2] ?? p[0]) * W, (p[3] ?? p[1]) * W];
    if (s.mode === "line") return `M${x0} ${y0} L${x1} ${y1}`;
    if (s.mode === "arrow") {
      const a = Math.atan2(y1 - y0, x1 - x0);
      const hl = Math.max(9, s.size * W * 4.5);
      const l1 = [x1 - hl * Math.cos(a - 0.45), y1 - hl * Math.sin(a - 0.45)];
      const l2 = [x1 - hl * Math.cos(a + 0.45), y1 - hl * Math.sin(a + 0.45)];
      return `M${x0} ${y0} L${x1} ${y1} M${l1[0]} ${l1[1]} L${x1} ${y1} L${l2[0]} ${l2[1]}`;
    }
    if (s.mode === "rect") return `M${x0} ${y0} H${x1} V${y1} H${x0} Z`;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const rx = Math.abs(x1 - x0) / 2;
    const ry = Math.abs(y1 - y0) / 2;
    return `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
  }
  if (p.length === 2) return `M${X(p[0])} ${X(p[1])} l0.1 0`;
  let d = `M${X(p[0])} ${X(p[1])}`;
  for (let i = 2; i < p.length - 2; i += 2) {
    const mx = (((p[i] + p[i + 2]) / 2) * W).toFixed(1);
    const my = (((p[i + 1] + p[i + 3]) / 2) * W).toFixed(1);
    d += ` Q${X(p[i])} ${X(p[i + 1])} ${mx} ${my}`;
  }
  d += ` L${X(p[p.length - 2])} ${X(p[p.length - 1])}`;
  return d;
}

function strokeProps(s: Stroke, W: number) {
  const w = Math.max(0.8, s.size * W);
  if (s.mode === "marker") return { strokeWidth: w, strokeOpacity: 0.38, strokeLinecap: "butt" as const, style: { mixBlendMode: "multiply" as const } };
  if (s.mode === "pencil") return { strokeWidth: w, strokeOpacity: 0.72, strokeLinecap: "round" as const };
  return { strokeWidth: w, strokeOpacity: 0.94, strokeLinecap: "round" as const };
}

/* ---------- the layer ---------- */

export function Deco({ id }: { id: string }) {
  const [doc, setDoc] = useDoc<DecoDoc>(`deco:${id}`, EMPTY);
  const [tool, setTool] = useTool();
  const [ink] = useInk();
  const [hl] = useHighlight();
  const [size] = useSize();
  const [tapeStyle] = useTapeStyle();
  const ref = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: BASE_W, h: 700 });
  const [sel, setSel] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [live, setLive] = useState<Stroke | null>(null);
  const [liveTape, setLiveTape] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [dragging, setDragging] = useState<{ id: string; patch: Partial<DecoItem> } | null>(null);

  const items = doc.items ?? [];
  const shownSel = tool !== "none" ? null : sel;
  const strokes = doc.strokes ?? [];
  const W = dim.w;
  const k = W / BASE_W;
  const active = tool !== "none";

  useLayoutEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    const ro = new ResizeObserver(() => setDim({ w: host.offsetWidth, h: host.offsetHeight }));
    ro.observe(host);
    setDim({ w: host.offsetWidth, h: host.offsetHeight });
    return () => ro.disconnect();
  }, []);


  const host = () => ref.current!.parentElement as HTMLElement;
  const patchItem = (itemId: string, p: Partial<DecoItem>) =>
    setDoc((d) => ({ ...EMPTY, ...d, items: (d.items ?? []).map((x) => (x.id === itemId ? { ...x, ...p } : x)) }));
  const remove = (itemId: string) => {
    setDoc((d) => ({ ...EMPTY, ...d, items: (d.items ?? []).filter((x) => x.id !== itemId) }));
    setSel(null);
  };

  // the move/turn/size frame only shows while you're working on that piece
  useEffect(() => {
    if (!sel) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(`[data-item-id="${sel}"]`)) setSel(null);
    };
    const t = setTimeout(() => document.addEventListener("pointerdown", onDown, true), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [sel]);

  useEffect(() => {
    if (!sel) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "Delete" || e.key === "Backspace") remove(sel);
      if (e.key === "Escape") setSel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  /* ---- drawing, shapes, tape, text and notes ---- */
  function onCaptureDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const p0 = localPoint(host(), e.clientX, e.clientY);

    if (tool === "text" || tool === "note") {
      const it: DecoItem =
        tool === "text"
          ? { id: uid(), type: "text", text: "", color: ink, x: p0.x, y: p0.y, rot: 0, scale: 1 }
          : { id: uid(), type: "note", text: "", color: "cream", x: p0.x, y: p0.y, rot: tilt(6), scale: 1 };
      setDoc((d) => ({ ...EMPTY, ...d, items: [...(d.items ?? []), it] }));
      setFocusId(it.id);
      setSel(it.id);
      setTool("none");
      play("paper-place", { volume: tool === "note" ? 1 : 0.5 });
      return;
    }

    if (tool === "eraser") {
      startLoop("eraser");
      erase(p0.x, p0.y);
      let lastE = now();
      const dog = setInterval(() => now() - lastE > 80 && setLoopLevel(0), 40);
      drag(
        e,
        (ev) => {
          lastE = now();
          setLoopLevel(0.85);
          const p = localPoint(host(), ev.clientX, ev.clientY);
          erase(p.x, p.y);
        },
        () => {
          clearInterval(dog);
          stopLoop();
        },
      );
      return;
    }

    if (tool === "tape") {
      setLiveTape({ x0: p0.x, y0: p0.y, x1: p0.x, y1: p0.y });
      drag(
        e,
        (ev) => {
          const p = localPoint(host(), ev.clientX, ev.clientY);
          setLiveTape({ x0: p0.x, y0: p0.y, x1: p.x, y1: p.y });
        },
        (ev) => {
          setLiveTape(null);
          const p = ev ? localPoint(host(), ev.clientX, ev.clientY) : p0;
          let len = Math.hypot(p.x - p0.x, p.y - p0.y);
          let rot = (Math.atan2(p.y - p0.y, p.x - p0.x) * 180) / Math.PI;
          let cx = (p0.x + p.x) / 2;
          let cy = (p0.y + p.y) / 2;
          if (len < 0.04) {
            len = 0.28;
            rot = tilt(12);
            cx = p0.x;
            cy = p0.y;
          }
          const it: DecoItem = { id: uid(), type: "tape", style: tapeStyle, len, x: cx, y: cy, rot: Math.round(rot), scale: 1 };
          setDoc((d) => ({ ...EMPTY, ...d, items: [...(d.items ?? []), it] }));
          tapeSound(tapeStyle);
        },
      );
      return;
    }

    const shape = SHAPE_TOOLS.includes(tool);
    const mode = tool as StrokeMode;
    const base = mode === "marker" ? WIDTH.marker : mode === "pencil" ? WIDTH.pencil : WIDTH.pen;
    const stroke: Stroke = {
      id: uid(),
      color: mode === "marker" ? hl : ink,
      size: base[Math.max(0, Math.min(2, size - 1))] / BASE_W,
      mode,
      pts: shape ? [p0.x, p0.y, p0.x, p0.y] : [+p0.x.toFixed(4), +p0.y.toFixed(4)],
    };
    let cur = stroke;
    setLive(cur);
    // the scratch follows the hand: silent while the pen rests, louder as it moves
    let lastT = now();
    let lastX = e.clientX;
    let lastY = e.clientY;
    let watchdog: ReturnType<typeof setInterval> | null = null;
    if (!shape) {
      startLoop(mode === "marker" ? "marker-write" : mode === "pencil" ? "pencil-write" : "pen-write");
      watchdog = setInterval(() => {
        if (now() - lastT > 70) setLoopLevel(0);
      }, 40);
    }
    drag(
      e,
      (ev) => {
        const p = localPoint(host(), ev.clientX, ev.clientY);
        if (!shape) {
          const t = now();
          const v = Math.hypot(ev.clientX - lastX, ev.clientY - lastY) / Math.max(8, t - lastT);
          setLoopLevel(Math.min(1, Math.pow(v / 0.9, 0.7)));
          lastT = t;
          lastX = ev.clientX;
          lastY = ev.clientY;
        }
        if (shape) {
          let x1 = p.x;
          let y1 = p.y;
          if (ev.shiftKey && (mode === "line" || mode === "arrow")) {
            if (Math.abs(x1 - p0.x) > Math.abs(y1 - p0.y)) y1 = p0.y;
            else x1 = p0.x;
          }
          cur = { ...cur, pts: [p0.x, p0.y, x1, y1] };
        } else {
          const lx = cur.pts[cur.pts.length - 2];
          const ly = cur.pts[cur.pts.length - 1];
          if (Math.hypot(p.x - lx, p.y - ly) < 1.5 / W) return;
          cur = { ...cur, pts: [...cur.pts, +p.x.toFixed(4), +p.y.toFixed(4)] };
        }
        setLive(cur);
      },
      () => {
        if (watchdog) clearInterval(watchdog);
        stopLoop();
        setLive(null);
        const tiny = shape && Math.hypot(cur.pts[2] - cur.pts[0], cur.pts[3] - cur.pts[1]) < 4 / W;
        if (tiny) return;
        if (shape) play("pen-write", { duration: 0.25, volume: 0.8 });
        const s = cur;
        setDoc((d) => ({ ...EMPTY, ...d, strokes: [...(d.strokes ?? []), s] }));
      },
    );
  }

  function erase(x: number, y: number) {
    const r = 12 / W;
    const near = (s: Stroke) => {
      const p = s.pts;
      if (s.mode === "line" || s.mode === "arrow" || s.mode === "rect" || s.mode === "ellipse") {
        // sample the shape outline
        const [x0, y0, x1, y1] = p;
        const pts: number[] = [];
        for (let i = 0; i <= 24; i++) {
          const t = i / 24;
          if (s.mode === "ellipse") {
            const a = t * Math.PI * 2;
            pts.push((x0 + x1) / 2 + (Math.abs(x1 - x0) / 2) * Math.cos(a), (y0 + y1) / 2 + (Math.abs(y1 - y0) / 2) * Math.sin(a));
          } else if (s.mode === "rect") {
            const per = t * 4;
            const side = Math.floor(per) % 4;
            const f = per - Math.floor(per);
            const c = [
              [x0 + (x1 - x0) * f, y0],
              [x1, y0 + (y1 - y0) * f],
              [x1 - (x1 - x0) * f, y1],
              [x0, y1 - (y1 - y0) * f],
            ][side];
            pts.push(c[0], c[1]);
          } else pts.push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
        }
        for (let i = 0; i < pts.length; i += 2) if (Math.hypot(pts[i] - x, pts[i + 1] - y) < r) return true;
        return false;
      }
      for (let i = 0; i < p.length; i += 2) if (Math.hypot(p[i] - x, p[i + 1] - y) < r + s.size / 2) return true;
      return false;
    };
    const ids = new Set(strokes.filter(near).map((s) => s.id));
    if (ids.size) setDoc((d) => ({ ...EMPTY, ...d, strokes: (d.strokes ?? []).filter((s) => !ids.has(s.id)) }));
  }

  /* ---- moving, turning and resizing placed things ---- */
  function onItemDown(e: React.PointerEvent, it: DecoItem, mode: "move" | "rotate" | "scale") {
    if (active || e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (mode === "move" && t.closest("textarea")) return; // typing, not dragging
    e.preventDefault();
    e.stopPropagation();
    setSel(it.id);
    const h = host();
    const r = h.getBoundingClientRect();
    const cx = r.left + it.x * r.width;
    const cy = r.top + ((it.y * W) / h.offsetHeight) * r.height;
    const a0 = Math.atan2(e.clientY - cy, e.clientX - cx);
    const d0 = Math.max(1, Math.hypot(e.clientX - cx, e.clientY - cy));
    let patch: Partial<DecoItem> = {};
    drag(
      e,
      (ev, dx, dy) => {
        if (mode === "move") {
          patch = { x: Math.min(1.02, Math.max(-0.02, it.x + dx / r.width)), y: Math.max(0, it.y + (dy * (h.offsetHeight / r.height)) / W) };
        } else if (mode === "rotate") {
          const a = Math.atan2(ev.clientY - cy, ev.clientX - cx);
          patch = { rot: Math.round(it.rot + ((a - a0) * 180) / Math.PI) };
        } else {
          const d = Math.hypot(ev.clientX - cx, ev.clientY - cy);
          patch = { scale: Math.min(4, Math.max(0.3, +(it.scale * (d / d0)).toFixed(3))) };
        }
        setDragging({ id: it.id, patch });
      },
      (_ev, moved) => {
        setDragging(null);
        if (moved) patchItem(it.id, patch);
      },
      3,
    );
  }

  function render(it: DecoItem): ReactNode {
    if (it.type === "sticker") return STICKER_NODES[it.kind ?? ""] ?? null;
    if (it.type === "tape") return <TapeStrip id={it.id} style={it.style ?? "kraft"} len={(it.len ?? 0.3) / it.scale} />;
    if (it.type === "photo" && it.src)
      return (
        <span className={styles.photo} style={{ width: (it.w ?? 0.45) * BASE_W }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.src} alt="Foto pegada" draggable={false} />
          <i className={styles.photoTape} aria-hidden />
        </span>
      );
    if (it.type === "text")
      return (
        <span className={styles.text} style={{ color: it.color }}>
          <AutoText
            value={it.text ?? ""}
            autoFocus={focusId === it.id}
            placeholder="Escribe…"
            onChange={(v) => patchItem(it.id, { text: v })}
            onBlur={() => {
              setFocusId(null);
              if (!(it.text ?? "").trim()) remove(it.id);
            }}
          />
        </span>
      );
    if (it.type === "note")
      return (
        <span className={styles.note} data-color={it.color ?? "cream"}>
          <AutoText value={it.text ?? ""} autoFocus={focusId === it.id} placeholder="Nota…" onChange={(v) => patchItem(it.id, { text: v })} onBlur={() => setFocusId(null)} minRows={4} />
        </span>
      );
    return null;
  }

  const tapePreview = liveTape && (
    <div
      className={styles.item}
      style={{
        left: ((liveTape.x0 + liveTape.x1) / 2) * W,
        top: ((liveTape.y0 + liveTape.y1) / 2) * W,
        transform: `translate(-50%, -50%) rotate(${(Math.atan2(liveTape.y1 - liveTape.y0, liveTape.x1 - liveTape.x0) * 180) / Math.PI}deg) scale(${k})`,
        pointerEvents: "none",
      }}
    >
      <TapeStrip id="preview" style={tapeStyle} len={Math.max(0.02, Math.hypot(liveTape.x1 - liveTape.x0, liveTape.y1 - liveTape.y0))} />
    </div>
  );

  return (
    <div ref={ref} className={styles.layer} onPointerDown={() => setSel(null)} data-drawing={active || undefined}>
      <svg className={styles.ink} width={W} height={dim.h} aria-hidden>
        {[...strokes, ...(live ? [live] : [])].map((s) => (
          <path key={s.id} d={pathFor(s, W)} stroke={s.color} strokeLinejoin="round" fill="none" {...strokeProps(s, W)} />
        ))}
      </svg>

      {items.map((it0) => {
        const it = dragging?.id === it0.id ? { ...it0, ...dragging.patch } : it0;
        const node = render(it);
        if (!node) return null;
        const label = { sticker: "Pegatina", tape: "Cinta", photo: "Foto", text: "Texto", note: "Nota" }[it.type];
        return (
          <div
            key={it.id}
            className={styles.item}
            data-type={it.type}
            data-item-id={it.id}
            data-sel={shownSel === it.id || undefined}
            data-drag={dragging?.id === it.id || undefined}
            style={{ left: it.x * W, top: it.y * W, transform: `translate(-50%, -50%) rotate(${it.rot}deg) scale(${it.scale * k})` }}
            onPointerDown={(e) => onItemDown(e, it0, "move")}
            tabIndex={active ? -1 : 0}
            aria-label={label}
          >
            {node}
            {(it.type === "text" || it.type === "note") && !active && (
              <span className={styles.grip} aria-hidden>
                <GripVertical />
              </span>
            )}
            {shownSel === it.id && !active && (
              <>
                <button className={`${styles.handle} ${styles.del}`} onPointerDown={(e) => e.stopPropagation()} onClick={() => remove(it.id)} aria-label={`Quitar ${label}`}>
                  <X />
                </button>
                <button className={`${styles.handle} ${styles.rot}`} onPointerDown={(e) => onItemDown(e, it0, "rotate")} aria-label="Girar">
                  <RotateCw />
                </button>
                <button className={`${styles.handle} ${styles.size}`} onPointerDown={(e) => onItemDown(e, it0, "scale")} aria-label="Tamaño">
                  <Maximize2 />
                </button>
              </>
            )}
          </div>
        );
      })}
      {tapePreview}

      {active && <div className={styles.capture} data-tool={tool} onPointerDown={onCaptureDown} />}
    </div>
  );
}

function AutoText({
  value,
  onChange,
  onBlur,
  autoFocus,
  placeholder,
  minRows = 1,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  autoFocus?: boolean;
  placeholder: string;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true });
  }, [autoFocus]);
  return (
    <textarea
      ref={ref}
      className={styles.autoText}
      value={value}
      rows={minRows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={placeholder}
    />
  );
}

