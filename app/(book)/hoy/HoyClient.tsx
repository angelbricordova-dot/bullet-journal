"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Pages } from "@/components/Pages";
import { RapidLog } from "@/components/RapidLog";
import { StickerLayer, StickerTray, newSticker } from "@/components/Stickers";
import { HabitCheck } from "@/components/HabitCheck";
import { Figs } from "@/components/Figs";
import { useDay, useSettings } from "@/lib/hooks";
import { ensureLoaded, useDocList, writeDoc } from "@/lib/client-store";
import { emptyDay } from "@/lib/defaults";
import { verseForDay } from "@/lib/verses";
import { addDays, daysBetween, longDate, nextOccurrence, parseYmd, todayYmd, uid, weekday } from "@/lib/date";
import type { Bullet, DayDoc } from "@/lib/types";
import styles from "./hoy.module.css";

const MOODS = ["Muy mal", "Mal", "Normal", "Bien", "Muy bien"];

export function HoyClient() {
  const params = useSearchParams();
  const router = useRouter();
  const today = todayYmd();
  const raw = params.get("d");
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : today;
  const isToday = date === today;

  const [settings] = useSettings();
  const [day, setDay] = useDay(date);
  const { items: history } = useDocList<DayDoc>("day:");

  const habits = settings.habits.filter((h) => h.active);
  const doneCount = habits.filter((h) => day.habits[h.id]).length;
  const dayN = daysBetween(settings.startDate, date) + 1;
  const verse = verseForDay(date);
  const d = parseYmd(date);

  const upcoming = useMemo(
    () =>
      settings.dates
        .map((x) => ({ ...x, next: nextOccurrence(x.date, date) }))
        .filter((x): x is typeof x & { next: string } => !!x.next && daysBetween(date, x.next) <= 60)
        .sort((a, b) => a.next.localeCompare(b.next)),
    [settings.dates, date],
  );

  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(date, i - 6)), [date]);

  function go(to: string) {
    router.push(to === today ? "/hoy" : `/hoy?d=${to}`);
  }

  function patch(p: Partial<DayDoc>) {
    setDay((prev) => ({ ...emptyDay(), ...prev, ...p }));
  }

  async function migrate(b: Bullet) {
    const key = `day:${addDays(date, 1)}`;
    const next = { ...emptyDay(), ...((await ensureLoaded<DayDoc>(key)) ?? {}) };
    writeDoc<DayDoc>(key, { ...next, log: [...next.log, { ...b, id: uid(), state: "open" }] });
  }

  const left = (
    <div className={styles.pageBody}>
      <StickerLayer page="left" stickers={day.stickers} onChange={(stickers) => patch({ stickers })} />

      <header className={styles.head}>
        <div>
          <p className={`engraved ${styles.weekday}`}>{weekday(date)}</p>
          <h1 className="h-page"><Figs>{longDate(date).replace(/ de \d{4}$/, "")}</Figs></h1>
          <p className={styles.meta}>
            <span className="num">{d.getFullYear()}</span>
            {dayN > 0 && (
              <>
                <span aria-hidden>·</span>
                <span>Día <b className="num">{dayN}</b> del cambio</span>
              </>
            )}
          </p>
        </div>
        <nav className={styles.dayNav} aria-label="Cambiar de día">
          <button className="icon-btn" onClick={() => go(addDays(date, -1))} aria-label="Día anterior">
            <ChevronLeft />
          </button>
          {!isToday && (
            <Link href="/hoy" className="chip">Hoy</Link>
          )}
          <label className="icon-btn" title="Ir a una fecha">
            <CalendarDays aria-hidden />
            <input
              type="date"
              className={styles.dateInput}
              value={date}
              onChange={(e) => e.target.value && go(e.target.value)}
              aria-label="Ir a una fecha"
            />
          </label>
          <button className="icon-btn" onClick={() => go(addDays(date, 1))} aria-label="Día siguiente">
            <ChevronRight />
          </button>
        </nav>
      </header>

      {upcoming.length > 0 && (
        <ul className={styles.dates}>
          {upcoming.map((u) => {
            const n = daysBetween(date, u.next);
            return (
              <li key={u.id}>
                <span className={styles.dateMark} aria-hidden />
                <span>{u.label}</span>
                <b className="num">{n === 0 ? "es hoy" : n === 1 ? "mañana" : `faltan ${n} días`}</b>
              </li>
            );
          })}
        </ul>
      )}

      <figure className={styles.verse}>
        <blockquote className="quote">{verse.text}</blockquote>
        <figcaption className="engraved"><Figs>{verse.ref}</Figs></figcaption>
      </figure>

      <div className={styles.secHead}>
        <h2 className="h-sec">Registro rápido</h2>
        <StickerTray onPick={(k) => patch({ stickers: [...day.stickers, newSticker(k, "left")] })} />
      </div>
      <RapidLog items={day.log} onChange={(log) => patch({ log })} onMigrate={migrate} />

      <h2 className="h-sec">Lo que pasó hoy</h2>
      <textarea
        className={`ruled ${styles.notes}`}
        value={day.note}
        onChange={(e) => patch({ note: e.target.value })}
        placeholder="Escribe sin filtro. Nadie más lo lee."
        rows={6}
        aria-label="Notas del día"
      />
    </div>
  );

  const right = (
    <div className={styles.pageBody}>
      <StickerLayer page="right" stickers={day.stickers} onChange={(stickers) => patch({ stickers })} />

      <div className={styles.secHead}>
        <h2 className="h-sec">Hábitos</h2>
        <p className={styles.tally}>
          <b className="num">{doneCount}</b> de <span className="num">{habits.length}</span>
        </p>
      </div>
      <div className={styles.weekHead} aria-hidden>
        <span />
        {week.map((w) => (
          <span key={w} data-today={w === date || undefined}>{weekday(w).slice(0, 1).toUpperCase()}</span>
        ))}
      </div>
      <ul className={styles.habits}>
        {habits.map((h) => (
          <li key={h.id} className={styles.habit}>
            <HabitCheck
              checked={!!day.habits[h.id]}
              onToggle={() => patch({ habits: { ...day.habits, [h.id]: !day.habits[h.id] } })}
              label={h.name}
            />
            <span className={styles.habitText}>
              <span>{h.name}</span>
              {h.hint && <span className="caption">{h.hint}</span>}
            </span>
            <span className={styles.strip} aria-label={`Últimos 7 días de ${h.name}`}>
              {week.map((w) => {
                const on = w === date ? !!day.habits[h.id] : !!history[`day:${w}`]?.habits?.[h.id];
                return <i key={w} data-on={on || undefined} data-today={w === date || undefined} />;
              })}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="h-sec">Sueño</h2>
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

      <h2 className="h-sec">Ánimo</h2>
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

      <h2 className="h-sec">Gratitud</h2>
      <ol className={`ruled ${styles.gratitude}`}>
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <input
              className="ink-input"
              value={day.gratitude[i] ?? ""}
              onChange={(e) => {
                const g = [...day.gratitude];
                g[i] = e.target.value;
                patch({ gratitude: g });
              }}
              placeholder={i === 0 ? "Hoy doy gracias por…" : ""}
              aria-label={`Gratitud ${i + 1}`}
            />
          </li>
        ))}
      </ol>

      <h2 className="h-sec">Lectura bíblica</h2>
      <input
        className="ink-input ruled"
        style={{ height: "var(--line)" }}
        value={day.reading ?? ""}
        onChange={(e) => patch({ reading: e.target.value })}
        placeholder="Ej. Proverbios 4"
        aria-label="Lectura bíblica de hoy"
      />
    </div>
  );

  return <Pages left={left} right={right} />;
}
