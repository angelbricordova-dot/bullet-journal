"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, LogOut, Plus, Trash2, Upload } from "lucide-react";
import { Pages } from "@/components/Pages";
import { useSettings } from "@/lib/hooks";
import { flushAll } from "@/lib/client-store";
import { uid } from "@/lib/date";
import type { CoverColor, Habit, PaperStyle, Settings } from "@/lib/types";
import styles from "./ajustes.module.css";

const COVERS: { id: CoverColor; label: string }[] = [
  { id: "oxblood", label: "Vino" },
  { id: "saddle", label: "Silla de montar" },
  { id: "black", label: "Negro" },
  { id: "green", label: "Verde inglés" },
];
const PAPERS: { id: PaperStyle; label: string }[] = [
  { id: "ruled", label: "Rayado" },
  { id: "dots", label: "Punteado" },
  { id: "grid", label: "Cuadriculado" },
  { id: "plain", label: "Liso" },
];

export default function AjustesPage() {
  const [s, setS] = useSettings();
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (p: Partial<Settings>) => setS((prev) => ({ ...prev, ...p }));
  const setHabits = (f: (h: Habit[]) => Habit[]) => setS((prev) => ({ ...prev, habits: f(prev.habits) }));

  async function restore(file: File) {
    try {
      const body = JSON.parse(await file.text());
      if (!confirm("Esto reemplazará los datos que coincidan con la copia. ¿Continuar?")) return;
      const res = await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      try {
        Object.keys(localStorage).filter((k) => k.startsWith("bitacora:")).forEach((k) => localStorage.removeItem(k));
      } catch {}
      setMsg(`Restaurado: ${j.restored} documentos. Recargando…`);
      setTimeout(() => location.reload(), 900);
    } catch {
      setMsg("Ese archivo no es una copia válida de Bitácora.");
    }
  }

  async function logout() {
    flushAll();
    await fetch("/api/logout", { method: "POST" });
    location.href = "/login";
  }

  const left = (
    <div>
      <h1 className="h-page">Ajustes</h1>

      <h2 className="h-sec">Portada</h2>
      <div className={styles.swatches} role="radiogroup" aria-label="Color del cuero">
        {COVERS.map((c) => (
          <button key={c.id} role="radio" aria-checked={s.cover === c.id} className={styles.swatch} data-cover={c.id} onClick={() => set({ cover: c.id })}>
            <i aria-hidden />
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      <h2 className="h-sec">Papel</h2>
      <div className={styles.papers} role="radiogroup" aria-label="Tipo de papel">
        {PAPERS.map((p) => (
          <button key={p.id} role="radio" aria-checked={s.paper === p.id} className={styles.paper} data-paper-sample={p.id} onClick={() => set({ paper: p.id })}>
            <i aria-hidden />
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      <h2 className="h-sec">Dueño</h2>
      <div className={styles.grid2}>
        <label className="field">
          <span>Nombre</span>
          <input className="box-input" value={s.owner} onChange={(e) => set({ owner: e.target.value })} />
        </label>
        <label className="field">
          <span>Día 1 del cambio</span>
          <input className="box-input num" type="date" value={s.startDate} onChange={(e) => e.target.value && set({ startDate: e.target.value })} />
        </label>
      </div>

      <h2 className="h-sec">Copia de seguridad</h2>
      <p className={styles.note}>Descarga todo tu cuaderno en un archivo. Guárdalo en un lugar seguro una vez al mes.</p>
      <div className={styles.row}>
        <a className="ink-btn ghost" href="/api/backup" download>
          <Download aria-hidden /> Descargar copia
        </a>
        <button className="ink-btn ghost" onClick={() => fileRef.current?.click()}>
          <Upload aria-hidden /> Restaurar
        </button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} />
      </div>
      {msg && <p className={styles.note} role="status">{msg}</p>}

      <h2 className="h-sec">Sesión</h2>
      <p className={styles.note}>La contraseña se cambia en Vercel, en la variable APP_PASSWORD.</p>
      <button className="ink-btn ghost" onClick={logout}>
        <LogOut aria-hidden /> Cerrar el cuaderno
      </button>
    </div>
  );

  const right = (
    <div>
      <h2 className="h-sec">Hábitos diarios</h2>
      <ul className={styles.habits}>
        {s.habits.map((h, i) => (
          <li key={h.id} data-off={!h.active || undefined}>
            <label className={styles.toggle} title={h.active ? "Activo" : "En pausa"}>
              <input type="checkbox" checked={h.active} onChange={() => setHabits((l) => l.map((x) => (x.id === h.id ? { ...x, active: !x.active } : x)))} />
              <span aria-hidden />
              <span className="sr-only">Activo</span>
            </label>
            <div className={styles.hFields}>
              <input className="ink-input" value={h.name} onChange={(e) => setHabits((l) => l.map((x) => (x.id === h.id ? { ...x, name: e.target.value } : x)))} aria-label="Nombre del hábito" />
              <input className={`ink-input ${styles.hint}`} value={h.hint ?? ""} placeholder="Nota corta (opcional)" onChange={(e) => setHabits((l) => l.map((x) => (x.id === h.id ? { ...x, hint: e.target.value } : x)))} aria-label="Nota del hábito" />
            </div>
            <div className={styles.hActions}>
              <button className="icon-btn" disabled={i === 0} onClick={() => setHabits((l) => swap(l, i, i - 1))} aria-label="Subir">
                <ArrowUp />
              </button>
              <button className="icon-btn" disabled={i === s.habits.length - 1} onClick={() => setHabits((l) => swap(l, i, i + 1))} aria-label="Bajar">
                <ArrowDown />
              </button>
              <button className="icon-btn" onClick={() => confirm(`¿Borrar “${h.name}”? Su historial deja de contarse.`) && setHabits((l) => l.filter((x) => x.id !== h.id))} aria-label="Borrar hábito">
                <Trash2 />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button className="ink-btn ghost" onClick={() => setHabits((l) => [...l, { id: uid(), name: "Nuevo hábito", active: true }])}>
        <Plus aria-hidden /> Agregar hábito
      </button>

      <h2 className="h-sec">Mis razones</h2>
      <p className={styles.note}>Aparecen en el botón de “Momento difícil”.</p>
      <ListEditor items={s.reasons} onChange={(reasons) => set({ reasons })} placeholder="Una razón para cambiar" addLabel="Agregar razón" />

      <h2 className="h-sec">Fechas importantes</h2>
      <ul className={styles.dates}>
        {s.dates.map((d) => (
          <li key={d.id}>
            <input className="box-input" value={d.label} onChange={(e) => set({ dates: s.dates.map((x) => (x.id === d.id ? { ...x, label: e.target.value } : x)) })} aria-label="Nombre de la fecha" />
            <input
              className="box-input num"
              type="date"
              value={d.date.length === 5 ? `2026-${d.date}` : d.date}
              onChange={(e) => e.target.value && set({ dates: s.dates.map((x) => (x.id === d.id ? { ...x, date: x.date.length === 5 ? e.target.value.slice(5) : e.target.value } : x)) })}
              aria-label="Fecha"
            />
            <label className={styles.yearly}>
              <input
                type="checkbox"
                checked={d.date.length === 5}
                onChange={(e) =>
                  set({
                    dates: s.dates.map((x) =>
                      x.id === d.id ? { ...x, date: e.target.checked ? x.date.slice(-5) : `${new Date().getFullYear()}-${x.date.slice(-5)}` } : x,
                    ),
                  })
                }
              />
              Cada año
            </label>
            <button className="icon-btn" onClick={() => set({ dates: s.dates.filter((x) => x.id !== d.id) })} aria-label={`Borrar ${d.label}`}>
              <Trash2 />
            </button>
          </li>
        ))}
      </ul>
      <button className="ink-btn ghost" onClick={() => set({ dates: [...s.dates, { id: uid(), label: "Nueva fecha", date: new Date().toISOString().slice(5, 10) }] })}>
        <Plus aria-hidden /> Agregar fecha
      </button>
    </div>
  );

  return <Pages left={left} right={right} />;
}

function swap<T>(l: T[], a: number, b: number): T[] {
  const c = [...l];
  [c[a], c[b]] = [c[b], c[a]];
  return c;
}

function ListEditor({ items, onChange, placeholder, addLabel }: { items: string[]; onChange: (l: string[]) => void; placeholder: string; addLabel: string }) {
  return (
    <>
      <ol className={styles.reasons}>
        {items.map((r, i) => (
          <li key={i}>
            <textarea
              className="box-input"
              rows={2}
              value={r}
              placeholder={placeholder}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
              aria-label={`Razón ${i + 1}`}
            />
            <button className="icon-btn" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Borrar razón ${i + 1}`}>
              <Trash2 />
            </button>
          </li>
        ))}
      </ol>
      <button className="ink-btn ghost" onClick={() => onChange([...items, ""])}>
        <Plus aria-hidden /> {addLabel}
      </button>
    </>
  );
}
