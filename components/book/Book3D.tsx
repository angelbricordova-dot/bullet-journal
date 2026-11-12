"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { FaceCtx } from "../Pages";
import { SPREAD_LIST } from "./spreads";
import { SPREAD_COMPONENTS } from "./registry";
import { BackCover, CoverFront } from "./Cover";
import { goSpread, useSpread, useTool } from "@/lib/book";
import { useShared } from "@/lib/shared";
import { drag as dragPointer } from "@/lib/drag";
import { pageTurn, play } from "@/lib/sfx";
import { useRibbon } from "./ribbon";
import { Curl } from "./curl";
import styles from "./book3d.module.css";

const M = 14; // cover overhang
const STEP = 0.6; // z distance between leaves
const LAST = SPREAD_LIST.length - 1;
const LEAVES = LAST; // leaf j: front = spread j right, back = spread j+1 left

export interface View {
  rx: number;
  ry: number;
  zoom: number;
  px?: number;
  py?: number;
}
export const DEFAULT_VIEW: View = { rx: 12, ry: 0, zoom: 1, px: 0, py: 0 };

export function useView() {
  return useShared<View>("book:view", DEFAULT_VIEW);
}

const Face = memo(function Face({ spread, side, active, render }: { spread: number; side: "left" | "right"; active: boolean; render: boolean }) {
  const C = SPREAD_COMPONENTS[spread];
  return (
    <div className={`${styles.face} ${side === "left" ? styles.back : styles.front}`} data-side={side} inert={!active || undefined}>
      <div className={styles.holes} aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      {render && C ? (
        <FaceCtx.Provider value={{ side, active }}>
          <C />
        </FaceCtx.Provider>
      ) : (
        <div className={styles.blank} />
      )}
      <span className={`num ${styles.folio}`}>{side === "left" ? spread * 2 : spread * 2 + 1}</span>
    </div>
  );
});

function Tab({ index, back }: { index: number; back?: boolean }) {
  const s = SPREAD_LIST[index];
  const [cur] = useSpread();
  return (
    <button
      className={`${styles.tab} ${back ? styles.tabBack : ""}`}
      style={{ "--i": index } as CSSProperties}
      aria-current={cur === index ? "page" : undefined}
      onClick={(e) => {
        e.stopPropagation();
        goSpread(index);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      title={s.label}
      tabIndex={back ? -1 : 0}
    >
      <span>{s.label}</span>
    </button>
  );
}

export function Book3D({ pw, ph, offsetX = 0 }: { pw: number; ph: number; offsetX?: number }) {
  const [cur] = useSpread();
  const [view, setView] = useView();
  const [tool] = useTool();
  const [drag, setDrag] = useState<{ leaf: number; angle: number } | null>(null);
  const prev = useRef(cur);
  const [from, setFrom] = useState(cur);
  const sceneRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const curlRef = useRef<{ curl: Curl; leaf: HTMLElement } | null>(null);
  const skipCurl = useRef<number | null>(null);
  const [instantLeaf, setInstantLeaf] = useState<number | null>(null);
  const [panning, setPanning] = useState(false);
  const closed = cur < 0;
  const closedBack = cur > LAST; // shut from the back, after the last page
  const shut = closed || closedBack;
  const ribbon = useRibbon();

  const leafEl = (j: number) => bookRef.current?.querySelector<HTMLElement>(`[data-leaf="${j}"]`) ?? null;
  const endCurl = () => {
    const c = curlRef.current;
    if (!c) return;
    c.curl.destroy();
    c.leaf.style.visibility = "";
    curlRef.current = null;
  };
  const makeCurl = (j: number): Curl | null => {
    const el = leafEl(j);
    if (!el || !bookRef.current) return null;
    endCurl();
    const curl = new Curl(bookRef.current, el, pw, ph, (LEAVES + 6) * STEP);
    el.style.visibility = "hidden";
    curlRef.current = { curl, leaf: el };
    return curl;
  };

  // remember where we came from for staggered turns and to keep its pages drawn while they move
  useLayoutEffect(() => {
    if (prev.current === cur) return;
    const was = prev.current;
    setFrom(was);
    prev.current = cur;

    // sounds and the paper curl
    if ((was < 0 && cur >= 0) || (was > LAST && cur <= LAST)) play("book-open");
    else if (cur < 0 || cur > LAST) play("book-close");
    const step = cur - was;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (skipCurl.current === cur) {
      skipCurl.current = null;
    } else if (Math.abs(step) === 1 && Math.min(cur, was) >= 0 && !reduce) {
      const j = Math.min(cur, was);
      const curl = makeCurl(j);
      if (curl) {
        const dir = step > 0 ? 1 : -1;
        curl.set(step > 0 ? 0 : 1, dir);
        pageTurn();
        void curl.animate(step > 0 ? 1 : 0, dir).then(endCurl);
      }
    } else if (Math.abs(step) > 1 && Math.min(cur, was) >= 0) {
      const n = Math.min(4, Math.abs(step));
      for (let i = 0; i < n; i++) setTimeout(() => pageTurn(0.55), i * 110);
    }
    const t = setTimeout(() => setFrom(cur), 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur]);

  useEffect(() => () => endCurl(), []);

  // pen work wants a flat, frontal page
  useEffect(() => {
    if (tool !== "none") setView({ ...view, rx: 0, ry: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  // keyboard page turning
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") goSpread(Math.min(LAST + 1, cur + 1));
      if (e.key === "ArrowLeft" || e.key === "PageUp") goSpread(Math.max(-1, cur - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cur]);

  // wheel zoom (pages that can scroll keep their scroll)
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const sc = (e.target as HTMLElement).closest(".page-scroll, [data-scroll]") as HTMLElement | null;
      if (sc && sc.scrollHeight > sc.clientHeight + 2 && !e.ctrlKey) return;
      e.preventDefault();
      const z = Math.min(1.9, Math.max(0.55, view.zoom * (e.deltaY > 0 ? 0.93 : 1.07)));
      setView({ ...view, zoom: +z.toFixed(3) });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [view, setView]);

  const visible = (s: number) => Math.abs(s - cur) <= 1 || Math.abs(s - from) <= 1;

  /* ---- rotate the whole book by dragging the desk ---- */
  /* ---- right button: slide the book around the desk ---- */
  function onPanDown(e: React.PointerEvent) {
    if (e.button !== 2) return;
    e.preventDefault();
    e.stopPropagation();
    const v0 = view;
    setPanning(true);
    document.body.style.cursor = "grabbing";
    dragPointer(
      e,
      (_ev, dx, dy) => setView({ ...v0, px: (v0.px ?? 0) + dx, py: (v0.py ?? 0) + dy }),
      () => {
        document.body.style.cursor = "";
        setPanning(false);
      },
    );
  }

  function onSceneDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset.desk) return;
    const v0 = view;
    dragPointer(
      e,
      (_ev, dx, dy) =>
        setView({
          ...v0,
          ry: v0.ry + dx * 0.3,
          rx: v0.rx - dy * 0.3,
        }),
      undefined,
      5,
    );
  }

  /* ---- drag a page edge to turn it: the paper bends under your hand ---- */
  function onGrab(e: React.PointerEvent, dir: "fwd" | "back") {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const leaf = dir === "fwd" ? cur : cur - 1;
    if (leaf < -1 || leaf > LEAVES) return;
    const spine = spineRef.current!.getBoundingClientRect();
    const sx = spine.left + spine.width / 2;
    const pwScreen = pw * view.zoom * Math.cos((view.ry * Math.PI) / 180);
    const sign = dir === "fwd" ? 1 : -1;
    let p = dir === "fwd" ? 0 : 1;
    let lastX = e.clientX;
    let vel = 0;
    const curl = leaf >= 0 ? makeCurl(leaf) : null;
    curl?.set(p, sign);
    let soundPlayed = false;

    dragPointer(
      e,
      (ev) => {
        const c = Math.max(-1, Math.min(1, (ev.clientX - sx) / pwScreen));
        p = Math.acos(c) / Math.PI;
        vel = ev.clientX - lastX;
        lastX = ev.clientX;
        if (!soundPlayed) {
          pageTurn(0.8);
          soundPlayed = true;
        }
        if (curl) curl.set(p, sign);
        else setDrag({ leaf, angle: -180 * p });
      },
      () => {
        const complete = dir === "fwd" ? p > 0.5 || vel < -8 : p < 0.5 || vel > 8;
        const target = dir === "fwd" ? cur + 1 : cur - 1;
        if (!curl) {
          setDrag(null);
          if (complete) goSpread(target);
          return;
        }
        const to = (dir === "fwd") === complete ? 1 : 0;
        void curl.animate(to, sign, 600).then(() => {
          if (complete) {
            skipCurl.current = target;
            setInstantLeaf(leaf);
            goSpread(target);
            requestAnimationFrame(() =>
              requestAnimationFrame(() => {
                setInstantLeaf(null);
                endCurl();
              }),
            );
          } else endCurl();
        });
      },
    );
  }

  const leafStyle = (j: number): CSSProperties => {
    const turned = j < cur;
    const baseAngle = turned ? -180 : 0;
    const angle = drag?.leaf === j ? drag.angle : baseAngle;
    const z = angle <= -90 ? -(j + 2) * STEP : (LEAVES - j + 1) * STEP;
    const lo = Math.min(cur, from);
    const delay = drag ? 0 : Math.max(0, cur > from ? j - lo : Math.max(cur, from) - 1 - j) * 70;
    return {
      transform: `rotateY(${angle}deg) translateZ(${z}px)`,
      transition: drag?.leaf === j || instantLeaf === j ? "none" : `transform 850ms var(--ease-page) ${delay}ms`,
      zIndex: drag?.leaf === j ? 50 : undefined,
    };
  };

  const backAngle = drag?.leaf === LEAVES ? drag.angle : closedBack ? -180 : 0;
  const backZ = backAngle <= -90 ? -22 : -3;
  const coverAngle = drag?.leaf === -1 ? drag.angle : closed ? 0 : -180;
  const coverZ = coverAngle <= -90 ? -STEP : 22;

  const bookStyle: CSSProperties = {
    width: pw * 2,
    height: ph,
    transform: `rotateX(${view.rx}deg) rotateY(${view.ry}deg) scale(${view.zoom})`,
    ["--pw" as string]: `${pw}px`,
    ["--ph" as string]: `${ph}px`,
    ["--m" as string]: `${M}px`,
    ["--tab-h" as string]: `${Math.floor((ph - 40) / SPREAD_LIST.length) - 4}px`,
  };

  const leftCount = Math.max(0, cur);
  const rightCount = Math.max(0, LEAVES - Math.max(0, cur));

  return (
    <div
      ref={sceneRef}
      className={styles.scene}
      onPointerDown={onSceneDown}
      onPointerDownCapture={onPanDown}
      onContextMenu={(e) => {
        if (!(e.target as HTMLElement).closest("input, textarea")) e.preventDefault();
      }}
      data-desk="1"
    >
      <div className={styles.pos} style={{ transform: `translate(${offsetX + (view.px ?? 0) + (closed ? -pw / 2 : closedBack ? pw / 2 : 0)}px, ${view.py ?? 0}px)`, transition: panning ? "none" : undefined }} data-desk="1">
      <div ref={bookRef} className={styles.book} style={bookStyle} data-closed={shut || undefined} data-closed-back={closedBack || undefined} data-spread={cur}>
        <div className={styles.spine} ref={spineRef} />
        {/* the spine: the leather back that joins both covers; it stands up when the book is shut */}
        <div className={styles.spineBack} data-closed={shut || undefined} aria-hidden>
          <span className={styles.spineBand} />
          <span className={styles.spineTitle}>Bitácora</span>
          <span className={styles.spineBand} />
        </div>

        {/* back cover: leather outside, the last right page glued inside; it closes over the pages at the end */}
        <div
          className={styles.backLeaf}
          style={{ transform: `rotateY(${backAngle}deg) translateZ(${backZ}px)`, transition: drag?.leaf === LEAVES ? "none" : undefined }}
        >
          <div className={styles.backIn} />
          <div className={styles.backOut} inert={!closedBack || undefined} onClick={() => closedBack && goSpread(LAST)}>
            <BackCover />
          </div>
          <div className={styles.base} style={{ boxShadow: stackShadow(rightCount) }}>
            <Face spread={LAST} side="right" active={cur === LAST && !drag} render={visible(LAST)} />
            <Tab index={LAST} />
          </div>
        </div>
        {leftCount > 0 && <div className={styles.leftStack} style={{ boxShadow: stackShadow(leftCount, true) }} />}

        {Array.from({ length: LEAVES }, (_, j) => (
          <div key={j} className={styles.leaf} style={leafStyle(j)} data-leaf={j} data-turned={j < cur || undefined}>
            <Face spread={j} side="right" active={cur === j && !drag} render={visible(j)} />
            <Face spread={j + 1} side="left" active={cur === j + 1 && !drag} render={visible(j + 1)} />
            <Tab index={j} />
            <Tab index={j} back />
          </div>
        ))}

        {/* front cover: leather outside, first page glued inside */}
        <div
          className={styles.cover}
          data-open-past={(!closed && cur !== 0 && !drag) || undefined}
          style={{ transform: `rotateY(${coverAngle}deg) translateZ(${coverZ}px)`, transition: drag?.leaf === -1 ? "none" : undefined }}
        >
          <div className={`${styles.coverOut}`} inert={!closed || undefined} onClick={() => closed && goSpread(1)}>
            <CoverFront active={closed} />
          </div>
          <div className={styles.coverIn}>
            <div className={styles.coverInPaper}>
              <Face spread={0} side="left" active={cur === 0 && !drag} render={visible(0)} />
            </div>
          </div>
        </div>

        <Rings ph={ph} />

        {!shut && <div className={`${styles.grab} ${styles.grabR}`} onPointerDown={(e) => onGrab(e, "fwd")} title="Arrastra para pasar la hoja" />}
        {!closed && cur >= 0 && <div className={`${styles.grab} ${styles.grabL}`} data-back-shut={closedBack || undefined} onPointerDown={(e) => onGrab(e, "back")} title="Arrastra para volver" />}
        <button
          className={styles.ribbon}
          data-state={ribbon === null || closedBack ? "off" : !closed && cur === ribbon ? "full" : "tail"}
          onClick={() => ribbon !== null && cur !== ribbon && goSpread(ribbon)}
          onPointerDown={(e) => e.stopPropagation()}
          tabIndex={ribbon !== null && cur !== ribbon ? 0 : -1}
          aria-label={ribbon !== null ? `Ir a la hoja marcada: ${SPREAD_LIST[ribbon]?.label}` : "Sin marcapáginas"}
          title={ribbon !== null ? `Marcapáginas: ${SPREAD_LIST[ribbon]?.label}` : undefined}
        />
      </div>
      </div>
    </div>
  );
}

function stackShadow(n: number, left = false): string {
  const layers = Math.min(6, Math.ceil(n / 1.5));
  const out: string[] = [];
  for (let i = 1; i <= layers; i++) out.push(`${left ? -i : i}px ${i * 0.6}px 0 ${i % 2 ? "#ddd2b8" : "#cbbd9d"}`);
  out.push(`${left ? -8 : 8}px 10px 18px rgba(0,0,0,.35)`);
  return out.join(", ");
}

function Rings({ ph }: { ph: number }): ReactNode {
  const n = 6;
  return (
    <div className={styles.rings} aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={styles.ring} style={{ top: ph * (0.09 + (i * 0.82) / (n - 1)) }}>
          <i />
        </span>
      ))}
    </div>
  );
}
