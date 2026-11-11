"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Pages } from "@/components/Pages";
import { Figs } from "@/components/Figs";
import { HabitCheck } from "@/components/HabitCheck";
import { useDoc, useDocList } from "@/lib/client-store";
import { dayScore, useSettings } from "@/lib/hooks";
import { emptyMonth, monthInfo, shiftMonth, type MonthDoc } from "@/lib/month";
import { goSpread, setBookDate, setBookMonth, useBookMonth } from "@/lib/book";
import { useShared } from "@/lib/shared";
import { todayYmd, uid, MONTHS_SHORT } from "@/lib/date";
import type { DayDoc } from "@/lib/types";
import { SPREAD_INDEX } from "@/components/book/spreads";
import styles from "./mes.module.css";

const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function useMonthDoc(ym: string) {
  const [raw, set, loaded] = useDoc<MonthDoc>(`month:${ym}`, emptyMonth());
  return [{ ...emptyMonth(), ...raw }, set, loaded] as const;
}

export function MonthNav() {
  const [ym] = useBookMonth();
  const mi = monthInfo(ym);
  return (
    <div className={styles.nav}>
      <button className="icon-btn" onClick={() => setBookMonth(shiftMonth(ym, -1))} aria-label="Mes anterior">
        <ChevronLeft />
      </button>
      <div className={styles.monthTabs} role="tablist" aria-label={`Meses de ${mi.y}`}>
        {MONTHS_SHORT.map((m, i) => {
          const key = `${mi.y}-${String(i + 1).padStart(2, "0")}`;
          return (
            <button key={m} role="tab" aria-selected={key === ym} onClick={() => setBookMonth(key)} title={m}>
              <span className="num">{i + 1}</span>
            </button>
          );
        })}
      </div>
      <button className="icon-btn" onClick={() => setBookMonth(shiftMonth(ym, 1))} aria-label="Mes siguiente">
        <ChevronRight />
      </button>
    </div>
  );
}

export function MesSpread() {
  const [ym] = useBookMonth();
  const mi = monthInfo(ym);
  const [doc, setDoc] = useMonthDoc(ym);
  const [settings] = useSettings();
  const { items: days } = useDocList<DayDoc>(`day:${ym}`);
  const [editing, setEditing] = useShared<number | null>(`mes:edit:${ym}`, null);
  const [goal, setGoal] = useState("");
  const today = todayYmd();
  const ids = settings.habits.filter((h) => h.active).map((h) => h.id);
  const recorded = Object.keys(days).length;
  const perfect = Object.values(days).filter((d) => dayScore(d, ids) === 1).length;
  const pad = (n: number) => String(n).padStart(2, "0");

  const left = (
    <div className={styles.opener}>
      <MonthNav />
      <div className={styles.big}>
        <span className={`num ${styles.yearStack}`}>
          {String(mi.y).slice(0, 2)}
          <br />
          {String(mi.y).slice(2)}
        </span>
        <div>
          <p className={`engraved ${styles.welcome}`}>Bienvenido</p>
          <h1 className={styles.mName}>{mi.name}</h1>
          <p className={`num ${styles.range}`}>
            01/{pad(mi.m)} – {mi.days}/{pad(mi.m)}
          </p>
        </div>
        <span className={`num ${styles.mNum}`} aria-hidden>
          {mi.m}
        </span>
      </div>

      <dl className={styles.stats}>
        <div>
          <dt>{mi.isCurrent ? "Quedan" : "Días"}</dt>
          <dd className="num">{mi.isCurrent ? mi.left : mi.days}</dd>
        </div>
        <div>
          <dt>Registrados</dt>
          <dd className="num">{recorded}</dd>
        </div>
        <div>
          <dt>Perfectos</dt>
          <dd className="num">{perfect}</dd>
        </div>
      </dl>

      <h2 className="h-sec">Metas del mes</h2>
      <ul className={styles.goals}>
        {doc.goals.map((g) => (
          <li key={g.id}>
            <HabitCheck
              checked={g.done}
              label={g.text}
              onToggle={() => setDoc((d) => ({ ...emptyMonth(), ...d, goals: d.goals.map((x) => (x.id === g.id ? { ...x, done: !x.done } : x)) }))}
            />
            <input
              className="ink-input"
              value={g.text}
              data-done={g.done || undefined}
              onChange={(e) => setDoc((d) => ({ ...emptyMonth(), ...d, goals: d.goals.map((x) => (x.id === g.id ? { ...x, text: e.target.value } : x)) }))}
              aria-label="Meta"
            />
            <button className="icon-btn" onClick={() => setDoc((d) => ({ ...emptyMonth(), ...d, goals: d.goals.filter((x) => x.id !== g.id) }))} aria-label="Borrar meta">
              <Trash2 />
            </button>
          </li>
        ))}
      </ul>
      <form
        className={styles.addGoal}
        onSubmit={(e) => {
          e.preventDefault();
          if (!goal.trim()) return;
          setDoc((d) => ({ ...emptyMonth(), ...d, goals: [...(d.goals ?? []), { id: uid(), text: goal.trim(), done: false }] }));
          setGoal("");
        }}
      >
        <input className="ink-input" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Nueva meta para este mes…" aria-label="Nueva meta" />
        <button className="icon-btn" type="submit" aria-label="Agregar meta">
          <Plus />
        </button>
      </form>
    </div>
  );

  const cells: (number | null)[] = [...Array(mi.startDow).fill(null), ...Array.from({ length: mi.days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const right = (
    <div className={styles.calWrap}>
      <h2 className={`engraved ${styles.calTitle}`}>
        <Figs>{`${mi.name} ${mi.y}`}</Figs>
      </h2>
      <div className={styles.cal}>
        {DOW.map((d, i) => (
          <span key={d} className={styles.dow} data-we={i >= 5 ? i - 4 : undefined}>
            {d}
          </span>
        ))}
        {cells.map((n, i) => {
          if (!n) return <span key={`e${i}`} className={styles.empty} data-we={i % 7 >= 5 ? (i % 7) - 4 : undefined} />;
          const date = `${ym}-${pad(n)}`;
          const day = days[`day:${date}`];
          const score = day ? dayScore(day, ids) : -1;
          const note = doc.notes[String(n)] ?? "";
          const firstEvent = day?.log?.find((b) => b.kind === "event")?.text;
          return (
            <div key={n} className={styles.cell} data-we={i % 7 >= 5 ? (i % 7) - 4 : undefined} data-today={date === today || undefined}>
              <button
                className={styles.dnum}
                onClick={() => {
                  setBookDate(date);
                  goSpread(SPREAD_INDEX.hoy);
                }}
                title="Abrir este día"
              >
                <span className="num">{n}</span>
                {score >= 0 && <i className={styles.dot} data-l={score === 1 ? 4 : score >= 0.67 ? 3 : score >= 0.34 ? 2 : score > 0 ? 1 : 0} aria-hidden />}
              </button>
              {editing === n ? (
                <textarea
                  autoFocus
                  className={styles.noteEdit}
                  value={note}
                  onChange={(e) => setDoc((d) => ({ ...emptyMonth(), ...d, notes: { ...d.notes, [String(n)]: e.target.value } }))}
                  onBlur={() => setEditing(null)}
                  onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                  aria-label={`Nota del ${n}`}
                />
              ) : (
                <button className={styles.note} onClick={() => setEditing(n)} aria-label={`Escribir el ${n}`}>
                  {note || firstEvent || ""}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="caption" style={{ marginTop: 8 }}>
        Toca un día para escribir en él. Toca el número para abrir su página.
      </p>
    </div>
  );

  return <Pages id={`mes-${ym}`} left={left} right={right} />;
}
