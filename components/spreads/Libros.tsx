"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Pages } from "@/components/Pages";
import { useDoc } from "@/lib/client-store";
import { shortDate, todayYmd, uid } from "@/lib/date";
import styles from "./libros.module.css";

interface Book {
  id: string;
  title: string;
  author: string;
  status: "reading" | "done" | "next";
  started?: string;
  finished?: string;
  note?: string;
}

const STATUS: Record<Book["status"], string> = { reading: "Leyendo", done: "Terminado", next: "Por leer" };

interface NotesDoc {
  title: string;
  text: string;
}

export function LibrosSpread() {
  const [books, setBooks] = useDoc<Book[]>("books", []);
  const [notes, setNotes] = useDoc<NotesDoc>("notes:free", { title: "Notas", text: "" });
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  const order = { reading: 0, next: 1, done: 2 } as const;
  const list = [...books].sort((a, b) => order[a.status] - order[b.status]);

  function patch(id: string, p: Partial<Book>) {
    setBooks((l) => l.map((b) => (b.id === id ? { ...b, ...p } : b)));
  }

  const left = (
    <div>
      <h1 className="h-page">Libros</h1>
      <p className="caption" style={{ margin: "6px 0 12px" }}>
        Título, autor y fechas. Lo que entra en tu mente te forma.
      </p>
      <div className={styles.head} aria-hidden>
        <span>Título</span>
        <span>Fecha</span>
      </div>
      <ul className={styles.list}>
        {list.map((b) => (
          <li key={b.id} data-status={b.status}>
            <div className={styles.main}>
              <input className={`ink-input ${styles.title}`} value={b.title} onChange={(e) => patch(b.id, { title: e.target.value })} aria-label="Título" />
              <input className={`ink-input ${styles.author}`} value={b.author} placeholder="Autor" onChange={(e) => patch(b.id, { author: e.target.value })} aria-label="Autor" />
            </div>
            <div className={styles.side}>
              <select
                className={styles.status}
                value={b.status}
                onChange={(e) => {
                  const s = e.target.value as Book["status"];
                  patch(b.id, {
                    status: s,
                    started: s === "reading" && !b.started ? todayYmd() : b.started,
                    finished: s === "done" ? todayYmd() : undefined,
                  });
                }}
                aria-label={`Estado de ${b.title}`}
              >
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <span className="num caption">
                {b.finished ? shortDate(b.finished) : b.started ? `desde ${shortDate(b.started)}` : ""}
              </span>
            </div>
            <button className="icon-btn" onClick={() => confirm(`¿Quitar “${b.title}”?`) && setBooks((l) => l.filter((x) => x.id !== b.id))} aria-label={`Quitar ${b.title}`}>
              <Trash2 />
            </button>
          </li>
        ))}
        {books.length === 0 && <li className="caption">Empieza con la Biblia y un libro que te haga mejor hombre.</li>}
      </ul>
      <form
        className={styles.add}
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          setBooks((l) => [...l, { id: uid(), title: title.trim(), author: author.trim(), status: "reading", started: todayYmd() }]);
          setTitle("");
          setAuthor("");
        }}
      >
        <input className="box-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" aria-label="Título del libro" />
        <input className="box-input" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Autor" aria-label="Autor del libro" />
        <button className="ink-btn" type="submit" aria-label="Agregar libro">
          <Plus aria-hidden />
        </button>
      </form>
    </div>
  );

  const right = (
    <div className={styles.free}>
      <input className={`h-page ${styles.freeTitle}`} value={notes.title} onChange={(e) => setNotes({ ...notes, title: e.target.value })} aria-label="Título de la hoja" />
      <textarea
        className={`ruled ${styles.freeText}`}
        value={notes.text}
        onChange={(e) => setNotes({ ...notes, title: notes.title, text: e.target.value })}
        placeholder="Hoja libre: relaciones, ideas, oraciones largas, lo que sea. También puedes dibujar encima con la pluma."
        aria-label="Hoja libre"
      />
    </div>
  );

  return <Pages id="libros" left={left} right={right} />;
}
