"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Deco } from "./book/Deco";

export type Side = "left" | "right" | "both";

export const FaceCtx = createContext<{ side: Side; active: boolean }>({ side: "both", active: true });

/**
 * The two facing pages of a spread. The book renders each face separately
 * (left = back of a leaf, right = front of the next), so a spread component
 * returns both and this picks the one being drawn. On phones both stack.
 * `id` names the pages for their stickers, tape, photos and ink.
 */
export function Pages({ id, left, right }: { id: string; left: ReactNode; right: ReactNode }) {
  const { side, active } = useContext(FaceCtx);
  if (side === "left") return <PageBody id={`${id}-l`} active={active}>{left}</PageBody>;
  if (side === "right") return <PageBody id={`${id}-r`} active={active}>{right}</PageBody>;
  return (
    <>
      <PageBody id={`${id}-l`} active={active} part="first">{left}</PageBody>
      <PageBody id={`${id}-r`} active={active} part="second">{right}</PageBody>
    </>
  );
}

function PageBody({ id, children, active, part }: { id: string; children: ReactNode; active: boolean; part?: "first" | "second" }) {
  return (
    <div className="page-scroll" data-part={part}>
      <div className="page-content" data-deco-host={id} data-active={active || undefined}>
        {children}
        <Deco id={id} />
      </div>
    </div>
  );
}
