"use client";

import { useMemo, useState } from "react";
import { Delaunay } from "d3-delaunay";

/**
 * A brain seen from the side — frontal, parietal, occipital and temporal
 * lobes, cerebellum and brain stem — made of hand-drawn cells. Each clean
 * day earns one cell; you choose which one and its colour.
 */

const W = 440;
const H = 350;

const CEREBRUM =
  "M72 196 C40 160 46 84 112 54 C166 26 252 16 316 40 C378 62 414 114 408 170 C404 208 382 228 350 234 C322 240 304 236 288 242 C262 250 244 266 212 272 C176 278 140 272 120 254 C102 238 96 222 106 210 C90 210 78 206 72 196 Z";
const CEREBELLUM = "M292 246 C304 232 362 230 388 246 C408 260 402 292 372 300 C340 308 302 298 292 282 C284 270 284 256 292 246 Z";
const STEM = "M248 262 C258 286 260 312 254 340 L280 340 C282 314 288 290 296 270 Z";
const SULCI = [
  "M118 206 C160 192 222 196 292 172", // lateral (Sylvian) fissure
  "M232 24 C226 70 246 112 236 168", // central sulcus
  "M330 52 C318 92 338 130 360 148", // parieto-occipital
];

export const BRAIN_PALETTE = [
  "#8e2a24", "#b5432c", "#c76b3a", "#c58b2b", "#d8b25a", "#7d8c5a",
  "#6f7a3a", "#2f5d46", "#2c6e72", "#4f7a8a", "#3b5a85", "#283a66",
  "#5d3a5e", "#9b3d4a", "#a0522d", "#1c2333",
];

type Pt = [number, number];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sample(d: string, n = 220): Pt[] {
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", d);
  const len = p.getTotalLength();
  return Array.from({ length: n }, (_, i) => {
    const q = p.getPointAtLength((i / n) * len);
    return [q.x, q.y] as Pt;
  });
}

function inside(p: Pt, poly: Pt[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function centroid(poly: Pt[]): Pt {
  let a = 0;
  let x = 0;
  let y = 0;
  for (let i = 0; i < poly.length - 1; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[i + 1];
    const f = x0 * y1 - x1 * y0;
    a += f;
    x += (x0 + x1) * f;
    y += (y0 + y1) * f;
  }
  a *= 0.5;
  return a ? [x / (6 * a), y / (6 * a)] : poly[0];
}

function cells(outline: Pt[], n: number, seed: number) {
  const r = rng(seed);
  const xs = outline.map((p) => p[0]);
  const ys = outline.map((p) => p[1]);
  const box: [number, number, number, number] = [Math.min(...xs) - 2, Math.min(...ys) - 2, Math.max(...xs) + 2, Math.max(...ys) + 2];
  let pts: Pt[] = [];
  let guard = 0;
  while (pts.length < n && guard++ < 20000) {
    const p: Pt = [box[0] + r() * (box[2] - box[0]), box[1] + r() * (box[3] - box[1])];
    if (inside(p, outline)) pts.push(p);
  }
  for (let it = 0; it < 3; it++) {
    const v = Delaunay.from(pts).voronoi(box);
    pts = pts.map((p, i) => {
      const poly = v.cellPolygon(i) as Pt[] | null;
      if (!poly) return p;
      const c = centroid(poly);
      return inside(c, outline) ? c : p;
    });
  }
  const v = Delaunay.from(pts).voronoi(box);
  return pts.map((_, i) => {
    const poly = (v.cellPolygon(i) as Pt[] | null) ?? [];
    return "M" + poly.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L") + "Z";
  });
}

export function Brain({
  total,
  painted,
  available,
  color,
  onPaint,
  label,
}: {
  total: number;
  painted: Record<string, string>;
  available: number;
  color: string | null; // null = eraser
  onPaint: (cell: number, color: string | null) => void;
  label: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const geo = useMemo(() => {
    const small = Math.max(6, Math.round(total * 0.2));
    const big = total - small;
    return {
      cerebrum: cells(sample(CEREBRUM), big, 13).map((d) => ({ d, clip: "brain-cer" })),
      cerebellum: cells(sample(CEREBELLUM, 120), small, 41).map((d) => ({ d, clip: "brain-cbl" })),
    };
  }, [total]);
  const count = Object.keys(painted).length;

  const cell = (c: { d: string; clip: string }, i: number) => {
    const fill = painted[i];
    const canPaint = color === null ? !!fill : !!fill || available > 0;
    return (
      <path
        key={i}
        d={c.d}
        clipPath={`url(#${c.clip})`}
        fill={fill ?? (hover === i && canPaint && color ? color : "transparent")}
        fillOpacity={!fill && hover === i ? 0.45 : 1}
        stroke="#16130f"
        strokeWidth={2.1}
        strokeLinejoin="round"
        data-cell={i}
        style={{ cursor: canPaint ? "pointer" : "default", transition: "fill 300ms" }}
        onPointerEnter={() => setHover(i)}
        onPointerLeave={() => setHover((h) => (h === i ? null : h))}
        onClick={() => canPaint && onPaint(i, color)}
      />
    );
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${count} de ${total} celdas pintadas`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <clipPath id="brain-cer">
          <path d={CEREBRUM} />
        </clipPath>
        <clipPath id="brain-cbl">
          <path d={CEREBELLUM} />
        </clipPath>
      </defs>
      <path d={STEM} fill="#efe6cf" stroke="#16130f" strokeWidth={3} strokeLinejoin="round" />
      <path d={CEREBELLUM} fill="#fbf7ec" />
      {geo.cerebellum.map((c, k) => cell(c, geo.cerebrum.length + k))}
      <path d={CEREBELLUM} fill="none" stroke="#16130f" strokeWidth={3.4} strokeLinejoin="round" pointerEvents="none" />
      <path d={CEREBRUM} fill="#fbf7ec" />
      {geo.cerebrum.map((c, k) => cell(c, k))}
      {SULCI.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#16130f" strokeWidth={3.6} strokeLinecap="round" clipPath="url(#brain-cer)" pointerEvents="none" />
      ))}
      <path d={CEREBRUM} fill="none" stroke="#16130f" strokeWidth={3.6} strokeLinejoin="round" pointerEvents="none" />
    </svg>
  );
}
