"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Timer, X } from "lucide-react";
import { useChallenges, useSettings } from "@/lib/hooks";
import { SOS_ACTIONS } from "@/lib/defaults";
import { VERSES } from "@/lib/verses";
import { pickRandom } from "@/lib/random";
import { Figs } from "./Figs";
import styles from "./sos.module.css";

const WAIT = 10 * 60; // seconds

export function SosSheet({ onClose }: { onClose: () => void }) {
  const [settings] = useSettings();
  const [challenges, setChallenges] = useChallenges();
  const abstain = challenges.filter((c) => c.kind === "abstain" && !c.archived);
  const [target, setTarget] = useState(abstain[0]?.id ?? "");
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [left, setLeft] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [verse] = useState(() => pickRandom(VERSES.filter((v) => v.tags.includes("pureza") || v.tags.includes("fuerza"))));

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = setTimeout(() => setLeft((s) => (s ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  function victory() {
    if (target) {
      const now = new Date().toISOString();
      setChallenges((list) => list.map((c) => (c.id === target ? { ...c, wins: [...c.wins, now] } : c)));
    }
    setWon(true);
    setTimeout(onClose, 1600);
  }

  const mm = left === null ? 10 : Math.floor(left / 60);
  const ss = left === null ? 0 : left % 60;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="sos-title" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet}>
        <button ref={closeRef} className={styles.close} onClick={onClose} aria-label="Cerrar">
          <X />
        </button>

        <h2 id="sos-title" className={styles.title}>Respira. Esto pasa.</h2>
        <p className={styles.lead}>
          Las ganas suben y bajan como una ola. No tienes que ganarle para siempre: solo los próximos diez minutos.
        </p>

        <figure className={styles.verse}>
          <blockquote className="quote">{verse.text}</blockquote>
          <figcaption className="engraved"><Figs>{verse.ref}</Figs></figcaption>
        </figure>

        <div className={styles.grid}>
          <section>
            <h3 className={styles.h3}>Haz una de estas, ahora</h3>
            <ul className={styles.actions}>
              {SOS_ACTIONS.map((a, i) => (
                <li key={i}>
                  <button
                    role="checkbox"
                    aria-checked={!!done[i]}
                    className="check"
                    onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
                    aria-label={a}
                  >
                    <svg viewBox="0 0 30 30" aria-hidden>
                      <path d="M6 6 L24 24" />
                      <path d="M24 6 L6 24" />
                    </svg>
                  </button>
                  <span data-done={!!done[i] || undefined}>{a}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className={styles.h3}>Por qué estás cambiando</h3>
            <ol className={styles.reasons}>
              {settings.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>

            <div className={styles.timer}>
              <span className={`num ${styles.clock}`} aria-live="off">
                {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
              </span>
              {left === null ? (
                <button className="ink-btn ghost" onClick={() => setLeft(WAIT)}>
                  <Timer aria-hidden /> Aguantar 10 minutos
                </button>
              ) : left === 0 ? (
                <span className={styles.timerDone}>Lo lograste. La ola pasó.</span>
              ) : (
                <span className="caption">Sigue. Muévete, ora, sal del cuarto.</span>
              )}
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          {abstain.length > 1 && (
            <label className={styles.which}>
              <span>Reto</span>
              <select className="box-input" value={target} onChange={(e) => setTarget(e.target.value)}>
                {abstain.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          )}
          <button className="ink-btn" onClick={victory} disabled={won}>
            <Check aria-hidden /> Vencí esta tentación
          </button>
        </footer>

        {won && (
          <div className={styles.stampWrap} aria-live="assertive">
            <span className={`stamp ${styles.bigStamp}`}>Victoria</span>
          </div>
        )}
      </div>
    </div>
  );
}
