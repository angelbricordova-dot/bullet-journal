"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { FaceCtx } from "../Pages";
import { SPREAD_LIST } from "./spreads";
import { SPREAD_COMPONENTS } from "./registry";
import { CoverFront } from "./Cover";
import { goSpread, useSpread, useTool } from "@/lib/book";
import { useShared } from "@/lib/shared";
import styles from "./book3d.module.css";

const M = 14; // cover overhang
const STEP = 0.6; // z distance between leaves
const LAST = SPREAD_LIST.length - 1;
const LEAVES = LAST; // leaf j: front = spread j right, back = spread j+1 left

export interface View {
  rx: number;
  ry: number;
  zoom: number;
}
export const DEFAULT_VIEW: View = { rx: 12, ry: 0, zoom: 1 };

export function useView() {
  return useShared<View>("book:view", DEFAULT_VIEW);
}

function Face({ spread, side, active, render }: { spread: number; side: "left" | "right"; active: boolean; render: boolean }) {
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
}

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
  const closed = cur < 0;

  // remember where we came from for staggered turns and to keep its pages drawn while they move
  useLayoutEffect(() => {
    if (prev.current !== cur) {
      setFrom(prev.current);
      prev.current = cur;
      const t = setTimeout(() => setFrom(cur), 1400);
      return () => clearTimeout(t);
    }
  }, [cur]);

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
      if (e.key === "ArrowRight" || e.key === "PageDown") goSpread(Math.min(LAST, cur + 1));
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
  function onSceneDown(e: React.PointerEvent) {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset.desk) return;
    const sx = e.clientX;
    const sy = e.clientY;
    const v0 = view;
    const move = (ev: PointerEvent) => {
      setView({
        ...v0,
        ry: Math.max(-55, Math.min(55, v0.ry + (ev.clientX - sx) * 0.22)),
        rx: Math.max(-5, Math.min(60, v0.rx - (ev.clientY - sy) * 0.22)),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  /* ---- drag a page corner to turn it ---- */
  function onGrab(e: React.PointerEvent, dir: "fwd" | "back") {
    e.preventDefault();
    e.stopPropagation();
    const leaf = dir === "fwd" ? cur : cur - 1;
    if (leaf < -1 || leaf >= LEAVES) return;
    const spine = spineRef.current!.getBoundingClientRect();
    const sx = spine.left + spine.width / 2;
    const pwScreen = pw * view.zoom * Math.cos((view.ry * Math.PI) / 180);
    let angle = dir === "fwd" ? 0 : -180;
    let lastX = e.clientX;
    let vel = 0;
    const move = (ev: PointerEvent) => {
      const c = Math.max(-1, Math.min(1, (ev.clientX - sx) / pwScreen));
      angle = (-Math.acos(c) * 180) / Math.PI;
      vel = ev.clientX - lastX;
      lastX = ev.clientX;
      setDrag({ leaf, angle });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const turn = dir === "fwd" ? angle < -90 || vel < -8 : !(angle > -90 || vel > 8);
      setDrag(null);
      if (dir === "fwd" && turn) goSpread(cur + 1);
      if (dir === "back" && !turn) goSpread(cur - 1);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
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
      transition: drag?.leaf === j ? "none" : `transform 850ms var(--ease-page) ${delay}ms`,
      zIndex: drag?.leaf === j ? 50 : undefined,
    };
  };

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
  const rightCount = LEAVES - Math.max(0, cur);

  return (
    <div ref={sceneRef} className={styles.scene} onPointerDown={onSceneDown} data-desk="1">
      <div className={styles.pos} style={{ transform: `translateX(${offsetX + (closed ? -pw / 2 : 0)}px)` }} data-desk="1">
      <div className={styles.book} style={bookStyle} data-closed={closed || undefined}>
        <div className={styles.backCover} />
        <div className={styles.spine} ref={spineRef} />

        {/* paper glued inside the back cover: the last spread's right page */}
        <div className={styles.base} style={{ boxShadow: stackShadow(rightCount) }}>
          <Face spread={LAST} side="right" active={cur === LAST} render={visible(LAST)} />
          <Tab index={LAST} />
        </div>
        {leftCount > 0 && <div className={styles.leftStack} style={{ boxShadow: stackShadow(leftCount, true) }} />}

        {Array.from({ length: LEAVES }, (_, j) => (
          <div key={j} className={styles.leaf} style={leafStyle(j)} data-turned={j < cur || undefined}>
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

        {!closed && cur < LEAVES && <div className={`${styles.grab} ${styles.grabR}`} onPointerDown={(e) => onGrab(e, "fwd")} title="Arrastra para pasar la hoja" />}
        {!closed && cur >= 0 && <div className={`${styles.grab} ${styles.grabL}`} onPointerDown={(e) => onGrab(e, "back")} title="Arrastra para volver" />}
        <div className={styles.ribbon} aria-hidden />
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
