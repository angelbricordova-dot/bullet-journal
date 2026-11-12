"use client";

import { useMemo } from "react";
import { Delaunay } from "d3-delaunay";

/**
 * A brain seen from above, two hemispheres of irregular cells (like a
 * hand-drawn mosaic). Each clean day colours one cell.
 */

const W = 400;
const H = 440;

// rich, grounded tones; the brain fills like stained glass
const PALETTE = [
  "#8e2a24", "#b5432c", "#c58b2b", "#d2a24c", "#6f7a3a", "#2f5d46",
  "#2c6e72", "#3b5a85", "#283a66", "#5d3a5e", "#a0522d", "#7d8c5a",
  "#b8955c", "#4f7a8a", "#9b3d4a", "#c76b3a",
];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = [number, number];

function hemisphere(left: boolean): Pt[] {
  const pts: Pt[] = [];
  const cx = 103;
  const cy = 222;
  const rx = 94;
  const ry = 206;
  const e = 2.35;
  for (let i = 0; i < 160; i++) {
    const t = (i / 160) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const bump = 1 + 0.022 * Math.sin(7 * t + 0.6) + 0.016 * Math.sin(13 * t + 1.3);
    let x = cx + rx * bump * Math.sign(c) * Math.pow(Math.abs(c), 2 / e);
    const y = cy + ry * bump * Math.sign(s) * Math.pow(Math.abs(s), 2 / e) * (y0(t));
    x = Math.min(x, 194);
    pts.push(left ? [x, y] : [W - x, y]);
  }
  return pts;
}
// the back of the brain is a touch narrower than the front
function y0(t: number) {
  return 1 - 0.03 * Math.cos(t);
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

function cellsFor(outline: Pt[], n: number, seed: number) {
  const r = rng(seed);
  const xs = outline.map((p) => p[0]);
  const ys = outline.map((p) => p[1]);
  const box: [number, number, number, number] = [Math.min(...xs) - 4, Math.min(...ys) - 4, Math.max(...xs) + 4, Math.max(...ys) + 4];
  let pts: Pt[] = [];
  while (pts.length < n) {
    const p: Pt = [box[0] + r() * (box[2] - box[0]), box[1] + r() * (box[3] - box[1])];
    if (inside(p, outline)) pts.push(p);
  }
  for (let it = 0; it < 5; it++) {
    const v = Delaunay.from(pts).voronoi(box);
    pts = pts.map((p, i) => {
      const poly = v.cellPolygon(i) as Pt[] | null;
      if (!poly) return p;
      const c = centroid(poly);
      return inside(c, outline) ? c : p;
    });
  }
  const v = Delaunay.from(pts).voronoi(box);
  return pts.map((p, i) => {
    const poly = (v.cellPolygon(i) as Pt[] | null) ?? [];
    return { d: "M" + poly.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L") + "Z", y: p[1], x: p[0] };
  });
}

const pathOf = (pts: Pt[]) => "M" + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L") + "Z";

export function Brain({ filled, total, label }: { filled: number; total: number; label: string }) {
  const geo = useMemo(() => {
    const L = hemisphere(true);
    const R = hemisphere(false);
    const half = Math.ceil(total / 2);
    const lc = cellsFor(L, half, 11);
    const rc = cellsFor(R, total - half, 29);
    const r = rng(7);
    // fill order: alternate hemispheres, back of the brain to the front, with a little wander
    const sortWander = <T extends { y: number }>(a: T[]) => a.map((c) => ({ c, k: c.y + r() * 90 })).sort((p, q) => q.k - p.k).map((p) => p.c);
    const ls = sortWander(lc);
    const rs = sortWander(rc);
    const order: { d: string; side: "L" | "R"; color: string }[] = [];
    for (let i = 0; i < Math.max(ls.length, rs.length); i++) {
      if (ls[i]) order.push({ d: ls[i].d, side: "L", color: PALETTE[Math.floor(r() * PALETTE.length)] });
      if (rs[i]) order.push({ d: rs[i].d, side: "R", color: PALETTE[Math.floor(r() * PALETTE.length)] });
    }
    return { L: pathOf(L), R: pathOf(R), order };
  }, [total]);

  const n = Math.max(0, Math.min(total, filled));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${n} de ${total} celdas llenas`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <clipPath id="brain-l">
          <path d={geo.L} />
        </clipPath>
        <clipPath id="brain-r">
          <path d={geo.R} />
        </clipPath>
      </defs>
      <path d={geo.L} fill="#fbf7ec" />
      <path d={geo.R} fill="#fbf7ec" />
      {geo.order.map((c, i) => (
        <path
          key={i}
          d={c.d}
          clipPath={`url(#brain-${c.side === "L" ? "l" : "r"})`}
          fill={i < n ? c.color : "transparent"}
          stroke="#16130f"
          strokeWidth={2.4}
          strokeLinejoin="round"
          style={i === n - 1 ? { animation: "cell-in 900ms cubic-bezier(.16,1,.3,1) both" } : undefined}
        />
      ))}
      <path d={geo.L} fill="none" stroke="#16130f" strokeWidth={3.4} strokeLinejoin="round" />
      <path d={geo.R} fill="none" stroke="#16130f" strokeWidth={3.4} strokeLinejoin="round" />
    </svg>
  );
}
