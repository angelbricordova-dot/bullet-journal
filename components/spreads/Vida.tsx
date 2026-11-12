"use client";

import { Pages } from "@/components/Pages";
import { Figs } from "@/components/Figs";
import { dayScore, useSettings } from "@/lib/hooks";
import { useDocList } from "@/lib/client-store";
import { addDays, daysBetween, parseYmd, todayYmd, weekday } from "@/lib/date";
import { VERSES } from "@/lib/verses";
import type { DayDoc } from "@/lib/types";
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

  // geometry: 52 columns grouped by 4 weeks, rows grouped by 5 years
  const R = 2.35;
  const STEP = 6.3;
  const gx = (c: number) => 22 + c * STEP + Math.floor(c / 4) * 2.2 + R;
  const gy = (r: number) => 16 + r * STEP + Math.floor(r / 5) * 3 + R;
  const W = gx(51) + R + 4;
  const H = gy(years - 1) + R + 4;

  // this week, Monday first
  const dow = (parseYmd(today).getDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - dow));

  const left = (
    <div>
      <h1 className="h-page">Tu vida en semanas</h1>
      <p className={styles.lede}>
        Cada círculo es una semana. Cada fila, un año de <Figs>{`${years}`}</Figs>. Las llenas ya pasaron. La roja es esta.
      </p>
      {birth ? (
        <svg className={styles.grid} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${weeksLived} semanas vividas de ${totalWeeks}`}>
          {Array.from({ length: years }, (_, r) =>
            r % 5 === 0 ? (
              <text key={`y${r}`} x={0} y={gy(r) + 2.4} fontSize="6.5" fill="var(--ink-3)" className="num">
                {r}
              </text>
            ) : null,
          )}
          {Array.from({ length: years }, (_, r) =>
            Array.from({ length: 52 }, (_, c) => {
              const i = r * 52 + c;
              const state = i < weeksLived ? "past" : i === weeksLived ? "now" : "future";
              return <circle key={i} cx={gx(c)} cy={gy(r)} r={R} data-s={state} className={styles.dot} />;
            }),
          )}
        </svg>
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
        <div className={styles.bar} role="img" aria-label={`${pct.toFixed(1)}% de ${years} años`}>
          <i style={{ width: `${pct}%` }} />
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
          return (
            <div key={d} className={styles.day} data-s={state}>
              <span className={styles.dName}>{weekday(d).slice(0, 3)}</span>
              <span className={styles.dBox}>
                <i style={{ height: `${Math.round(sc * 100)}%` }} />
              </span>
              <span className="num caption">{parseYmd(d).getDate()}</span>
            </div>
          );
        })}
      </div>
      <p className="caption">La tinta de cada día muestra cuántos hábitos cumpliste.</p>

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
