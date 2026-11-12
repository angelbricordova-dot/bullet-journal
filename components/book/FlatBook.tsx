"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Bookmark, BookmarkPlus, BookmarkX, Menu, PenLine, X } from "lucide-react";
import { FaceCtx } from "../Pages";
import { SPREAD_LIST } from "./spreads";
import { SPREAD_COMPONENTS } from "./registry";
import { CoverFront } from "./Cover";
import { ToolPanel } from "./Tools";
import { useRibbonControl } from "./ribbon";
import { flipUp } from "./flipUp";
import { goSpread, useSpread, useTool } from "@/lib/book";
import { pageTurn, play } from "@/lib/sfx";
import { SoundToggle } from "../BookApp";
import styles from "./flat.module.css";

const LAST = SPREAD_LIST.length - 1;
const TABS = [
  { i: 1, label: "Hoy" },
  { i: 2, label: "Mes" },
  { i: 3, label: "Trackers" },
  { i: 4, label: "Retos" },
  { i: 5, label: "Vida" },
  { i: 6, label: "Fe" },
];
const MORE = [0, 7, 8];
const RINGS = 9;

/**
 * Phone: a top-bound pad. Brass rings at the top, full-width paper, a
 * swipe turns the sheet up over the rings, leather tabs along the bottom.
 */
export function FlatBook() {
  const [cur] = useSpread();
  const [tool, setTool] = useTool();
  const [sheet, setSheet] = useState<null | "tools" | "more">(null);
  const rib = useRibbonControl(cur);
  const pad = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const prevCur = useRef(cur);
  const busy = useRef(false);
  const pendingBack = useRef(false);
  const [nudge, setNudge] = useState(0);

  const shut = cur < 0 || cur > LAST;

  /** Turn to another sheet. Forward lifts the current sheet away; back lowers the earlier one. */
  async function turnTo(target: number) {
    if (busy.current || target === cur || target < 0 || target > LAST) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !pad.current || !page.current || cur < 0) {
      goSpread(target);
      return;
    }
    busy.current = true;
    if (target > cur) {
      const p = flipUp(pad.current, page.current, 0, 1);
      goSpread(target);
      await p;
      busy.current = false;
    } else {
      pendingBack.current = true;
      goSpread(target); // the earlier sheet falls back onto the pad (see the layout effect)
    }
  }

  // sounds, scroll reset, and the falling sheet when going back
  useLayoutEffect(() => {
    if (prevCur.current === cur) return;
    const was = prevCur.current;
    prevCur.current = cur;
    scroller.current?.scrollTo({ top: 0 });
    if (was < 0 || was > LAST) play("book-open");
    else if (cur < 0 || cur > LAST) play("book-close");
    else pageTurn(0.8);
    if (pendingBack.current && pad.current && page.current) {
      pendingBack.current = false;
      const el = page.current;
      el.style.visibility = "hidden";
      void flipUp(pad.current, el, 1, 0).then(() => {
        el.style.visibility = "";
        busy.current = false;
      });
    } else busy.current = false;
  }, [cur]);

  // swipe sideways to turn
  useEffect(() => {
    const el = page.current;
    if (!el) return;
    let sx = 0;
    let sy = 0;
    let tracking = false;
    let horizontal: boolean | null = null;
    const start = (e: TouchEvent) => {
      const t = e.target as HTMLElement;
      if (tool !== "none" || e.touches.length !== 1 || t.closest("input, textarea, select, canvas, [data-cell], [data-item-id], [data-no-swipe]")) {
        tracking = false;
        return;
      }
      tracking = true;
      horizontal = null;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    };
    const move = (e: TouchEvent) => {
      if (!tracking) return;
      const dx = e.touches[0].clientX - sx;
      const dy = e.touches[0].clientY - sy;
      if (horizontal === null && Math.hypot(dx, dy) > 10) horizontal = Math.abs(dx) > Math.abs(dy) * 1.4;
      if (horizontal) setNudge(Math.max(-40, Math.min(40, dx * 0.25)));
    };
    const end = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      setNudge(0);
      if (!horizontal) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (dx < -60) void turnTo(cur + 1);
      else if (dx > 60) void turnTo(cur - 1);
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: true });
    el.addEventListener("touchend", end);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, tool, shut]);

  if (shut) {
    return (
      <div className={styles.closed} onClick={() => goSpread(1)}>
        <div className={styles.closedRings} aria-hidden>
          {Array.from({ length: RINGS }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <div className={styles.closedCover}>
          <CoverFront active />
        </div>
      </div>
    );
  }

  const C = SPREAD_COMPONENTS[cur];
  const inMore = MORE.includes(cur);

  return (
    <div className={styles.flat}>
      {/* binding: leather strip with brass rings */}
      <header className={styles.binding}>
        <button className={styles.bindBtn} onClick={() => setSheet("more")} aria-label="Índice y opciones">
          <Menu aria-hidden />
        </button>
        <div className={styles.rings} aria-hidden>
          {Array.from({ length: RINGS }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <button className={styles.bindBtn} onClick={() => setSheet("tools")} aria-label="Herramientas: pluma, texto, cinta y foto" data-on={tool !== "none" || undefined}>
          <PenLine aria-hidden />
        </button>
      </header>

      <div ref={pad} className={styles.pad}>
        <div className={styles.under} aria-hidden />
        <div ref={page} className={styles.sheet} style={nudge ? { transform: `translateX(${nudge}px) rotate(${nudge * 0.03}deg)` } : undefined}>
          <div className={styles.holes} aria-hidden>
            {Array.from({ length: RINGS }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <div ref={scroller} className={styles.scroll} data-flip-scroll>
            <FaceCtx.Provider value={{ side: "both", active: true }}>
              <C />
            </FaceCtx.Provider>
          </div>
          {rib.here && <span className={styles.ribbon} aria-hidden />}
          {tool !== "none" && (
            <div className={styles.drawing}>
              <span>Dibujando sobre la hoja</span>
              <button className="ink-btn" onClick={() => setTool("none")}>
                Listo
              </button>
            </div>
          )}
        </div>
      </div>

      <nav className={styles.tabs} aria-label="Secciones">
        {TABS.map((t) => (
          <button key={t.i} aria-current={cur === t.i ? "page" : undefined} onClick={() => void turnTo(t.i)}>
            {t.label}
          </button>
        ))}
        <button aria-current={inMore ? "page" : undefined} onClick={() => setSheet("more")} aria-label="Más secciones">
          <Menu aria-hidden />
        </button>
      </nav>

      {sheet && (
        <div className={styles.sheetWrap} onClick={(e) => e.target === e.currentTarget && setSheet(null)}>
          <div className={styles.drawer} role="dialog" aria-modal="true">
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
                          setSheet(null);
                          void turnTo(i);
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
                        setSheet(null);
                        void turnTo(rib.ribbon!);
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
