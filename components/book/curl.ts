"use client";

/**
 * Paper curl for a turning leaf.
 *
 * CSS can't bend a plane, so while a page turns we replace the leaf with a
 * chain of thin vertical strips, each hinged to the previous one. Each strip
 * holds a clipped copy of both faces of the page. Rotating the strips by
 * slightly different amounts makes the sheet bow like paper: the free edge
 * leads, the spine follows.
 */

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Curl {
  private root: HTMLDivElement;
  private strips: HTMLDivElement[] = [];
  private shadesF: HTMLDivElement[] = [];
  private shadesB: HTMLDivElement[] = [];
  private n: number;
  private raf = 0;
  p = 0;

  constructor(book: HTMLElement, leaf: HTMLElement, pw: number, ph: number, z: number, n = 12) {
    this.n = n;
    const w = pw / n;
    const front = leaf.querySelector<HTMLElement>('[data-side="right"]');
    const back = leaf.querySelector<HTMLElement>('[data-side="left"]');
    const scroll = (el: HTMLElement | null) => el?.querySelector<HTMLElement>(".page-scroll")?.scrollTop ?? 0;
    const fs = scroll(front);
    const bs = scroll(back);

    this.root = document.createElement("div");
    Object.assign(this.root.style, {
      position: "absolute",
      left: `${pw}px`,
      top: "0",
      width: `${pw}px`,
      height: `${ph}px`,
      transformStyle: "preserve-3d",
      transform: `translateZ(${z}px)`,
      pointerEvents: "none",
    });

    const face = (src: HTMLElement | null, offset: number, scrollTop: number, isBack: boolean) => {
      const clip = document.createElement("div");
      Object.assign(clip.style, {
        position: "absolute",
        inset: "0",
        overflow: "hidden",
        backfaceVisibility: "hidden",
        webkitBackfaceVisibility: "hidden",
        transform: isBack ? "rotateY(180deg)" : "",
        background: "var(--paper)",
      });
      if (src) {
        const c = src.cloneNode(true) as HTMLElement;
        c.removeAttribute("inert");
        Object.assign(c.style, {
          position: "absolute",
          left: `${-offset}px`,
          top: "0",
          width: `${pw}px`,
          height: `${ph}px`,
          transform: "none",
          backfaceVisibility: "visible",
        });
        clip.appendChild(c);
        // canvases don't clone their pixels: copy them over
        const from = src.querySelectorAll("canvas");
        c.querySelectorAll("canvas").forEach((cv, k) => {
          const o = from[k];
          if (!o || !o.width || !o.height) return;
          cv.width = o.width;
          cv.height = o.height;
          cv.getContext("2d")?.drawImage(o, 0, 0);
        });
        const sc = c.querySelector<HTMLElement>(".page-scroll");
        if (sc) requestAnimationFrame(() => (sc.scrollTop = scrollTop));
      }
      const shade = document.createElement("div");
      Object.assign(shade.style, {
        position: "absolute",
        inset: "0",
        background: "linear-gradient(to right, rgba(30,18,4,.55), rgba(30,18,4,.25))",
        opacity: "0",
        pointerEvents: "none",
      });
      clip.appendChild(shade);
      return { clip, shade };
    };

    let parent: HTMLElement = this.root;
    for (let i = 0; i < n; i++) {
      const strip = document.createElement("div");
      Object.assign(strip.style, {
        position: "absolute",
        left: i === 0 ? "0" : `${w}px`,
        top: "0",
        width: `${w + 0.6}px`, // overlap hides hairline seams
        height: `${ph}px`,
        transformOrigin: "0 50%",
        transformStyle: "preserve-3d",
      });
      const f = face(front, i * w, fs, false);
      const b = face(back, pw - (i + 1) * w, bs, true);
      strip.append(f.clip, b.clip);
      parent.appendChild(strip);
      parent = strip;
      this.strips.push(strip);
      this.shadesF.push(f.shade);
      this.shadesB.push(b.shade);
    }
    book.appendChild(this.root);
  }

  /** p: 0 = flat on the right, 1 = flat on the left. dir: +1 turning forward, -1 back. */
  set(p: number, dir: 1 | -1) {
    this.p = p;
    const base = -180 * p;
    const bend = Math.sin(Math.PI * Math.min(1, Math.max(0, p))) * 62;
    let prev = 0;
    for (let i = 0; i < this.n; i++) {
      const x = (i + 0.5) / this.n;
      const abs = Math.max(-180, Math.min(0, base - dir * bend * Math.pow(x, 1.6)));
      const rel = abs - prev;
      prev = abs;
      this.strips[i].style.transform = `rotateY(${rel.toFixed(2)}deg)`;
      const lit = Math.abs(Math.sin((abs * Math.PI) / 180));
      const bendShade = Math.min(1, Math.abs(rel) / 12);
      this.shadesF[i].style.opacity = (lit * 0.22 + bendShade * 0.12).toFixed(3);
      this.shadesB[i].style.opacity = (lit * 0.2 + bendShade * 0.12).toFixed(3);
    }
  }

  animate(to: number, dir: 1 | -1, ms = 760): Promise<void> {
    cancelAnimationFrame(this.raf);
    const from = this.p;
    const t0 = performance.now();
    const dur = Math.max(160, ms * Math.abs(to - from));
    return new Promise((done) => {
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        this.set(from + (to - from) * ease(t), dir);
        if (t < 1) this.raf = requestAnimationFrame(tick);
        else done();
      };
      this.raf = requestAnimationFrame(tick);
    });
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.root.remove();
  }
}
