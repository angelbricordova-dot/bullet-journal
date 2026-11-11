"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Bullet, BulletKind, BulletState } from "@/lib/types";
import { uid } from "@/lib/date";
import styles from "./rapidlog.module.css";

const KIND_LABEL: Record<BulletKind, string> = { task: "Tarea", event: "Evento", note: "Nota" };
const STATE_LABEL: Record<BulletState, string> = {
  open: "pendiente",
  done: "hecha",
  migrated: "pasada a mañana",
  cancelled: "descartada",
};

const CYCLE: Record<BulletKind, BulletState[]> = {
  task: ["open", "done", "migrated", "cancelled"],
  event: ["open", "done", "cancelled"],
  note: ["open"],
};

export function Glyph({ kind, state }: { kind: BulletKind; state: BulletState }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden>
      {kind === "task" && state === "open" && <circle cx="10" cy="10" r="3.2" fill="currentColor" />}
      {kind === "task" && state === "cancelled" && <circle cx="10" cy="10" r="3.2" fill="currentColor" opacity=".45" />}
      {kind === "task" && state === "done" && <path d="M5.5 5.5 L14.5 14.5 M14.5 5.5 L5.5 14.5" {...common} />}
      {kind === "task" && state === "migrated" && <path d="M7 4.5 L13 10 L7 15.5" {...common} />}
      {kind === "event" && <circle cx="10" cy="10" r="4.6" {...common} strokeWidth={1.8} fill={state === "done" ? "currentColor" : "none"} />}
      {kind === "note" && <path d="M5 10 H15" {...common} />}
    </svg>
  );
}

export function RapidLog({
  items,
  onChange,
  onMigrate,
}: {
  items: Bullet[];
  onChange: (next: Bullet[]) => void;
  onMigrate: (b: Bullet) => void;
}) {
  const [kind, setKind] = useState<BulletKind>("task");
  const [draft, setDraft] = useState("");
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const newRef = useRef<HTMLInputElement>(null);

  function update(id: string, patch: Partial<Bullet>) {
    onChange(items.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function cycle(b: Bullet) {
    const states = CYCLE[b.kind];
    const next = states[(states.indexOf(b.state) + 1) % states.length];
    update(b.id, { state: next });
    if (next === "migrated") onMigrate(b);
  }

  function add() {
    const text = draft.trim();
    if (!text) return;
    onChange([...items, { id: uid(), kind, text, state: "open" }]);
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
      <ul className={`ruled ${styles.list}`}>
        {items.map((b) => (
          <li key={b.id} className={styles.item} data-state={b.state} data-kind={b.kind}>
            <button
              className={styles.glyph}
              onClick={() => cycle(b)}
              disabled={b.kind === "note"}
              aria-label={`${KIND_LABEL[b.kind]} ${STATE_LABEL[b.state]}. Cambiar estado`}
            >
              <Glyph kind={b.kind} state={b.state} />
            </button>
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
              aria-label={`${KIND_LABEL[b.kind]}`}
            />
            <button className={styles.del} onClick={() => remove(b.id)} aria-label="Borrar línea">
              <Trash2 />
            </button>
          </li>
        ))}

        <li className={`${styles.item} ${styles.new}`}>
          <button
            className={styles.glyph}
            onClick={() => setKind((k) => (k === "task" ? "event" : k === "event" ? "note" : "task"))}
            aria-label={`Tipo: ${KIND_LABEL[kind]}. Cambiar tipo`}
            title="Cambiar tipo: tarea, evento o nota"
          >
            <Glyph kind={kind} state="open" />
          </button>
          <input
            ref={newRef}
            className={styles.text}
            placeholder={kind === "task" ? "Nueva tarea…" : kind === "event" ? "Nuevo evento…" : "Nueva nota…"}
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
            aria-label="Nueva línea"
          />
        </li>
      </ul>

      <p className={styles.key}>
        <span><Glyph kind="task" state="open" /> tarea</span>
        <span><Glyph kind="event" state="open" /> evento</span>
        <span><Glyph kind="note" state="open" /> nota</span>
        <span><Glyph kind="task" state="done" /> hecha</span>
        <span><Glyph kind="task" state="migrated" /> a mañana</span>
      </p>
    </div>
  );
}
