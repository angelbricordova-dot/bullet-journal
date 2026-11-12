"use client";

import { useEffect, useState } from "react";
import { Archive, Check, Plus, RotateCcw } from "lucide-react";
import { Pages } from "@/components/Pages";
import { Tally } from "@/components/Tally";
import { HabitCheck } from "@/components/HabitCheck";
import { Figs } from "@/components/Figs";
import { Brain } from "@/components/Brain";
import { useChallenges, useDay, useSettings } from "@/lib/hooks";
import { useDocList } from "@/lib/client-store";
import { challengeBest, challengeDays, abstainNow } from "@/lib/streaks";
import { VERSES } from "@/lib/verses";
import { shortDate, todayYmd, uid, ymd } from "@/lib/date";
import type { Challenge, DayDoc } from "@/lib/types";
import { useShared } from "@/lib/shared";
import { play } from "@/lib/sfx";
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
  const abstains = active.filter((c) => c.kind === "abstain");
  const habits = active.filter((c) => c.kind === "habit");
  const [mainId, setMainId] = useShared<string | null>("retos:main", null);
  const main = abstains.find((c) => c.id === mainId) ?? abstains[0];
  const [falling, setFalling] = useShared("retos:falling", false);
  const [justFell, setJustFell] = useShared("retos:fell", false);

  useEffect(() => {
    const t = setInterval(() => {
      tick((n) => n + 1);
      setToday(todayYmd());
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  const history = { ...days, [`day:${today}`]: todayDoc };

  function patch(id: string, p: Partial<Challenge>) {
    setChallenges((list) => list.map((c) => (c.id === id ? { ...c, ...p } : c)));
  }

  /* ---------------- left: the brain ---------------- */
  const left = main ? (
    <BrainPage
      key={main.id}
      c={main}
      others={abstains}
      onPick={setMainId}
      falling={falling}
      setFalling={setFalling}
      justFell={justFell}
      setJustFell={setJustFell}
      onPatch={(p) => patch(main.id, p)}
    />
  ) : (
    <div>
      <h1 className="h-page">Retos</h1>
      <p className="caption">Crea un reto de “dejar algo” en la página de la derecha y aquí aparecerá su cerebro.</p>
    </div>
  );

  /* ---------------- right: habit streaks, history, new ---------------- */
  const timeline = main
    ? [
        ...main.falls.map((f) => ({ kind: "fall" as const, date: f.date, note: f.note })),
        ...main.wins.map((w) => ({ kind: "win" as const, date: w, note: "" })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const right = (
    <div>
      <h2 className="h-page">Disciplina</h2>
      <p className={styles.lede}>Rachas de lo que estás construyendo. Cada marca es un día cumplido.</p>
      <ul className={styles.list}>
        {habits.map((c) => {
          const n = challengeDays(c, history);
          const doneToday = c.habitId ? !!todayDoc.habits[c.habitId] : false;
          return (
            <li key={c.id} className={styles.row}>
              <div className={styles.rowHead}>
                <HabitCheck
                  checked={doneToday}
                  label={`${c.name}: hecho hoy`}
                  onToggle={() => c.habitId && setTodayDoc((d) => ({ ...d, habits: { ...d.habits, [c.habitId!]: !d.habits[c.habitId!] } }))}
                />
                <span className={styles.name}>{c.name}</span>
                <span className={styles.count}>
                  <b className="num">{n}</b> / <span className="num">{c.target}</span>
                </span>
              </div>
              <Tally value={n} target={c.target} label={c.name} />
              <div className={styles.rowFoot}>
                <span className="caption">Mejor racha: <span className="num">{challengeBest(c, history)}</span></span>
                <button className={styles.linkBtn} onClick={() => confirm(`¿Archivar “${c.name}”?`) && patch(c.id, { archived: true })}>
                  <Archive aria-hidden /> Archivar
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <NewChallenge
        habits={settings.habits.filter((h) => h.active)}
        onAdd={(c) => {
          setChallenges((l) => [...l, c]);
          if (c.kind === "abstain") setMainId(c.id);
        }}
      />

      {timeline.length > 0 && main && (
        <>
          <h3 className="h-sec">Historial de {main.name.toLowerCase()}</h3>
          <ol className={styles.timeline}>
            {timeline.slice(0, 30).map((t, i) => (
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
    </div>
  );

  return <Pages id="retos" left={left} right={right} />;
}

function BrainPage({
  c,
  others,
  onPick,
  falling,
  setFalling,
  justFell,
  setJustFell,
  onPatch,
}: {
  c: Challenge;
  others: Challenge[];
  onPick: (id: string) => void;
  falling: boolean;
  setFalling: (v: boolean) => void;
  justFell: boolean;
  setJustFell: (v: boolean) => void;
  onPatch: (p: Partial<Challenge>) => void;
}) {
  const [what, setWhat] = useState("");
  const [triggers, setTriggers] = useState<string[]>([]);
  const [plan, setPlan] = useState("");
  const [won, setWon] = useState(false);
  const { days, hours } = abstainNow(c);
  const best = challengeBest(c, {});

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
    play("check");
    setWon(true);
    setTimeout(() => setWon(false), 1400);
  }

  return (
    <div className={styles.brainPage}>
      <div className={styles.brainHead}>
        <h1 className="h-page">{c.name}</h1>
        {others.length > 1 && (
          <div className={styles.picker}>
            {others.map((o) => (
              <button key={o.id} className="chip" aria-pressed={o.id === c.id} onClick={() => onPick(o.id)}>
                {o.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="quote" style={{ fontSize: "1rem" }}>{c.why}</p>

      <div className={styles.brainWrap}>
        <Brain filled={days} total={c.target} label={`${c.name}, cerebro de ${c.target} días`} />
      </div>

      <div className={styles.dayLine}>
        <span className={styles.days}>
          <b className="num">{days}</b> {days === 1 ? "día" : "días"} <span className="num">{hours} h</span>
        </span>
        <span className="caption">
          <span className="num">{Math.min(days, c.target)}</span> de <span className="num">{c.target}</span> celdas · mejor racha <span className="num">{best}</span> · <span className="num">{c.wins.length}</span> victorias
        </span>
      </div>
      <p className="caption" style={{ marginTop: 4 }}>Cada día limpio pinta una celda. Tu mente se va llenando de color otra vez.</p>

      <div className={styles.actions}>
        <button className="ink-btn" onClick={win}>
          <Check aria-hidden /> Vencí una tentación
        </button>
        <button className="ink-btn ghost" onClick={() => setFalling(!falling)} aria-expanded={falling}>
          <RotateCcw aria-hidden /> Caí
        </button>
        {won && <span className={styles.won} aria-live="polite">Victoria</span>}
      </div>

      {justFell && !falling && (
        <div className={styles.rise} role="status">
          <p className="quote">{RISE.text}</p>
          <p className="engraved"><Figs>{RISE.ref}</Figs></p>
          <p className="quote" style={{ marginTop: 10 }}>{CLEAN.text}</p>
          <p className="engraved"><Figs>{CLEAN.ref}</Figs></p>
          <p className={styles.riseNote}>El cerebro empieza otra vez desde hoy. Levántate.</p>
          <button className={styles.linkBtn} onClick={() => setJustFell(false)}>Entendido</button>
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
          <p className={styles.formLede}>Escríbelo con honestidad. No para castigarte: para entender qué lo provocó.</p>
          <label className="field">
            <span>¿Qué pasó?</span>
            <textarea className="box-input" rows={2} value={what} onChange={(e) => setWhat(e.target.value)} />
          </label>
          <fieldset className="field">
            <span>¿Qué lo provocó?</span>
            <div className={styles.chips}>
              {TRIGGERS.map((t) => (
                <button type="button" key={t} className="chip" aria-pressed={triggers.includes(t)} onClick={() => setTriggers((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))}>
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

      <div className={styles.target}>
        <label className="field" style={{ maxWidth: 130 }}>
          <span>Meta (días)</span>
          <input className="box-input num" type="number" min={10} max={365} value={c.target} onChange={(e) => onPatch({ target: Math.max(10, Math.min(365, Number(e.target.value) || 90)) })} />
        </label>
      </div>
    </div>
  );
}

function NewChallenge({ habits, onAdd }: { habits: { id: string; name: string }[]; onAdd: (c: Challenge) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [why, setWhy] = useState("");
  const [kind, setKind] = useState<"abstain" | "habit">("habit");
  const [habitId, setHabitId] = useState(habits[0]?.id ?? "");
  const [target, setTarget] = useState(30);

  if (!open) {
    return (
      <button className="ink-btn ghost" style={{ marginTop: 14 }} onClick={() => setOpen(true)}>
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
      <fieldset className="field">
        <span>Tipo</span>
        <div className={styles.chips}>
          <button type="button" className="chip" aria-pressed={kind === "habit"} onClick={() => setKind("habit")}>Cumplir un hábito</button>
          <button type="button" className="chip" aria-pressed={kind === "abstain"} onClick={() => setKind("abstain")}>Dejar algo (cerebro)</button>
        </div>
      </fieldset>
      <label className="field">
        <span>Nombre</span>
        <input className="box-input" value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "habit" ? "Ej. Leer 20 minutos" : "Ej. Sin redes de noche"} autoFocus />
      </label>
      <label className="field">
        <span>¿Por qué?</span>
        <input className="box-input" value={why} onChange={(e) => setWhy(e.target.value)} />
      </label>
      {kind === "habit" && (
        <label className="field">
          <span>Hábito que lo cuenta</span>
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
