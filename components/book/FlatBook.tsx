"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, BookmarkPlus, BookmarkX, LifeBuoy, MoreHorizontal, PenLine, X } from "lucide-react";
import { FaceCtx } from "../Pages";
import { SPREAD_LIST } from "./spreads";
import { SPREAD_COMPONENTS } from "./registry";
import { CoverFront } from "./Cover";
import { ToolPanel } from "./Tools";
import { useRibbonControl } from "./ribbon";
import { goSpread, useSpread, useTool } from "@/lib/book";
import { pageTurn, play } from "@/lib/sfx";
import { SoundToggle } from "../BookApp";
import styles from "./flat.module.css";

const MAIN = [1, 2, 3, 4, 5];
const MORE = [0, 6, 7, 8];

/** Phone: one page at a time, same notebook. */
export function FlatBook({ onSos }: { onSos: () => void }) {
  const [cur] = useSpread();
  const [tool, setTool] = useTool();
  const [sheet, setSheet] = useState<null | "tools" | "more">(null);
  const rib = useRibbonControl(cur);
  const scroller = useRef<HTMLDivElement>(null);
  const prevCur = useRef(cur);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    if (prevCur.current !== cur) {
      if (prevCur.current < 0) play("book-open");
      else if (cur < 0) play("book-close");
      else pageTurn(0.8);
      prevCur.current = cur;
    }
  }, [cur]);

  if (cur < 0) {
    return (
      <div className={styles.closed} onClick={() => goSpread(1)}>
        <div className={styles.closedCover}>
          <CoverFront active />
        </div>
      </div>
    );
  }

  const C = SPREAD_COMPONENTS[cur];
  const Icon = SPREAD_LIST[cur].icon;

  return (
    <div className={styles.flat}>
      <header className={styles.head}>
        <div className={styles.now}>
          <span className="engraved">Bitácora</span>
        </div>
        <button className="brass-btn" onClick={onSos}>
          <LifeBuoy aria-hidden /> Momento difícil
        </button>
      </header>

      <div className={styles.paper} key={cur}>
        <div ref={scroller} className={styles.scroll}>
          <p className={`engraved ${styles.where}`}>
            <Icon aria-hidden /> {SPREAD_LIST[cur].label}
          </p>
          <FaceCtx.Provider value={{ side: "both", active: true }}>
            <C />
          </FaceCtx.Provider>
        </div>
        {tool !== "none" && (
          <div className={styles.drawing}>
            <span>Dibujando sobre la página</span>
            <button className="ink-btn" onClick={() => setTool("none")}>
              Listo
            </button>
          </div>
        )}
      </div>

      <div className={styles.fabs}>
        <button className={styles.fab} onClick={() => setSheet("tools")} aria-label="Herramientas: pluma, texto, cinta y foto">
          <PenLine aria-hidden />
        </button>
      </div>

      <nav className={styles.nav} aria-label="Secciones">
        {MAIN.map((i) => {
          const s = SPREAD_LIST[i];
          const I = s.icon;
          return (
            <button key={s.key} aria-current={cur === i ? "page" : undefined} onClick={() => goSpread(i)}>
              <I aria-hidden />
              {s.label}
            </button>
          );
        })}
        <button aria-current={MORE.includes(cur) ? "page" : undefined} onClick={() => setSheet("more")}>
          <MoreHorizontal aria-hidden />
          Más
        </button>
      </nav>

      {sheet && (
        <div className={styles.sheetWrap} onClick={(e) => e.target === e.currentTarget && setSheet(null)}>
          <div className={styles.sheet} role="dialog" aria-modal="true">
            <button className={styles.sheetClose} onClick={() => setSheet(null)} aria-label="Cerrar">
              <X />
            </button>
            {sheet === "tools" ? (
              <ToolPanel compact onDone={() => setSheet(null)} />
            ) : (
              <ul className={styles.more}>
                {MORE.map((i) => {
                  const s = SPREAD_LIST[i];
                  const I = s.icon;
                  return (
                    <li key={s.key}>
                      <button
                        onClick={() => {
                          goSpread(i);
                          setSheet(null);
                        }}
                      >
                        <I aria-hidden />
                        <span>
                          <b>{s.label}</b>
                          <small>{s.hint}</small>
                        </span>
                      </button>
                    </li>
                  );
                })}
                <li>
                  <button
                    onClick={() => {
                      rib.toggle();
                      setSheet(null);
                    }}
                  >
                    {rib.here ? <BookmarkX aria-hidden /> : <BookmarkPlus aria-hidden />}
                    <span>
                      <b>{rib.here ? "Quitar marcapáginas" : "Marcar esta hoja"}</b>
                      <small>{rib.ribbon !== null && !rib.here ? `Ahora marca: ${SPREAD_LIST[rib.ribbon]?.label}` : "La cinta roja guarda tu lugar"}</small>
                    </span>
                  </button>
                </li>
                {rib.ribbon !== null && !rib.here && (
                  <li>
                    <button
                      onClick={() => {
                        goSpread(rib.ribbon!);
                        setSheet(null);
                      }}
                    >
                      <Bookmark aria-hidden />
                      <span>
                        <b>Ir a la hoja marcada</b>
                        <small>{SPREAD_LIST[rib.ribbon]?.label}</small>
                      </span>
                    </button>
                  </li>
                )}
                <li>
                  <SoundToggle className={styles.soundRow} />
                </li>
                <li>
                  <button
                    onClick={() => {
                      goSpread(-1);
                      setSheet(null);
                    }}
                  >
                    <X aria-hidden />
                    <span>
                      <b>Cerrar el cuaderno</b>
                      <small>Volver a la portada</small>
                    </span>
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
