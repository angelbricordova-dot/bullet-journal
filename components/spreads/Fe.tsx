"use client";

import { useMemo, useState } from "react";
import { Check, HandHeart, Plus, RotateCcw, Shuffle, Trash2 } from "lucide-react";
import { Pages } from "@/components/Pages";
import { Figs } from "@/components/Figs";
import { usePrayers } from "@/lib/hooks";
import { useDocList } from "@/lib/client-store";
import { VERSES, verseForDay, type Verse } from "@/lib/verses";
import { pickRandom } from "@/lib/random";
import { addDays, shortDate, todayYmd, uid } from "@/lib/date";
import type { DayDoc, Prayer } from "@/lib/types";
import { play } from "@/lib/sfx";
import { useShared } from "@/lib/shared";
import { GratitudeReading } from "@/components/Checkin";
import { useBookDate } from "@/lib/book";
import styles from "./fe.module.css";

const THEMES: { tag: Verse["tags"][number]; label: string }[] = [
  { tag: "pureza", label: "Pureza" },
  { tag: "fuerza", label: "Fuerza" },
  { tag: "disciplina", label: "Disciplina" },
  { tag: "perdon", label: "Perdón" },
  { tag: "fe", label: "Confianza" },
  { tag: "dinero", label: "Dinero" },
];

export function FeSpread() {
  const [bookDate] = useBookDate();
  const today = todayYmd();
  const [theme, setTheme] = useState<Verse["tags"][number] | null>(null);
  const [pick, setPick] = useState<Verse | null>(null);
  const [prayers, setPrayers] = usePrayers();
  const [draft, setDraft] = useState("");
  const [openId, setOpenId] = useShared<string | null>("fe:open", null);
  const [answer, setAnswer] = useState("");
  const { items: days } = useDocList<DayDoc>("day:");

  const verse = pick ?? verseForDay(today);
  const pending = prayers.filter((p) => !p.answered);
  const answered = prayers.filter((p) => p.answered).sort((a, b) => (b.answered ?? "").localeCompare(a.answered ?? ""));

  const readings = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => addDays(today, -i))
        .map((d) => ({ d, r: days[`day:${d}`]?.reading }))
        .filter((x) => x.r),
    [days, today],
  );

  function draw(tag: Verse["tags"][number] | null) {
    const pool = tag ? VERSES.filter((v) => v.tags.includes(tag)) : VERSES;
    const v = pickRandom(pool, (x) => x.ref === verse.ref);
    setTheme(tag);
    setPick(v);
  }

  const left = (
    <div>
      <h1 className="h-page">Fe</h1>
      <figure className={styles.verse}>
        <blockquote className="quote">{verse.text}</blockquote>
        <figcaption className="engraved"><Figs>{verse.ref}</Figs></figcaption>
      </figure>
      <p className="caption hint">{pick ? "Versículo elegido al azar." : "Versículo de hoy. Mañana habrá otro."} Reina-Valera 1960.</p>

      <GratitudeReading date={bookDate} />

      <h2 className="h-sec">Buscar por tema</h2>
      <div className={styles.chips}>
        {THEMES.map((t) => (
          <button key={t.tag} className="chip" aria-pressed={theme === t.tag} onClick={() => draw(t.tag)}>
            {t.label}
          </button>
        ))}
        <button className="chip" onClick={() => draw(null)} aria-label="Cualquier versículo">
          <Shuffle size={14} aria-hidden style={{ marginRight: 4 }} /> Cualquiera
        </button>
        {pick && (
          <button className="chip" onClick={() => { setPick(null); setTheme(null); }}>
            <RotateCcw size={14} aria-hidden style={{ marginRight: 4 }} /> El de hoy
          </button>
        )}
      </div>

      <h2 className="h-sec">Lo que he leído</h2>
      {readings.length ? (
        <ul className={styles.readings}>
          {readings.map((x) => (
            <li key={x.d}>
              <span className="num caption">{shortDate(x.d)}</span>
              <span>{x.r}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="caption">Anota tu lectura de cada día arriba y aparecerá aquí.</p>
      )}
    </div>
  );

  const right = (
    <div>
      <h2 className={styles.title}>Oración</h2>
      <p className={`hint ${styles.lede}`}>Pídelo por escrito. Cuando llegue la respuesta, márcala y anota cómo llegó.</p>

      <form
        className={styles.add}
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          setPrayers((l) => [{ id: uid(), text: draft.trim(), date: today }, ...l]);
          setDraft("");
        }}
      >
        <input className="box-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Señor, te pido por…" aria-label="Nueva petición" />
        <button className="ink-btn" type="submit" aria-label="Agregar petición">
          <Plus aria-hidden />
        </button>
      </form>

      <ul className={styles.prayers}>
        {pending.map((p) => {
          const open = openId === p.id;
          const times = p.prayed?.length ?? 0;
          const prayedToday = p.prayed?.includes(today);
          const patchP = (q: Partial<Prayer>) => setPrayers((l) => l.map((x) => (x.id === p.id ? { ...x, ...q } : x)));
          return (
            <li key={p.id} data-open={open || undefined}>
              <button className={styles.pRow} onClick={() => setOpenId(open ? null : p.id)} aria-expanded={open}>
                <span className={styles.pText}>{p.text}</span>
                <span className="num caption">
                  {times > 0 ? `${times} ${times === 1 ? "vez" : "veces"} · ` : ""}
                  {shortDate(p.date)}
                </span>
              </button>
              {!open && (
                <div className={styles.pActions}>
                  <button
                    className={`ink-btn ${prayedToday ? "" : "ghost"}`}
                    onClick={() => {
                      if (prayedToday) return;
                      play("check");
                      patchP({ prayed: [...(p.prayed ?? []), today] });
                    }}
                    aria-pressed={!!prayedToday}
                  >
                    <HandHeart aria-hidden /> {prayedToday ? "Oraste hoy" : "Oré por esto hoy"}
                  </button>
                  <button className="ink-btn ghost" onClick={() => setOpenId(p.id)}>
                    <Check aria-hidden /> Respondida
                  </button>
                </div>
              )}
              {open && (
                <div className={styles.pOpen}>
                  <label className="field">
                    <span>Petición</span>
                    <textarea className="box-input" rows={2} value={p.text} onChange={(e) => patchP({ text: e.target.value })} />
                  </label>
                  <label className="field">
                    <span>Notas (lo que sientes, versículos, avances)</span>
                    <textarea className="box-input" rows={3} value={p.note ?? ""} onChange={(e) => patchP({ note: e.target.value })} />
                  </label>
                  <form
                    className={styles.add}
                    onSubmit={(e) => {
                      e.preventDefault();
                      patchP({ answered: today, answerNote: answer.trim() });
                      setOpenId(null);
                      setAnswer("");
                      play("paper-place");
                    }}
                  >
                    <input className="box-input" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="¿Cómo respondió Dios?" aria-label="Cómo fue respondida" />
                    <button className="ink-btn" type="submit">
                      <Check aria-hidden /> Marcar respondida
                    </button>
                  </form>
                  <div className={styles.pActions}>
                    <button className="ink-btn ghost" onClick={() => setOpenId(null)}>
                      Cerrar
                    </button>
                    <button className="icon-btn" onClick={() => confirm("¿Borrar esta petición?") && setPrayers((l) => l.filter((x) => x.id !== p.id))} aria-label="Borrar petición">
                      <Trash2 />
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
        {pending.length === 0 && <li className="caption">Sin peticiones pendientes.</li>}
      </ul>

      {answered.length > 0 && (
        <>
          <h3 className="h-sec">Respondidas</h3>
          <ul className={styles.answered}>
            {answered.map((p) => (
              <li key={p.id}>
                <span className={`stamp ${styles.miniStamp}`}>Respondida</span>
                <span className={styles.pText}>{p.text}</span>
                {p.answerNote && <span className="quote">{p.answerNote}</span>}
                <span className="num caption">
                  {shortDate(p.date)} → {shortDate(p.answered!)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );

  return <Pages id="fe" left={left} right={right} />;
}
