"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Pages } from "@/components/Pages";
import { useSettings, dayScore } from "@/lib/hooks";
import { useDocList } from "@/lib/client-store";
import { habitStreak, bestHabitStreak } from "@/lib/streaks";
import { addDays, daysBetween, MONTHS_SHORT, parseYmd, todayYmd, ymd } from "@/lib/date";
import type { DayDoc } from "@/lib/types";
import styles from "./progreso.module.css";

function level(score: number): number {
  if (score <= 0) return 0;
  if (score < 0.34) return 1;
  if (score < 0.67) return 2;
  if (score < 1) return 3;
  return 4;
}

function avgTime(times: string[]): string | null {
  const mins = times
    .filter((t) => /^\d{2}:\d{2}$/.test(t))
    .map((t) => {
      const [h, m] = t.split(":").map(Number);
      let v = h * 60 + m;
      if (v < 12 * 60) v += 24 * 60; // sleep after midnight counts as late night
      return v;
    });
  if (!mins.length) return null;
  const a = Math.round(mins.reduce((s, x) => s + x, 0) / mins.length) % (24 * 60);
  return `${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
}

function avgWake(times: string[]): string | null {
  const mins = times.filter((t) => /^\d{2}:\d{2}$/.test(t)).map((t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  });
  if (!mins.length) return null;
  const a = Math.round(mins.reduce((s, x) => s + x, 0) / mins.length);
  return `${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
}

export default function ProgresoPage() {
  const [settings] = useSettings();
  const { items: days, loaded } = useDocList<DayDoc>("day:");
  const today = todayYmd();
  const habits = settings.habits.filter((h) => h.active);
  const ids = habits.map((h) => h.id);
  const start = settings.startDate;
  const elapsed = Math.max(0, daysBetween(start, today) + 1);

  // 12 month columns starting at the month of the start date
  const months = useMemo(() => {
    const s = parseYmd(start);
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(s.getFullYear(), s.getMonth() + i, 1);
      return { y: d.getFullYear(), m: d.getMonth(), len: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() };
    });
  }, [start]);

  const last30 = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
  const last7 = last30.slice(-7);
  const recorded = Object.keys(days).filter((k) => k.slice(4) >= start).length;
  const perfect = Object.entries(days).filter(([k, d]) => k.slice(4) >= start && dayScore(d, ids) === 1).length;
  const moodVals = last7.map((d) => days[`day:${d}`]?.mood).filter((m): m is number => typeof m === "number");
  const mood = moodVals.length ? (moodVals.reduce((a, b) => a + b, 0) / moodVals.length).toFixed(1) : null;
  const sleep = avgTime(last7.map((d) => days[`day:${d}`]?.sleep ?? ""));
  const wake = avgWake(last7.map((d) => days[`day:${d}`]?.wake ?? ""));

  const left = (
    <div>
      <h1 className="h-page">Progreso</h1>
      <p className={styles.lede}>
        <b className="num">{elapsed}</b> {elapsed === 1 ? "día" : "días"} desde que empezaste. <b className="num">{recorded}</b> registrados,{" "}
        <b className="num">{perfect}</b> con todos los hábitos cumplidos.
      </p>

      <div className={styles.yearWrap}>
        <div className={styles.year} style={{ gridTemplateColumns: `22px repeat(12, 1fr)` }}>
          <span />
          {months.map((mo) => (
            <span key={`${mo.y}-${mo.m}`} className={styles.mLabel}>
              {MONTHS_SHORT[mo.m]}
            </span>
          ))}
          {Array.from({ length: 31 }, (_, r) => (
            <Row key={r} r={r} months={months} days={days} ids={ids} start={start} today={today} />
          ))}
        </div>
      </div>

      <div className={styles.legend} aria-hidden>
        <span>Ninguno</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <i key={l} data-l={l} />
        ))}
        <span>Todos</span>
      </div>
      {!loaded && <p className="caption">Cargando tus días…</p>}
    </div>
  );

  const right = (
    <div>
      <h2 className="h-sec">Últimos <span className="fig">7</span> días</h2>
      <dl className={styles.week}>
        <div>
          <dt>Me dormí, en promedio</dt>
          <dd className="num">{sleep ?? "—"}</dd>
        </div>
        <div>
          <dt>Me levanté</dt>
          <dd className="num">{wake ?? "—"}</dd>
        </div>
        <div>
          <dt>Ánimo (1 a 5)</dt>
          <dd className="num">{mood ?? "—"}</dd>
        </div>
      </dl>

      <h2 className="h-sec">Hábito por hábito</h2>
      <p className="caption" style={{ marginBottom: 8 }}>Últimos 30 días. El de la derecha es hoy.</p>
      <ul className={styles.habits}>
        {habits.map((h) => {
          const done = last30.filter((d) => days[`day:${d}`]?.habits?.[h.id]).length;
          const streak = habitStreak(h.id, days, today);
          const best = bestHabitStreak(h.id, days);
          return (
            <li key={h.id}>
              <div className={styles.hHead}>
                <span>{h.name}</span>
                <span className={styles.hNums}>
                  racha <b className="num">{streak}</b> · mejor <b className="num">{best}</b> · <b className="num">{Math.round((done / 30) * 100)}%</b>
                </span>
              </div>
              <div className={styles.strip} role="img" aria-label={`${h.name}: ${done} de 30 días`}>
                {last30.map((d) => (
                  <i key={d} data-on={days[`day:${d}`]?.habits?.[h.id] || undefined} data-before={d < start || undefined} />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      {habits.length === 0 && (
        <p className="caption">
          No tienes hábitos activos. <Link href="/ajustes">Agrégalos en Ajustes.</Link>
        </p>
      )}
    </div>
  );

  return <Pages left={left} right={right} />;
}

function Row({
  r,
  months,
  days,
  ids,
  start,
  today,
}: {
  r: number;
  months: { y: number; m: number; len: number }[];
  days: Record<string, DayDoc>;
  ids: string[];
  start: string;
  today: string;
}) {
  return (
    <>
      <span className={`num ${styles.dLabel}`}>{(r + 1) % 5 === 0 || r === 0 ? r + 1 : ""}</span>
      {months.map((mo) => {
        if (r >= mo.len) return <span key={mo.m} />;
        const date = ymd(new Date(mo.y, mo.m, r + 1));
        const before = date < start;
        const future = date > today;
        const doc = days[`day:${date}`];
        const l = before || future || !doc ? -1 : level(dayScore(doc, ids));
        const href = before || future ? undefined : date === today ? "/hoy" : `/hoy?d=${date}`;
        const title = `${r + 1} ${MONTHS_SHORT[mo.m]}${doc ? ` — ${Math.round(dayScore(doc, ids) * 100)}%` : ""}`;
        return href ? (
          <Link
            key={mo.m}
            href={href}
            className={styles.cell}
            data-l={l}
            data-today={date === today || undefined}
            title={title}
            aria-label={title}
          />
        ) : (
          <span key={mo.m} className={styles.cell} data-future={future || undefined} data-before={before || undefined} />
        );
      })}
    </>
  );
}
