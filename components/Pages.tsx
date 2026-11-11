import type { ReactNode } from "react";

/** The two facing pages of the open book. On phones they stack into one page. */
export function Pages({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <>
      <section className="page left">
        <div className="page-content">{left}</div>
      </section>
      <section className="page right">
        <div className="page-content">{right}</div>
      </section>
    </>
  );
}

export function FullPage({ children }: { children: ReactNode }) {
  return <section className="page full-page">{children}</section>;
}
