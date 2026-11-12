"use client";

import { useRef, type ComponentType } from "react";
import {
  ArrowUpRight,
  Circle,
  Eraser,
  Hand,
  Highlighter,
  ImagePlus,
  Minus,
  PenLine,
  Pencil,
  Redo2,
  Square,
  StickyNote,
  Type,
  Undo2,
} from "lucide-react";
import { placeOnActivePage } from "./Deco";
import { HIGHLIGHTS, INKS, SIZES, useHighlight, useInk, useSize, useTapeStyle, useTool, type TapeStyle, type Tool } from "@/lib/book";
import { redo, undo, useHistory } from "@/lib/client-store";
import { play } from "@/lib/sfx";
import styles from "./tools.module.css";

const TAPES: { style: TapeStyle; label: string }[] = [
  { style: "kraft", label: "Kraft" },
  { style: "black", label: "Negra" },
  { style: "red", label: "Tela roja" },
  { style: "linen", label: "Lino" },
  { style: "clear", label: "Mate" },
];

function TapeIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="10" cy="11" r="7" />
      <circle cx="10" cy="11" r="2.6" />
      <path d="M17 11 V20 L19 18.5 L21 20 V11" />
    </svg>
  );
}

const GROUPS: { id: Tool; label: string; icon: ComponentType<{ className?: string }> }[][] = [
  [{ id: "none", label: "Usar el cuaderno", icon: Hand }],
  [
    { id: "pen", label: "Pluma", icon: PenLine },
    { id: "pencil", label: "Lápiz", icon: Pencil },
    { id: "marker", label: "Resaltador", icon: Highlighter },
  ],
  [
    { id: "line", label: "Línea", icon: Minus },
    { id: "arrow", label: "Flecha", icon: ArrowUpRight },
    { id: "rect", label: "Rectángulo", icon: Square },
    { id: "ellipse", label: "Círculo", icon: Circle },
  ],
  [
    { id: "text", label: "Texto", icon: Type },
    { id: "note", label: "Nota adhesiva", icon: StickyNote },
    { id: "tape", label: "Cinta", icon: TapeIcon },
    { id: "eraser", label: "Borrador", icon: Eraser },
  ],
];

const HINT: Partial<Record<Tool, string>> = {
  pen: "Escribe o dibuja sobre cualquier página.",
  pencil: "Trazo fino de grafito.",
  marker: "Subraya o resalta lo importante.",
  line: "Arrastra para trazar. Mayús para recta.",
  arrow: "Arrastra para trazar una flecha.",
  rect: "Arrastra para enmarcar.",
  ellipse: "Arrastra para encerrar en un círculo.",
  text: "Toca donde quieras escribir.",
  note: "Toca para pegar una nota.",
  tape: "Estira la cinta sobre la página: arrastra de un extremo al otro.",
  eraser: "Pasa por encima de los trazos.",
};

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

export function ToolPanel({ onDone, compact }: { onDone?: () => void; compact?: boolean }) {
  const [tool, setTool] = useTool();
  const [ink, setInk] = useInk();
  const [hl, setHl] = useHighlight();
  const [size, setSize] = useSize();
  const [tape, setTape] = useTapeStyle();
  const hist = useHistory();
  const [nu, nr] = hist.split(":").map(Number);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = (t: Tool) => setTool(t);

  const showInk = ["pen", "pencil", "line", "arrow", "rect", "ellipse", "text"].includes(tool);
  const showSize = ["pen", "pencil", "marker", "line", "arrow", "rect", "ellipse"].includes(tool);

  return (
    <div className={styles.panel} data-compact={compact || undefined}>
      <div className={styles.rail} role="toolbar" aria-label="Herramientas">
        {GROUPS.map((g, gi) => (
          <div key={gi} className={styles.group}>
            {g.map((t) => {
              const I = t.icon;
              return (
                <button
                  key={t.id}
                  className={styles.tool}
                  aria-pressed={tool === t.id}
                  onClick={() => pick(t.id)}
                  title={t.label}
                  aria-label={t.label}
                >
                  <I className={styles.icon} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        ))}
        <div className={styles.group}>
          <button className={styles.tool} onClick={() => fileRef.current?.click()} title="Pegar una foto" aria-label="Pegar una foto">
            <ImagePlus className={styles.icon} />
            <span>Foto</span>
          </button>
          <button className={styles.tool} onClick={() => undo() && play("paper-place", { volume: 0.4 })} disabled={!nu} title="Deshacer (Ctrl+Z)" aria-label="Deshacer">
            <Undo2 className={styles.icon} />
            <span>Deshacer</span>
          </button>
          <button className={styles.tool} onClick={() => redo() && play("paper-place", { volume: 0.4 })} disabled={!nr} title="Rehacer (Ctrl+Shift+Z)" aria-label="Rehacer">
            <Redo2 className={styles.icon} />
            <span>Rehacer</span>
          </button>
        </div>
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
            placeOnActivePage({ type: "photo", src, w: 0.42, rot: Math.round((Math.random() - 0.5) * 10), scale: 1 });
            onDone?.();
          }}
        />
      </div>

      {tool !== "none" && (
        <div className={styles.options}>
          {HINT[tool] && <p className={styles.hint}>{HINT[tool]}</p>}
          {showInk && (
            <div className={styles.swatches} role="radiogroup" aria-label="Color">
              {INKS.map((c) => (
                <button key={c.id} role="radio" aria-checked={ink === c.color} className={styles.swatch} style={{ background: c.color }} onClick={() => setInk(c.color)} title={c.label} aria-label={c.label} />
              ))}
            </div>
          )}
          {tool === "marker" && (
            <div className={styles.swatches} role="radiogroup" aria-label="Color del resaltador">
              {HIGHLIGHTS.map((c) => (
                <button key={c.id} role="radio" aria-checked={hl === c.color} className={styles.swatch} style={{ background: c.color }} onClick={() => setHl(c.color)} title={c.label} aria-label={c.label} />
              ))}
            </div>
          )}
          {showSize && (
            <div className={styles.sizes} role="radiogroup" aria-label="Grosor">
              {SIZES.map((s) => (
                <button key={s.id} role="radio" aria-checked={size === s.id} onClick={() => setSize(s.id)} title={s.label}>
                  <i style={{ width: 4 + s.id * 4, height: 4 + s.id * 4 }} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          )}
          {tool === "tape" && (
            <div className={styles.rolls} role="radiogroup" aria-label="Tipo de cinta">
              {TAPES.map((t) => (
                <button key={t.style} role="radio" aria-checked={tape === t.style} className={styles.roll} data-style={t.style} onClick={() => setTape(t.style)}>
                  <span className={styles.rollBody} aria-hidden>
                    <i />
                  </span>
                  <span className={styles.rollLabel}>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
