"use client";

import { Pages } from "@/components/Pages";
import { Figs } from "@/components/Figs";
import { MonthNav } from "./Mes";
import { useSettings } from "@/lib/hooks";
import { ensureLoaded, useDocList, writeDoc } from "@/lib/client-store";
import { emptyDay } from "@/lib/defaults";
import { useBookMonth } from "@/lib/book";
import { monthInfo } from "@/lib/month";
import { todayYmd } from "@/lib/date";
import type { DayDoc } from "@/lib/types";
import styles from "./trackers.module.css";

const pad = (n: number) => String(n).padStart(2, "0");

function toMin(t?: string): number | null {
  if (!t || !/^\d{2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Hours slept: from "me dormí" (previous night) to "me levanté". */
function sleptHours(d?: DayDoc): number | null {
  const s = toMin(d?.sleep);
  const w = toMin(d?.wake);
  if (s === null || w === null) return null;
  let diff = w - s;
  if (diff <= 0) diff += 24 * 60;
  return diff / 60;
}

async function toggleHabit(date: string, id: string) {
  const key = `day:${date}`;
  const cur = { ...emptyDay(), ...((await ensureLoaded<DayDoc>(key)) ?? {}) };
  writeDoc<DayDoc>(key, { ...cur, habits: { ...cur.habits, [id]: !cur.habits[id] } });
}

export function TrackersSpread() {
  const [ym] = useBookMonth();
  const mi = monthInfo(ym);
  const [settings] = useSettings();
  const { items: days } = useDocList<DayDoc>(`day:${ym}`);
  const habits = settings.habits.filter((h) => h.active);
  const today = todayYmd();
  const dates = Array.from({ length: mi.days }, (_, i) => `${ym}-${pad(i + 1)}`);

  const left = (
    <div>
      <MonthNav />
      <h1 className="h-page">
        Hábitos <span className={styles.sub}>{mi.name}</span>
      </h1>
      <p className="caption" style={{ margin: "6px 0 14px" }}>
        Un punto por cada día cumplido. Puedes marcar días pasados aquí mismo.
      </p>
      <div className={styles.dotGridWrap}>
        <div className={styles.dotGrid} style={{ gridTemplateColumns: `minmax(92px, 1.4fr) repeat(${mi.days}, minmax(9px, 1fr))` }}>
          <span />
          {dates.map((d, i) => (
            <span key={d} className={`num ${styles.colHead}`} data-today={d === today || undefined}>
              {(i + 1) % 5 === 0 || i === 0 ? i + 1 : ""}
            </span>
          ))}
          {habits.map((h) => (
            <Row key={h.id} name={h.name} id={h.id} dates={dates} days={days} today={today} />
          ))}
        </div>
      </div>
      <ul className={styles.totals}>
        {habits.map((h) => {
          const n = dates.filter((d) => days[`day:${d}`]?.habits?.[h.id]).length;
          return (
            <li key={h.id}>
              <span>{h.name}</span>
              <span className="num">
                <b>{n}</b>/{mi.days}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );

  // sleep chart
  const W = 440;
  const H = 220;
  const minH = 3;
  const maxH = 11;
  const pts = dates.map((d, i) => ({ i, h: sleptHours(days[`day:${d}`]) }));
  const x = (i: number) => 24 + (i / Math.max(1, mi.days - 1)) * (W - 32);
  const y = (h: number) => 8 + (1 - (Math.min(maxH, Math.max(minH, h)) - minH) / (maxH - minH)) * (H - 28);
  const segs: string[] = [];
  let cur = "";
  for (const p of pts) {
    if (p.h === null) {
      if (cur) segs.push(cur);
      cur = "";
      continue;
    }
    cur += `${cur ? " L" : "M"}${x(p.i).toFixed(1)} ${y(p.h).toFixed(1)}`;
  }
  if (cur) segs.push(cur);
  const valid = pts.filter((p) => p.h !== null) as { i: number; h: number }[];
  const avg = valid.length ? valid.reduce((s, p) => s + p.h, 0) / valid.length : null;
  const moods = dates.map((d) => days[`day:${d}`]?.mood);

  const right = (
    <div>
      <h2 className="h-page">Sueño</h2>
      <p className={styles.avg}>
        Promedio del mes: <b className="num">{avg ? `${avg.toFixed(1)} h` : "—"}</b>
        <span className="caption"> · se calcula con “me dormí” y “me levanté” de cada día</span>
      </p>
      <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Horas de sueño en ${mi.name}`}>
        {Array.from({ length: maxH - minH + 1 }, (_, k) => {
          const h = minH + k;
          return (
            <g key={h}>
              <line x1={24} x2={W - 8} y1={y(h)} y2={y(h)} stroke={h === 8 ? "var(--vermilion)" : "#d7d3c6"} strokeWidth={h === 8 ? 1 : 0.8} strokeDasharray={h === 8 ? "4 3" : undefined} />
              {h % 2 === 1 && (
                <text x={0} y={y(h) + 4} fontSize="10" fill="var(--ink-3)" className="num">
                  {h}h
                </text>
              )}
            </g>
          );
        })}
        {dates.map((_, i) => (
          <line key={i} x1={x(i)} x2={x(i)} y1={8} y2={H - 20} stroke="#e4dfd2" strokeWidth={0.6} />
        ))}
        {segs.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {valid.map((p) => (
          <circle key={p.i} cx={x(p.i)} cy={y(p.h)} r={3} fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.6} />
        ))}
        {dates.map((d, i) =>
          (i + 1) % 5 === 0 || i === 0 ? (
            <text key={d} x={x(i)} y={H - 6} fontSize="10" textAnchor="middle" fill="var(--ink-3)" className="num">
              {i + 1}
            </text>
          ) : null,
        )}
      </svg>
      <p className="caption">La línea roja marca 8 horas.</p>

      <h2 className="h-sec">Ánimo</h2>
      <div className={styles.moods} style={{ gridTemplateColumns: `repeat(${mi.days}, 1fr)` }} role="img" aria-label="Ánimo de cada día">
        {moods.map((m, i) => (
          <i key={i} data-m={m ?? undefined} title={`${i + 1}: ${m ?? "—"}`} />
        ))}
      </div>
      <div className={styles.moodKey} aria-hidden>
        <span>Muy mal</span>
        {[1, 2, 3, 4, 5].map((m) => (
          <i key={m} data-m={m} />
        ))}
        <span>Muy bien</span>
      </div>

      <h2 className="h-sec">
        Despertar <Figs>{`— meta antes de las 7`}</Figs>
      </h2>
      <div className={styles.wake} style={{ gridTemplateColumns: `repeat(${mi.days}, 1fr)` }}>
        {dates.map((d, i) => {
          const w = toMin(days[`day:${d}`]?.wake);
          return <i key={d} data-ok={w !== null && w <= 7 * 60 ? "" : undefined} data-late={w !== null && w > 7 * 60 ? "" : undefined} title={`${i + 1}: ${days[`day:${d}`]?.wake ?? "—"}`} />;
        })}
      </div>
    </div>
  );

  return <Pages id={`trackers-${ym}`} left={left} right={right} />;
}

function Row({ name, id, dates, days, today }: { name: string; id: string; dates: string[]; days: Record<string, DayDoc>; today: string }) {
  return (
    <>
      <span className={styles.rowName} title={name}>
        {name}
      </span>
      {dates.map((d) => {
        const on = !!days[`day:${d}`]?.habits?.[id];
        const future = d > today;
        return (
          <button
            key={d}
            className={styles.dotCell}
            data-on={on || undefined}
            data-today={d === today || undefined}
            disabled={future}
            onClick={() => toggleHabit(d, id)}
            aria-label={`${name}, ${d}: ${on ? "hecho" : "sin marcar"}`}
          >
            <i />
          </button>
        );
      })}
    </>
  );
}
