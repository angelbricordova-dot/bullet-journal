"use client";

import { InkLine } from "./InkLine";
import { useDay } from "@/lib/hooks";
import { emptyDay } from "@/lib/defaults";
import { shortDate, todayYmd } from "@/lib/date";
import type { DayDoc } from "@/lib/types";
import styles from "./checkin.module.css";

const MOODS = ["Muy mal", "Mal", "Normal", "Bien", "Muy bien"];

function useDayPatch(date: string) {
  const [day, setDay] = useDay(date);
  const patch = (p: Partial<DayDoc>) => setDay((prev) => ({ ...emptyDay(), ...prev, ...p }));
  return [day, patch] as const;
}

function DateTag({ date }: { date: string }) {
  return <span className={styles.date}>{date === todayYmd() ? "hoy" : shortDate(date)}</span>;
}

/** Sleep and mood for one day (lives with the sleep chart). */
export function SleepMood({ date }: { date: string }) {
  const [day, patch] = useDayPatch(date);
  return (
    <>
      <div className={styles.head}>
        <h3 className="h-sec">Sueño</h3>
        <DateTag date={date} />
      </div>
      <div className={styles.sleep}>
        <label className="field">
          <span>Me dormí</span>
          <input className="box-input num" type="time" value={day.sleep ?? ""} onChange={(e) => patch({ sleep: e.target.value })} />
        </label>
        <label className="field">
          <span>Me levanté</span>
          <input className="box-input num" type="time" value={day.wake ?? ""} onChange={(e) => patch({ wake: e.target.value })} />
        </label>
      </div>
      <div className={styles.head}>
        <h3 className="h-sec">Ánimo</h3>
        <DateTag date={date} />
      </div>
      <div className={styles.moods} role="radiogroup" aria-label="Ánimo del día">
        {MOODS.map((m, i) => (
          <button
            key={m}
            role="radio"
            aria-checked={day.mood === i + 1}
            className={styles.mood}
            data-fill={day.mood !== undefined && i + 1 <= day.mood ? "" : undefined}
            onClick={() => patch({ mood: day.mood === i + 1 ? undefined : i + 1 })}
          >
            <i aria-hidden />
            <span>{m}</span>
          </button>
        ))}
      </div>
    </>
  );
}

/** Gratitude and Bible reading for one day (lives in Fe). */
export function GratitudeReading({ date }: { date: string }) {
  const [day, patch] = useDayPatch(date);
  return (
    <>
      <div className={styles.head}>
        <h3 className="h-sec">Lectura bíblica</h3>
        <DateTag date={date} />
      </div>
      <InkLine
        className={`ruled ${styles.reading}`}
        value={day.reading ?? ""}
        onValue={(v) => patch({ reading: v })}
        placeholder="Ej. Proverbios 4"
        aria-label="Lectura bíblica del día"
      />
      <div className={styles.head}>
        <h3 className="h-sec">Gratitud</h3>
        <DateTag date={date} />
      </div>
      <ol className={`ruled ${styles.gratitude}`}>
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <InkLine
              value={day.gratitude[i] ?? ""}
              onValue={(v) => {
                const g = [...day.gratitude];
                g[i] = v;
                patch({ gratitude: g });
              }}
              onEnter={() => (document.querySelector(`[aria-label="Gratitud ${i + 2}"]`) as HTMLElement | null)?.focus()}
              placeholder={i === 0 ? "Hoy doy gracias por…" : ""}
              aria-label={`Gratitud ${i + 1}`}
            />
          </li>
        ))}
      </ol>
    </>
  );
}
