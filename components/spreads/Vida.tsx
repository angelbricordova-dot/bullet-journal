"use client";

import { Pages } from "@/components/Pages";
import { Figs } from "@/components/Figs";
import { dayScore, useSettings } from "@/lib/hooks";
import { useDocList } from "@/lib/client-store";
import { addDays, daysBetween, parseYmd, todayYmd, weekday } from "@/lib/date";
import { VERSES } from "@/lib/verses";
import type { DayDoc } from "@/lib/types";
import { WeeksGrid } from "@/components/WeeksGrid";
import styles from "./vida.module.css";

const TIME = VERSES.find((v) => v.ref === "Efesios 5:15-16")!;
const COUNT = VERSES.find((v) => v.ref === "Salmos 90:12")!;

export function VidaSpread() {
  const [s, setS] = useSettings();
  const { items: days } = useDocList<DayDoc>("day:");
  const today = todayYmd();
  const years = s.lifeYears ?? 80;
  const birth = s.birthDate;
  const ids = s.habits.filter((h) => h.active).map((h) => h.id);

  const lived = birth ? Math.max(0, daysBetween(birth, today)) : 0;
  const weeksLived = Math.floor(lived / 7);
  const totalWeeks = years * 52;
  const age = birth ? Math.floor(lived / 365.2425) : 0;
  const pct = Math.min(100, (weeksLived / totalWeeks) * 100);

  // this week, Monday first
  const dow = (parseYmd(today).getDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - dow));

  const left = (
    <div>
      <h1 className="h-page">Tu vida en semanas</h1>
      <p className={`hint ${styles.lede}`}>
        Cada círculo es una semana. Cada fila, un año de <Figs>{`${years}`}</Figs>. Las llenas ya pasaron. La roja es esta.
      </p>
      {birth ? (
        <WeeksGrid years={years} lived={weeksLived} birth={birth} />
      ) : (
        <div className={styles.ask}>
          <p>Para dibujar tu vida necesito tu fecha de nacimiento.</p>
          <label className="field" style={{ maxWidth: 200 }}>
            <span>Fecha de nacimiento</span>
            <input className="box-input num" type="date" onChange={(e) => e.target.value && setS((p) => ({ ...p, birthDate: e.target.value }))} />
          </label>
        </div>
      )}
    </div>
  );

  const right = (
    <div>
      <h2 className="h-page">Cada día cuenta</h2>
      {birth && (
        <dl className={styles.stats}>
          <div>
            <dt>Edad</dt>
            <dd className="num">{age}</dd>
          </div>
          <div>
            <dt>Semanas vividas</dt>
            <dd className="num">{weeksLived.toLocaleString("es-VE")}</dd>
          </div>
          <div>
            <dt>Te quedan</dt>
            <dd className="num">{Math.max(0, totalWeeks - weeksLived).toLocaleString("es-VE")}</dd>
          </div>
        </dl>
      )}
      {birth && (
        <div className={styles.barRow}>
          <div className={styles.bar} role="img" aria-label={`${pct.toFixed(1)}% de ${years} años`}>
            <i style={{ width: `${pct}%` }} />
          </div>
          <span className="num">{pct.toFixed(1)}%</span>
        </div>
      )}
      {birth && <p className="caption">Has vivido <span className="num">{lived.toLocaleString("es-VE")}</span> días. Hoy es uno nuevo.</p>}

      <h3 className="h-sec">Esta semana</h3>
      <div className={styles.week}>
        {week.map((d) => {
          const doc = days[`day:${d}`];
          const sc = doc ? dayScore(doc, ids) : 0;
          const state = d < today ? "past" : d === today ? "now" : "future";
          const r = 17;
          const len = 2 * Math.PI * r;
          return (
            <div key={d} className={styles.day} data-s={state}>
              <span className={styles.dName}>{weekday(d).slice(0, 3)}</span>
              <svg viewBox="0 0 44 44" className={styles.ring} role="img" aria-label={`${weekday(d)} ${parseYmd(d).getDate()}: ${Math.round(sc * 100)}% de hábitos`}>
                <circle cx="22" cy="22" r={r} className={styles.track} />
                <circle
                  cx="22"
                  cy="22"
                  r={r}
                  className={styles.arc}
                  strokeDasharray={len}
                  strokeDashoffset={len * (1 - sc)}
                  transform="rotate(-90 22 22)"
                />
                <text x="22" y="22" textAnchor="middle" dominantBaseline="central" className={styles.dNum}>
                  {parseYmd(d).getDate()}
                </text>
              </svg>
            </div>
          );
        })}
      </div>
      <p className="caption hint">El anillo de cada día se cierra con los hábitos que cumples.</p>

      <figure className={styles.verse}>
        <blockquote className="quote">{COUNT.text}</blockquote>
        <figcaption className="engraved"><Figs>{COUNT.ref}</Figs></figcaption>
      </figure>
      <figure className={styles.verse}>
        <blockquote className="quote">{TIME.text}</blockquote>
        <figcaption className="engraved"><Figs>{TIME.ref}</Figs></figcaption>
      </figure>

      <div className={styles.settings}>
        <label className="field">
          <span>Nacimiento</span>
          <input className="box-input num" type="date" value={birth ?? ""} onChange={(e) => setS((p) => ({ ...p, birthDate: e.target.value || undefined }))} />
        </label>
        <label className="field">
          <span>Años en la cuadrícula</span>
          <input className="box-input num" type="number" min={60} max={100} value={years} onChange={(e) => setS((p) => ({ ...p, lifeYears: Math.max(60, Math.min(100, Number(e.target.value) || 80)) }))} />
        </label>
      </div>
    </div>
  );

  return <Pages id="vida" left={left} right={right} />;
}
