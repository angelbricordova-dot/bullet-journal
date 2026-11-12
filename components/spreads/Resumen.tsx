"use client";

import { Pages } from "@/components/Pages";
import { MonthNav, useMonthDoc } from "./Mes";
import { useDocList } from "@/lib/client-store";
import { dayScore, useChallenges, useSettings } from "@/lib/hooks";
import { emptyMonth, monthInfo } from "@/lib/month";
import { useBookMonth } from "@/lib/book";
import type { DayDoc } from "@/lib/types";
import styles from "./resumen.module.css";

export function ResumenSpread() {
  const [ym] = useBookMonth();
  const mi = monthInfo(ym);
  const [doc, setDoc] = useMonthDoc(ym);
  const [settings] = useSettings();
  const [challenges] = useChallenges();
  const { items: days } = useDocList<DayDoc>(`day:${ym}`);
  const habits = settings.habits.filter((h) => h.active);
  const ids = habits.map((h) => h.id);
  const list = Object.values(days);
  const recorded = list.length;
  const perfect = list.filter((d) => dayScore(d, ids) === 1).length;
  const avgScore = recorded ? Math.round((list.reduce((s, d) => s + dayScore(d, ids), 0) / recorded) * 100) : 0;
  const inMonth = (iso: string) => iso.slice(0, 7) === ym || new Date(iso).toISOString().slice(0, 7) === ym;
  const falls = challenges.reduce((s, c) => s + c.falls.filter((f) => inMonth(f.date)).length, 0);
  const wins = challenges.reduce((s, c) => s + c.wins.filter((w) => inMonth(w)).length, 0);
  const best = habits
    .map((h) => ({ h, n: list.filter((d) => d.habits?.[h.id]).length }))
    .sort((a, b) => b.n - a.n);

  const left = (
    <div>
      <MonthNav />
      <h1 className="h-page">
        Resumen <span className={styles.sub}>{mi.name}</span>
      </h1>

      <dl className={styles.stats}>
        <div>
          <dt>Días escritos</dt>
          <dd className="num">{recorded}</dd>
        </div>
        <div>
          <dt>Perfectos</dt>
          <dd className="num">{perfect}</dd>
        </div>
        <div>
          <dt>Hábitos</dt>
          <dd className="num">{avgScore}%</dd>
        </div>
        <div>
          <dt>Victorias</dt>
          <dd className="num">{wins}</dd>
        </div>
        <div>
          <dt>Caídas</dt>
          <dd className="num">{falls}</dd>
        </div>
      </dl>

      {best.length > 0 && recorded > 0 && (
        <p className={styles.best}>
          Lo más firme: <b>{best[0].h.name}</b> ({best[0].n} días). Lo que más costó: <b>{best[best.length - 1].h.name}</b> ({best[best.length - 1].n}).
        </p>
      )}

      <h2 className="h-sec">Mi resumen del mes</h2>
      <textarea
        className={`ruled ${styles.summary}`}
        value={doc.summary}
        onChange={(e) => setDoc((d) => ({ ...emptyMonth(), ...d, summary: e.target.value }))}
        placeholder="Cómo fue el mes: lo que cambió, lo que costó, lo que viene."
        aria-label="Resumen del mes"
      />
    </div>
  );

  const right = (
    <div>
      <h2 className="h-page">Mirando atrás</h2>
      <p className="caption hint" style={{ margin: "6px 0 10px" }}>Unas líneas al cerrar el mes. Lo que no se escribe, se olvida.</p>
      <h3 className="h-sec">Lo que aprendí</h3>
      <textarea
        className={`ruled ${styles.reflect}`}
        value={doc.learned ?? ""}
        onChange={(e) => setDoc((d) => ({ ...emptyMonth(), ...d, learned: e.target.value }))}
        aria-label="Lo que aprendí este mes"
      />
      <h3 className="h-sec">Por lo que doy gracias</h3>
      <textarea
        className={`ruled ${styles.reflect}`}
        value={doc.thanks ?? ""}
        onChange={(e) => setDoc((d) => ({ ...emptyMonth(), ...d, thanks: e.target.value }))}
        aria-label="Por lo que doy gracias este mes"
      />
      <h3 className="h-sec">Para el próximo mes</h3>
      <textarea
        className={`ruled ${styles.reflect}`}
        value={doc.next ?? ""}
        onChange={(e) => setDoc((d) => ({ ...emptyMonth(), ...d, next: e.target.value }))}
        aria-label="Para el próximo mes"
      />
    </div>
  );

  return <Pages id={`resumen-${ym}`} left={left} right={right} />;
}
