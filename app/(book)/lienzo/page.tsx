"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { FullPage } from "@/components/Pages";
import { useDoc } from "@/lib/client-store";
import { uid } from "@/lib/date";
import type { BoardMeta } from "@/lib/types";
import styles from "./lienzo.module.css";

const Board = dynamic(() => import("./Board"), {
  ssr: false,
  loading: () => <p className="caption" style={{ padding: 24 }}>Abriendo el lienzo…</p>,
});

const DEFAULT_BOARDS: BoardMeta[] = [{ id: "main", name: "Lienzo libre", updated: "2026-11-11" }];

export default function LienzoPage() {
  const [boards, setBoards] = useDoc<BoardMeta[]>("boards", DEFAULT_BOARDS);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const current = boards.find((b) => b.id === currentId) ?? boards[0];

  function create() {
    const name = prompt("Nombre del nuevo tablero", "Ideas");
    if (!name?.trim()) return;
    const b = { id: uid(), name: name.trim(), updated: new Date().toISOString().slice(0, 10) };
    setBoards((l) => [...l, b]);
    setCurrentId(b.id);
  }

  function rename() {
    if (!current) return;
    const name = prompt("Nuevo nombre", current.name);
    if (!name?.trim()) return;
    setBoards((l) => l.map((b) => (b.id === current.id ? { ...b, name: name.trim() } : b)));
  }

  async function remove() {
    if (!current || boards.length <= 1) return;
    if (!confirm(`¿Borrar el tablero “${current.name}” y todo lo que tiene?`)) return;
    await fetch(`/api/data?key=${encodeURIComponent(`board:${current.id}`)}`, { method: "DELETE" });
    setBoards((l) => l.filter((b) => b.id !== current.id));
    setCurrentId(null);
  }

  return (
    <FullPage>
      <div className={styles.wrap}>
        <header className={styles.bar}>
          <h1 className={`engraved ${styles.title}`}>Lienzo</h1>
          <div className={styles.boards} role="tablist" aria-label="Tableros">
            {boards.map((b) => (
              <button key={b.id} role="tab" aria-selected={b.id === current?.id} className="chip" onClick={() => setCurrentId(b.id)}>
                {b.name}
              </button>
            ))}
          </div>
          <div className={styles.tools}>
            <button className="icon-btn" onClick={create} aria-label="Nuevo tablero" title="Nuevo tablero">
              <Plus />
            </button>
            <button className="icon-btn" onClick={rename} aria-label="Renombrar tablero" title="Renombrar">
              <Pencil />
            </button>
            <button className="icon-btn" onClick={remove} disabled={boards.length <= 1} aria-label="Borrar tablero" title="Borrar tablero">
              <Trash2 />
            </button>
          </div>
        </header>
        <div className={styles.canvas}>{current && <Board key={current.id} id={current.id} />}</div>
      </div>
    </FullPage>
  );
}
