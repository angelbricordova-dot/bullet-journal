"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { RotateCw, X, Maximize2 } from "lucide-react";
import { ensureLoaded, useDoc, writeDoc } from "@/lib/client-store";
import { useInk, useTool } from "@/lib/book";
import { uid } from "@/lib/date";
import { STICKER_NODES } from "../Stickers";
import styles from "./deco.module.css";

/* ------------------------------------------------------------------
 * Everything placed on a page: stickers, washi tape, taped photos and
 * free ink. Coordinates are normalised by the page width so the same
 * page looks the same on the 3D book and on a phone.
 * ---------------------------------------------------------------- */

export type TapeStyle = "kraft" | "black" | "red" | "linen";

export interface DecoItem {
  id: string;
  type: "sticker" | "tape" | "photo";
  kind?: string; // sticker kind
  style?: TapeStyle;
  src?: string; // photo data URL
  x: number; // 0..1 of width
  y: number; // px / width
  rot: number;
  scale: number;
  len?: number; // tape length (fraction of width)
  w?: number; // photo width (fraction of width)
}

export interface Stroke {
  id: string;
  color: string;
  size: number; // fraction of width
  mode: "pen" | "marker";
  pts: number[]; // x0,y0,x1,y1… normalised
}

export interface DecoDoc {
  items: DecoItem[];
  strokes: Stroke[];
}

const EMPTY: DecoDoc = { items: [], strokes: [] };
const BASE_W = 500; // design width at which scale = 1

/* ---------- placing from the desk / tool sheet ---------- */

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
  writeDoc<DecoDoc>(key, { ...cur, items: [...cur.items, item] });
}

/** Place at the centre of whatever page is in view. */
export function placeOnActivePage(item: NewItem) {
  const host = activeHost();
  if (!host) return;
  const r = host.getBoundingClientRect();
  const cx = (Math.max(r.left, 0) + Math.min(r.right, innerWidth)) / 2;
  const cy = (Math.max(r.top, 0) + Math.min(r.bottom, innerHeight)) / 2;
  const p = localPoint(host, cx + (Math.random() - 0.5) * 60, cy + (Math.random() - 0.5) * 60);
  void addTo(host.dataset.decoHost!, { ...item, id: uid(), ...p });
}

/** Drag something from the desk onto a page. A tap places it on the page in view. */
export function beginPlace(e: React.PointerEvent, item: NewItem) {
  e.preventDefault();
  const src = e.currentTarget as HTMLElement;
  const startX = e.clientX;
  const startY = e.clientY;
  let ghost: HTMLElement | null = null;

  const move = (ev: PointerEvent) => {
    if (!ghost && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 6) {
      ghost = src.cloneNode(true) as HTMLElement;
      const r = src.getBoundingClientRect();
      Object.assign(ghost.style, {
        position: "fixed",
        left: "0",
        top: "0",
        width: `${r.width}px`,
        height: `${r.height}px`,
        pointerEvents: "none",
        zIndex: "1000",
        filter: "drop-shadow(0 12px 14px rgba(0,0,0,.35))",
        transition: "none",
      });
      document.body.appendChild(ghost);
    }
    if (ghost) {
      const r = ghost.getBoundingClientRect();
      ghost.style.transform = `translate(${ev.clientX - r.width / 2}px, ${ev.clientY - r.height / 2}px) rotate(${item.rot}deg) scale(1.08)`;
    }
  };
  const up = (ev: PointerEvent) => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    if (!ghost) {
      placeOnActivePage(item);
      return;
    }
    ghost.remove();
    const el = document
      .elementsFromPoint(ev.clientX, ev.clientY)
      .map((n) => (n as HTMLElement).closest?.("[data-deco-host]") as HTMLElement | null)
      .find((h) => h && h.dataset.active !== undefined);
    if (!el) return;
    const p = localPoint(el, ev.clientX, ev.clientY);
    void addTo(el.dataset.decoHost!, { ...item, id: uid(), ...p });
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

/* ---------- rendering ---------- */

export function TapeStrip({ style, len, width }: { style: TapeStyle; len: number; width: number }) {
  return <span className={styles.tape} data-style={style} style={{ width: len * width, height: Math.max(16, 0.05 * width) }} />;
}

function pathFor(s: Stroke, W: number): string {
  const p = s.pts;
  if (p.length < 2) return "";
  const X = (i: number) => (p[i] * W).toFixed(1);
  if (p.length === 2) return `M${X(0)} ${X(1)} l0.1 0`;
  let d = `M${X(0)} ${X(1)}`;
  for (let i = 2; i < p.length - 2; i += 2) {
    const mx = (((p[i] + p[i + 2]) / 2) * W).toFixed(1);
    const my = (((p[i + 1] + p[i + 3]) / 2) * W).toFixed(1);
    d += ` Q${X(i)} ${X(i + 1)} ${mx} ${my}`;
  }
  d += ` L${X(p.length - 2)} ${X(p.length - 1)}`;
  return d;
}

export function Deco({ id }: { id: string }) {
  const [doc, setDoc] = useDoc<DecoDoc>(`deco:${id}`, EMPTY);
  const [tool] = useTool();
  const [ink] = useInk();
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: BASE_W, h: 700 });
  const [sel, setSel] = useState<string | null>(null);
  const [live, setLive] = useState<Stroke | null>(null);
  const [drag, setDrag] = useState<{ id: string; patch: Partial<DecoItem> } | null>(null);

  const items = doc.items ?? [];
  const strokes = doc.strokes ?? [];

  useLayoutEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    const ro = new ResizeObserver(() => setSize({ w: host.offsetWidth, h: host.offsetHeight }));
    ro.observe(host);
    setSize({ w: host.offsetWidth, h: host.offsetHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!sel) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        setDoc((d) => ({ ...EMPTY, ...d, items: (d.items ?? []).filter((x) => x.id !== sel) }));
        setSel(null);
      }
      if (e.key === "Escape") setSel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, setDoc]);

  const W = size.w;
  const k = W / BASE_W;
  const drawing = tool !== "none";

  /* ---- ink ---- */
  function host() {
    return ref.current!.parentElement as HTMLElement;
  }
  function onInkDown(e: React.PointerEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = localPoint(host(), e.clientX, e.clientY);
    if (tool === "eraser") {
      erase(p.x, p.y);
      return;
    }
    setLive({
      id: uid(),
      color: ink,
      size: (tool === "marker" ? 14 : 2.4) / BASE_W,
      mode: tool === "marker" ? "marker" : "pen",
      pts: [p.x, p.y],
    });
  }
  function onInkMove(e: React.PointerEvent) {
    if (e.buttons !== 1) return;
    const p = localPoint(host(), e.clientX, e.clientY);
    if (tool === "eraser") return erase(p.x, p.y);
    setLive((s) => {
      if (!s) return s;
      const lx = s.pts[s.pts.length - 2];
      const ly = s.pts[s.pts.length - 1];
      if (Math.hypot(p.x - lx, p.y - ly) < 1.5 / W) return s;
      return { ...s, pts: [...s.pts, +p.x.toFixed(4), +p.y.toFixed(4)] };
    });
  }
  function onInkUp() {
    if (live && live.pts.length >= 2) {
      const s = live;
      setDoc((d) => ({ ...EMPTY, ...d, strokes: [...(d.strokes ?? []), s] }));
    }
    setLive(null);
  }
  function erase(x: number, y: number) {
    const r = 10 / W;
    const hit = strokes.filter((s) => {
      for (let i = 0; i < s.pts.length; i += 2) if (Math.hypot(s.pts[i] - x, s.pts[i + 1] - y) < r + s.size / 2) return true;
      return false;
    });
    if (hit.length) {
      const ids = new Set(hit.map((h) => h.id));
      setDoc((d) => ({ ...EMPTY, ...d, strokes: (d.strokes ?? []).filter((s) => !ids.has(s.id)) }));
    }
  }

  /* ---- items ---- */
  function onItemDown(e: React.PointerEvent, it: DecoItem, mode: "move" | "rotate" | "scale") {
    if (drawing) return;
    e.preventDefault();
    e.stopPropagation();
    setSel(it.id);
    const h = host();
    const r = h.getBoundingClientRect();
    const sx = e.clientX;
    const sy = e.clientY;
    const cx = r.left + it.x * r.width;
    const cy = r.top + ((it.y * W) / h.offsetHeight) * r.height;
    const a0 = Math.atan2(sy - cy, sx - cx);
    const d0 = Math.hypot(sx - cx, sy - cy);
    let patch: Partial<DecoItem> = {};
    let moved = false;
    const move = (ev: PointerEvent) => {
      moved = true;
      if (mode === "move") {
        const dx = (ev.clientX - sx) / r.width;
        const dy = ((ev.clientY - sy) * (h.offsetHeight / r.height)) / W;
        patch = { x: Math.min(1.02, Math.max(-0.02, it.x + dx)), y: Math.max(0, it.y + dy) };
      } else if (mode === "rotate") {
        const a = Math.atan2(ev.clientY - cy, ev.clientX - cx);
        patch = { rot: Math.round(it.rot + ((a - a0) * 180) / Math.PI) };
      } else {
        const d = Math.hypot(ev.clientX - cx, ev.clientY - cy);
        patch = { scale: Math.min(4, Math.max(0.3, +(it.scale * (d / d0)).toFixed(3))) };
      }
      setDrag({ id: it.id, patch });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setDrag(null);
      if (moved) setDoc((d) => ({ ...EMPTY, ...d, items: (d.items ?? []).map((x) => (x.id === it.id ? { ...x, ...patch } : x)) }));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function remove(idToRemove: string) {
    setDoc((d) => ({ ...EMPTY, ...d, items: (d.items ?? []).filter((x) => x.id !== idToRemove) }));
    setSel(null);
  }

  function render(it: DecoItem): ReactNode {
    if (it.type === "sticker") return STICKER_NODES[it.kind ?? ""] ?? null;
    if (it.type === "tape") return <TapeStrip style={it.style ?? "kraft"} len={it.len ?? 0.3} width={BASE_W} />;
    if (it.type === "photo" && it.src)
      return (
        <span className={styles.photo} style={{ width: (it.w ?? 0.45) * BASE_W }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.src} alt="Foto pegada" draggable={false} />
          <i className={styles.photoTape} aria-hidden />
        </span>
      );
    return null;
  }

  return (
    <div ref={ref} className={styles.layer} onPointerDown={() => setSel(null)} data-drawing={drawing || undefined}>
      <svg className={styles.ink} width={W} height={size.h} aria-hidden>
        {[...strokes, ...(live ? [live] : [])].map((s) => (
          <path
            key={s.id}
            d={pathFor(s, W)}
            stroke={s.color}
            strokeWidth={Math.max(1, s.size * W)}
            strokeOpacity={s.mode === "marker" ? 0.32 : 0.92}
            strokeLinecap={s.mode === "marker" ? "square" : "round"}
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </svg>

      {items.map((it0) => {
        const it = drag?.id === it0.id ? { ...it0, ...drag.patch } : it0;
        const node = render(it);
        if (!node) return null;
        return (
          <div
            key={it.id}
            className={styles.item}
            data-type={it.type}
            data-sel={sel === it.id || undefined}
            data-drag={drag?.id === it.id || undefined}
            style={{ left: it.x * W, top: it.y * W, transform: `translate(-50%, -50%) rotate(${it.rot}deg) scale(${it.scale * k})` }}
            onPointerDown={(e) => onItemDown(e, it0, "move")}
            tabIndex={drawing ? -1 : 0}
            aria-label={it.type === "sticker" ? "Pegatina" : it.type === "tape" ? "Cinta" : "Foto"}
          >
            {node}
            {sel === it.id && !drawing && (
              <>
                <button className={`${styles.handle} ${styles.del}`} onPointerDown={(e) => e.stopPropagation()} onClick={() => remove(it.id)} aria-label="Despegar">
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

      {drawing && (
        <div
          className={styles.capture}
          data-tool={tool}
          onPointerDown={onInkDown}
          onPointerMove={onInkMove}
          onPointerUp={onInkUp}
          onPointerCancel={onInkUp}
        />
      )}
    </div>
  );
}
