"use client";

import { Figs } from "../Figs";
import { Deco } from "./Deco";
import { nowInfo } from "@/lib/month";
import { daysBetween } from "@/lib/date";
import { useSettings } from "@/lib/hooks";
import styles from "./cover.module.css";

/** Outside of the front cover: always shows the month and the days left. */
export function CoverFront({ active = true }: { active?: boolean }) {
  const n = nowInfo();
  const [s] = useSettings();
  const dayN = daysBetween(s.startDate, n.today) + 1;
  return (
    <div className={styles.cover} data-deco-host="cover" data-active={active || undefined}>
      <div className={styles.tooling} aria-hidden />
      <p className={styles.title}>Bitácora</p>

      <div className={styles.plate}>
        <span className={styles.plateMonth}>
          {n.month} <Figs>{String(n.year)}</Figs>
        </span>
        <span className={styles.plateLeft}>
          <b className="num">{n.monthLeft}</b> {n.monthLeft === 1 ? "día queda" : "días quedan"}
        </span>
        <span className={styles.plateYear}>
          <Figs>{`Día ${n.dayOfYear} de ${n.yearDays}`}</Figs>
        </span>
      </div>

      {dayN > 0 && (
        <p className={styles.change}>
          <Figs>{`Día ${dayN} del cambio`}</Figs>
        </p>
      )}
      <p className={styles.initials}>{s.initials}</p>
      <span className={styles.strap} aria-hidden>
        <i />
      </span>
      <p className={`hint ${styles.hint}`}>Toca para abrir</p>
      <Deco id="cover" />
    </div>
  );
}
