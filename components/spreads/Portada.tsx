"use client";

import { Pages } from "@/components/Pages";
import { Figs } from "@/components/Figs";
import { useSettings } from "@/lib/hooks";
import { goSpread } from "@/lib/book";
import { nowInfo } from "@/lib/month";
import { daysBetween } from "@/lib/date";
import { VERSES } from "@/lib/verses";
import { SPREAD_LIST } from "@/components/book/spreads";
import styles from "./portada.module.css";

const COUNT = VERSES.find((v) => v.ref === "Salmos 90:12")!;

/** The always-present "where am I in time" block. */
export function NowBlock({ compact = false }: { compact?: boolean }) {
  const n = nowInfo();
  return (
    <div className={styles.now} data-compact={compact || undefined}>
      <p className={`engraved ${styles.month}`}>
        {n.month} <Figs>{String(n.year)}</Figs>
      </p>
      <p className={styles.left}>
        <b className="num">{n.monthLeft}</b>
        <span>{n.monthLeft === 1 ? "día queda" : "días quedan"} este mes</span>
      </p>
      <div className={styles.ticks} role="img" aria-label={`Día ${n.day} de ${n.monthDays}`}>
        {Array.from({ length: n.monthDays }, (_, i) => (
          <i key={i} data-past={i < n.day - 1 || undefined} data-today={i === n.day - 1 || undefined} />
        ))}
      </div>
      <p className={styles.year}>
        Día <b className="num">{n.dayOfYear}</b> del año · quedan <b className="num">{n.yearLeft}</b>
      </p>
    </div>
  );
}

export function PortadaSpread() {
  const [s] = useSettings();
  const n = nowInfo();
  const dayN = daysBetween(s.startDate, n.today) + 1;

  const left = (
    <div className={styles.inside}>
      <p className={`engraved ${styles.belongs}`}>Este cuaderno pertenece a</p>
      <p className={styles.owner}>{s.owner}</p>

      <NowBlock />

      {dayN > 0 && (
        <p className={styles.change}>
          <span className={styles.changeLine}>
            Día <span className="fig">{dayN}</span> del cambio
          </span>
        </p>
      )}

      <figure className={styles.verse}>
        <blockquote className="quote">{COUNT.text}</blockquote>
        <figcaption className="engraved">
          <Figs>{COUNT.ref}</Figs>
        </figcaption>
      </figure>
    </div>
  );

  const right = (
    <div>
      <h1 className="h-page">Índice</h1>
      <ol className={styles.index}>
        {SPREAD_LIST.map((sp, i) =>
          i === 0 ? null : (
            <li key={sp.key}>
              <button onClick={() => goSpread(i)}>
                <span className={styles.iName}>{sp.label}</span>
                <span className={styles.iHint}>{sp.hint}</span>
                <span className={styles.iDots} aria-hidden />
                <span className="num">{i * 2}</span>
              </button>
            </li>
          ),
        )}
      </ol>
      <p className="caption hint" style={{ marginTop: 18 }}>
        Toca un tema o una pestaña para ir. Arrastra la esquina de la hoja para pasar página.
      </p>
    </div>
  );

  return <Pages id="portada" left={left} right={right} />;
}
