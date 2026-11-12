"use client";

import { useRef, useState } from "react";
import { CornerDownRight, Plus, Trash2 } from "lucide-react";
import type { Bullet, BulletKind, BulletState } from "@/lib/types";
import { uid } from "@/lib/date";
import { play } from "@/lib/sfx";
import styles from "./rapidlog.module.css";

export function Glyph({ kind, state }: { kind: BulletKind; state: BulletState }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden>
      {kind === "event" && <circle cx="10" cy="10" r="4.6" {...common} strokeWidth={1.8} fill={state === "done" ? "currentColor" : "none"} />}
      {kind === "note" && <path d="M5 10 H15" {...common} />}
    </svg>
  );
}

/** Today's to-do list: tick it, push it to tomorrow, or drop it. */
export function RapidLog({
  items,
  onChange,
  onMigrate,
}: {
  items: Bullet[];
  onChange: (next: Bullet[]) => void;
  onMigrate: (b: Bullet) => void;
}) {
  const [draft, setDraft] = useState("");
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const newRef = useRef<HTMLInputElement>(null);

  const open = items.filter((b) => b.kind === "task" && b.state === "open").length;
  const done = items.filter((b) => b.kind === "task" && b.state === "done").length;

  function update(id: string, patch: Partial<Bullet>) {
    onChange(items.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function add() {
    const text = draft.trim();
    if (!text) return;
    onChange([...items, { id: uid(), kind: "task", text, state: "open" }]);
    setDraft("");
  }

  function remove(id: string, focusPrev = false) {
    const idx = items.findIndex((b) => b.id === id);
    onChange(items.filter((b) => b.id !== id));
    if (focusPrev) {
      const prev = items[idx - 1];
      setTimeout(() => (prev ? refs.current[prev.id]?.focus() : newRef.current?.focus()), 0);
    }
  }

  return (
    <div className={styles.log}>
      {(open > 0 || done > 0) && (
        <p className={styles.count}>
          <b className="num">{done}</b> de <span className="num">{open + done}</span> hechas
        </p>
      )}
      <ul className={`ruled ${styles.list}`}>
        {items.map((b) => {
          const task = b.kind === "task";
          return (
            <li key={b.id} className={styles.item} data-state={b.state} data-kind={b.kind}>
              {task ? (
                <button
                  role="checkbox"
                  aria-checked={b.state === "done"}
                  className={styles.box}
                  disabled={b.state === "migrated"}
                  onClick={() => {
                    const next = b.state === "done" ? "open" : "done";
                    if (next === "done") play("check");
                    update(b.id, { state: next });
                  }}
                  aria-label={b.state === "done" ? `Desmarcar: ${b.text}` : `Marcar hecho: ${b.text}`}
                >
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path d="M5 12.5 L10 17.5 L19.5 6.5" />
                  </svg>
                </button>
              ) : (
                <span className={styles.glyph}>
                  <Glyph kind={b.kind} state={b.state} />
                </span>
              )}
              <input
                ref={(el) => {
                  refs.current[b.id] = el;
                }}
                className={styles.text}
                value={b.text}
                onChange={(e) => update(b.id, { text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    newRef.current?.focus();
                  }
                  if (e.key === "Backspace" && b.text === "") {
                    e.preventDefault();
                    remove(b.id, true);
                  }
                }}
                aria-label="Pendiente"
              />
              {b.state === "migrated" ? (
                <span className={styles.moved}>en mañana</span>
              ) : (
                task &&
                b.state === "open" && (
                  <button
                    className={styles.act}
                    onClick={() => {
                      update(b.id, { state: "migrated" });
                      onMigrate(b);
                      play("ribbon", { volume: 0.5 });
                    }}
                    title="Pasar a mañana"
                    aria-label={`Pasar a mañana: ${b.text}`}
                  >
                    <CornerDownRight />
                  </button>
                )
              )}
              <button className={styles.act} onClick={() => remove(b.id)} aria-label={`Borrar: ${b.text}`} title="Borrar">
                <Trash2 />
              </button>
            </li>
          );
        })}

        <li className={`${styles.item} ${styles.new}`}>
          <span className={styles.plus} aria-hidden>
            <Plus />
          </span>
          <input
            ref={newRef}
            className={styles.text}
            placeholder="Agregar pendiente…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            onBlur={add}
            enterKeyHint="enter"
            aria-label="Nuevo pendiente"
          />
        </li>
      </ul>
    </div>
  );
}
