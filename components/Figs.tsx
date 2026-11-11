import { Fragment } from "react";

/** The engraved face draws "1" like a Roman "I"; set digits in the writing face. */
export function Figs({ children }: { children: string }) {
  const parts = children.split(/(\d+)/);
  return (
    <>
      {parts.map((p, i) =>
        /^\d+$/.test(p) ? (
          <span key={i} className="fig">{p}</span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}
