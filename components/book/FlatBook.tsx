"use client";

import { useEffect, useRef, useState } from "react";
import { LifeBuoy, MoreHorizontal, PenLine, Stamp, X } from "lucide-react";
import { FaceCtx } from "../Pages";
import { Figs } from "../Figs";
import { SPREAD_LIST } from "./spreads";
import { SPREAD_COMPONENTS } from "./registry";
import { CoverFront } from "./Cover";
import { ToolPanel } from "./Tools";
import { goSpread, useSpread, useTool } from "@/lib/book";
import { nowInfo } from "@/lib/month";
import styles from "./flat.module.css";

const MAIN = [1, 2, 3, 4, 5];
const MORE = [0, 6, 7, 8];

/** Phone: one page at a time, same notebook. */
export function FlatBook({ onSos }: { onSos: () => void }) {
  const [cur] = useSpread();
  const [tool, setTool] = useTool();
  const [sheet, setSheet] = useState<null | "tools" | "more">(null);
  const scroller = useRef<HTMLDivElement>(null);
  const n = nowInfo();

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
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
          <span className="engraved">
            {n.month} <Figs>{String(n.year)}</Figs>
          </span>
          <span className={styles.left}>
            <b className="num">{n.monthLeft}</b> días quedan
          </span>
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
        <button className={styles.fab} onClick={() => setSheet("tools")} aria-label="Pluma, pegatinas y cinta">
          <PenLine aria-hidden />
          <Stamp aria-hidden />
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
              <ToolPanel onDone={() => setSheet(null)} />
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
