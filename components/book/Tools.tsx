"use client";

import { useRef, useState } from "react";
import { Eraser, Hand, Highlighter, ImagePlus, PenLine } from "lucide-react";
import { STICKER_NODES, STICKER_SHEETS } from "../Stickers";
import { beginPlace, placeOnActivePage, type TapeStyle } from "./Deco";
import { INKS, useInk, useTool, type Tool } from "@/lib/book";
import styles from "./tools.module.css";

const TAPES: { style: TapeStyle; label: string }[] = [
  { style: "kraft", label: "Kraft" },
  { style: "black", label: "Negra" },
  { style: "red", label: "Tela roja" },
  { style: "linen", label: "Lino" },
];

const TOOLS: { id: Tool; label: string; icon: typeof PenLine }[] = [
  { id: "none", label: "Mover y escribir", icon: Hand },
  { id: "pen", label: "Pluma", icon: PenLine },
  { id: "marker", label: "Marcador", icon: Highlighter },
  { id: "eraser", label: "Borrador", icon: Eraser },
];

const rnd = (a: number) => Math.round((Math.random() - 0.5) * a);

async function resizeImage(file: File, max = 1000): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, err) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = err;
      i.src = url;
    });
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ToolPanel({ onDone }: { onDone?: () => void }) {
  const [tool, setTool] = useTool();
  const [ink, setInk] = useInk();
  const [sheet, setSheet] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.panel}>
      <section className={styles.card}>
        <h3 className={styles.h}>Pluma</h3>
        <div className={styles.tools} role="radiogroup" aria-label="Herramienta">
          {TOOLS.map((t) => {
            const I = t.icon;
            return (
              <button key={t.id} role="radio" aria-checked={tool === t.id} className={styles.tool} onClick={() => setTool(t.id)} title={t.label}>
                <I aria-hidden />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
        <div className={styles.inks} role="radiogroup" aria-label="Color de tinta">
          {INKS.map((c) => (
            <button
              key={c.id}
              role="radio"
              aria-checked={ink === c.color}
              className={styles.ink}
              style={{ background: c.color }}
              onClick={() => {
                setInk(c.color);
                if (tool === "none" || tool === "eraser") setTool("pen");
              }}
              title={c.label}
              aria-label={c.label}
            />
          ))}
        </div>
        {tool !== "none" && <p className={styles.note}>Dibuja o escribe sobre cualquier página. Toca la mano para volver a usar el cuaderno.</p>}
      </section>

      <section className={`${styles.card} ${styles.sheetCard}`}>
        <div className={styles.sheetTabs} role="tablist">
          {STICKER_SHEETS.map((s, i) => (
            <button key={s.name} role="tab" aria-selected={sheet === i} onClick={() => setSheet(i)}>
              {s.name}
            </button>
          ))}
        </div>
        <div className={styles.stickers}>
          {STICKER_SHEETS[sheet].kinds.map((k) => (
            <button
              key={k}
              className={styles.sticker}
              onPointerDown={(e) => !onDone && beginPlace(e, { type: "sticker", kind: k, rot: rnd(16), scale: 1 })}
              onClick={() => {
                if (!onDone) return;
                placeOnActivePage({ type: "sticker", kind: k, rot: rnd(16), scale: 1 });
                onDone();
              }}
              title="Arrastra a una página o toca para pegar"
            >
              {STICKER_NODES[k]}
            </button>
          ))}
        </div>
        <p className={styles.note}>{onDone ? "Toca una para pegarla en la página." : "Arrástralas a cualquier página o a la portada."}</p>
      </section>

      <section className={styles.card}>
        <h3 className={styles.h}>Cinta</h3>
        <div className={styles.rolls}>
          {TAPES.map((t) => (
            <button
              key={t.style}
              className={styles.roll}
              data-style={t.style}
              onPointerDown={(e) => !onDone && beginPlace(e, { type: "tape", style: t.style, len: 0.3, rot: rnd(14), scale: 1 })}
              onClick={() => {
                if (!onDone) return;
                placeOnActivePage({ type: "tape", style: t.style, len: 0.3, rot: rnd(14), scale: 1 });
                onDone();
              }}
              title={`Cinta ${t.label}: arrastra para cortar un trozo`}
            >
              <span className={styles.rollBody} aria-hidden>
                <i />
              </span>
              <span className={styles.rollTail} aria-hidden />
              <span className={styles.rollLabel}>{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <button className="ink-btn ghost" style={{ width: "100%" }} onClick={() => fileRef.current?.click()}>
          <ImagePlus aria-hidden /> Pegar una foto
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            const src = await resizeImage(f);
            placeOnActivePage({ type: "photo", src, w: 0.42, rot: rnd(10), scale: 1 });
            onDone?.();
          }}
        />
      </section>
    </div>
  );
}
