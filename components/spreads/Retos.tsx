"use client";

import { useEffect, useState } from "react";
import { Archive, Check, Plus, RotateCcw } from "lucide-react";
import { Pages } from "@/components/Pages";
import { Tally } from "@/components/Tally";
import { HabitCheck } from "@/components/HabitCheck";
import { Figs } from "@/components/Figs";
import { useChallenges, useDay, useSettings } from "@/lib/hooks";
import { useDocList } from "@/lib/client-store";
import { challengeBest, challengeDays, abstainNow } from "@/lib/streaks";
import { VERSES } from "@/lib/verses";
import { shortDate, todayYmd, uid, ymd } from "@/lib/date";
import type { Challenge, DayDoc } from "@/lib/types";
import { useShared } from "@/lib/shared";
import styles from "./retos.module.css";

const TRIGGERS = ["Celular en la cama", "Aburrimiento", "Soledad", "Desvelo", "Ansiedad o estrés", "Redes sociales", "Cansancio"];
const RISE = VERSES.find((v) => v.ref === "Proverbios 24:16")!;
const CLEAN = VERSES.find((v) => v.ref === "1 Juan 1:9")!;

export function RetosSpread() {
  const [challenges, setChallenges] = useChallenges();
  const [settings] = useSettings();
  const { items: days } = useDocList<DayDoc>("day:");
  const [today, setToday] = useState(todayYmd());
  const [todayDoc, setTodayDoc] = useDay(today);
  const [, tick] = useState(0);
  const active = challenges.filter((c) => !c.archived);
  const [selId, setSelId] = useShared<string | null>("retos:sel", null);
  const sel = active.find((c) => c.id === selId) ?? active[0];

  // live clock for the abstinence counters
  useEffect(() => {
    const t = setInterval(() => {
      tick((n) => n + 1);
      setToday(todayYmd());
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  // merge today's live doc into the history used for streaks
  const history = { ...days, [`day:${today}`]: todayDoc };

  function patch(id: string, p: Partial<Challenge>) {
    setChallenges((list) => list.map((c) => (c.id === id ? { ...c, ...p } : c)));
  }

  const left = (
    <div>
      <h1 className="h-page">Retos</h1>
      <p className={styles.lede}>Cada marca es un día ganado. Si caes, lo escribes, te levantas y la cuenta vuelve a empezar.</p>

      <ul className={styles.list}>
        {active.map((c) => {
          const n = challengeDays(c, history);
          const hours = c.kind === "abstain" ? abstainNow(c).hours : null;
          return (
            <li key={c.id}>
              <button className={styles.entry} aria-pressed={sel?.id === c.id} onClick={() => setSelId(c.id)}>
                <span className={styles.entryHead}>
                  <span className={styles.name}>{c.name}</span>
                  <span className={styles.count}>
                    <b className="num">{n}</b> {n === 1 ? "día" : "días"}
                    {hours !== null && <span className="num"> {hours} h</span>}
                  </span>
                </span>
                <Tally value={n} target={c.target} label={c.name} />
                <span className={styles.meta}>
                  Meta: <span className="num">{c.target}</span> días
                  {c.kind === "abstain" && c.wins.length > 0 && (
                    <> · <span className="num">{c.wins.length}</span> {c.wins.length === 1 ? "tentación vencida" : "tentaciones vencidas"}</>
                  )}
                  {n >= c.target && <span className="stamp" style={{ marginLeft: 10, fontSize: "0.75rem" }}>Cumplido</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <NewChallenge
        habits={settings.habits.filter((h) => h.active)}
        onAdd={(c) => {
          setChallenges((l) => [...l, c]);
          setSelId(c.id);
        }}
      />
    </div>
  );

  const right = sel ? (
    <ChallengeDetail
      key={sel.id}
      c={sel}
      days={history}
      todayDone={sel.habitId ? !!todayDoc.habits[sel.habitId] : false}
      onToggleToday={() =>
        sel.habitId && setTodayDoc((d) => ({ ...d, habits: { ...d.habits, [sel.habitId!]: !d.habits[sel.habitId!] } }))
      }
      onPatch={(p) => patch(sel.id, p)}
    />
  ) : (
    <p className="caption">Crea tu primer reto en la página de la izquierda.</p>
  );

  return <Pages id="retos" left={left} right={right} />;
}

function ChallengeDetail({
  c,
  days,
  todayDone,
  onToggleToday,
  onPatch,
}: {
  c: Challenge;
  days: Record<string, DayDoc | undefined>;
  todayDone: boolean;
  onToggleToday: () => void;
  onPatch: (p: Partial<Challenge>) => void;
}) {
  const [falling, setFalling] = useState(false);
  const [what, setWhat] = useState("");
  const [triggers, setTriggers] = useState<string[]>([]);
  const [plan, setPlan] = useState("");
  const [justFell, setJustFell] = useState(false);
  const [won, setWon] = useState(false);

  const best = challengeBest(c, days);
  const now = challengeDays(c, days);

  function fall() {
    const parts = [
      what.trim() && `Qué pasó: ${what.trim()}`,
      triggers.length > 0 && `Detonante: ${triggers.join(", ")}`,
      plan.trim() && `La próxima vez: ${plan.trim()}`,
    ].filter(Boolean);
    onPatch({ falls: [...c.falls, { date: new Date().toISOString(), note: parts.join("\n") }] });
    setFalling(false);
    setWhat("");
    setTriggers([]);
    setPlan("");
    setJustFell(true);
  }

  function win() {
    onPatch({ wins: [...c.wins, new Date().toISOString()] });
    setWon(true);
    setTimeout(() => setWon(false), 1400);
  }

  const timeline = [
    ...c.falls.map((f) => ({ kind: "fall" as const, date: f.date, note: f.note })),
    ...c.wins.map((w) => ({ kind: "win" as const, date: w, note: "" })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <h2 className={styles.detailTitle}>{c.name}</h2>
      <p className="quote" style={{ fontSize: "1.05rem" }}>{c.why}</p>

      <dl className={styles.stats}>
        <div>
          <dt>Racha actual</dt>
          <dd className="num">{now}</dd>
        </div>
        <div>
          <dt>Mejor racha</dt>
          <dd className="num">{best}</dd>
        </div>
        {c.kind === "abstain" ? (
          <>
            <div>
              <dt>Victorias</dt>
              <dd className="num">{c.wins.length}</dd>
            </div>
            <div>
              <dt>Caídas</dt>
              <dd className="num">{c.falls.length}</dd>
            </div>
          </>
        ) : (
          <div>
            <dt>Meta</dt>
            <dd className="num">{c.target}</dd>
          </div>
        )}
      </dl>

      {c.kind === "habit" ? (
        <div className={styles.todayRow}>
          <HabitCheck checked={todayDone} onToggle={onToggleToday} label="Hecho hoy" />
          <span>{todayDone ? "Hecho hoy. Mañana, otra marca." : "Márcalo cuando lo cumplas hoy."}</span>
        </div>
      ) : (
        <div className={styles.actions}>
          <button className="ink-btn" onClick={win}>
            <Check aria-hidden /> Vencí una tentación
          </button>
          <button className="ink-btn ghost" onClick={() => setFalling((f) => !f)} aria-expanded={falling}>
            <RotateCcw aria-hidden /> Caí
          </button>
          {won && <span className="stamp" aria-live="polite">Victoria</span>}
        </div>
      )}

      {justFell && !falling && (
        <div className={styles.rise} role="status">
          <p className="quote">{RISE.text}</p>
          <p className="engraved"><Figs>{RISE.ref}</Figs></p>
          <p className="quote" style={{ marginTop: 10 }}>{CLEAN.text}</p>
          <p className="engraved"><Figs>{CLEAN.ref}</Figs></p>
          <p className={styles.riseNote}>La cuenta empieza otra vez desde ahora. Levántate.</p>
        </div>
      )}

      {falling && (
        <form
          className={styles.fallForm}
          onSubmit={(e) => {
            e.preventDefault();
            fall();
          }}
        >
          <p className={styles.formLede}>Escríbelo con honestidad. No para castigarte, sino para entender qué lo provocó.</p>
          <label className="field">
            <span>¿Qué pasó?</span>
            <textarea className="box-input" rows={2} value={what} onChange={(e) => setWhat(e.target.value)} />
          </label>
          <fieldset className="field">
            <span>¿Qué lo provocó?</span>
            <div className={styles.chips}>
              {TRIGGERS.map((t) => (
                <button
                  type="button"
                  key={t}
                  className="chip"
                  aria-pressed={triggers.includes(t)}
                  onClick={() => setTriggers((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))}
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span>¿Qué harás distinto la próxima vez?</span>
            <textarea className="box-input" rows={2} value={plan} onChange={(e) => setPlan(e.target.value)} />
          </label>
          <div className={styles.actions}>
            <button className="ink-btn red" type="submit">Registrar y empezar de nuevo</button>
            <button className="ink-btn ghost" type="button" onClick={() => setFalling(false)}>Cancelar</button>
          </div>
        </form>
      )}

      {timeline.length > 0 && (
        <>
          <h3 className="h-sec">Historial</h3>
          <ol className={styles.timeline}>
            {timeline.slice(0, 40).map((t, i) => (
              <li key={i} data-kind={t.kind}>
                <span className={`num ${styles.tDate}`}>{shortDate(ymd(new Date(t.date)))}</span>
                <span>
                  <b>{t.kind === "fall" ? "Caída" : "Tentación vencida"}</b>
                  {t.note && <span className={styles.tNote}>{t.note}</span>}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}

      <div className={styles.footer}>
        <label className="field" style={{ maxWidth: 140 }}>
          <span>Meta (días)</span>
          <input
            className="box-input num"
            type="number"
            min={1}
            max={1000}
            value={c.target}
            onChange={(e) => onPatch({ target: Math.max(1, Number(e.target.value) || 1) })}
          />
        </label>
        <button className="ink-btn ghost" onClick={() => confirm(`¿Archivar “${c.name}”? Podrás seguir viendo su historial en la copia de seguridad.`) && onPatch({ archived: true })}>
          <Archive aria-hidden /> Archivar
        </button>
      </div>
    </div>
  );
}

function NewChallenge({ habits, onAdd }: { habits: { id: string; name: string }[]; onAdd: (c: Challenge) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [why, setWhy] = useState("");
  const [kind, setKind] = useState<"abstain" | "habit">("abstain");
  const [habitId, setHabitId] = useState(habits[0]?.id ?? "");
  const [target, setTarget] = useState(40);

  if (!open) {
    return (
      <button className="ink-btn ghost" style={{ marginTop: 20 }} onClick={() => setOpen(true)}>
        <Plus aria-hidden /> Nuevo reto
      </button>
    );
  }

  return (
    <form
      className={styles.newForm}
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAdd({
          id: uid(),
          name: name.trim(),
          why: why.trim(),
          kind,
          habitId: kind === "habit" ? habitId : undefined,
          start: kind === "abstain" ? new Date().toISOString() : todayYmd(),
          target,
          falls: [],
          wins: [],
        });
        setOpen(false);
        setName("");
        setWhy("");
      }}
    >
      <h3 className="h-sec">Nuevo reto</h3>
      <label className="field">
        <span>Nombre</span>
        <input className="box-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Sin redes después de las 10 pm" autoFocus />
      </label>
      <label className="field">
        <span>¿Por qué?</span>
        <input className="box-input" value={why} onChange={(e) => setWhy(e.target.value)} />
      </label>
      <fieldset className="field">
        <span>Tipo</span>
        <div className={styles.chips}>
          <button type="button" className="chip" aria-pressed={kind === "abstain"} onClick={() => setKind("abstain")}>Dejar algo</button>
          <button type="button" className="chip" aria-pressed={kind === "habit"} onClick={() => setKind("habit")}>Cumplir un hábito</button>
        </div>
      </fieldset>
      {kind === "habit" && (
        <label className="field">
          <span>Hábito</span>
          <select className="box-input" value={habitId} onChange={(e) => setHabitId(e.target.value)}>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </label>
      )}
      <label className="field" style={{ maxWidth: 160 }}>
        <span>Meta (días)</span>
        <input className="box-input num" type="number" min={1} value={target} onChange={(e) => setTarget(Math.max(1, Number(e.target.value) || 1))} />
      </label>
      <div className={styles.actions}>
        <button className="ink-btn" type="submit">Empezar hoy</button>
        <button className="ink-btn ghost" type="button" onClick={() => setOpen(false)}>Cancelar</button>
      </div>
    </form>
  );
}
