"use client";

/**
 * Page flip for a top-bound notebook (phone). The sheet is copied into a
 * stack of thin horizontal strips hinged one under the other; turning
 * rotates them around the binding at the top, the bottom edge leading, so
 * the paper bends as it lifts over the rings.
 */

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function flipUp(host: HTMLElement, source: HTMLElement, from: number, to: number, ms = 560): Promise<void> {
  const w = source.offsetWidth;
  const h = source.offsetHeight;
  const scrollTop = source.querySelector<HTMLElement>("[data-flip-scroll]")?.scrollTop ?? 0;
  const n = 9;
  const sh = h / n;

  const root = document.createElement("div");
  Object.assign(root.style, {
    position: "absolute",
    left: `${source.offsetLeft}px`,
    top: `${source.offsetTop}px`,
    width: `${w}px`,
    height: `${h}px`,
    transformStyle: "preserve-3d",
    pointerEvents: "none",
    zIndex: "30",
  });

  const strips: HTMLDivElement[] = [];
  const shades: HTMLDivElement[] = [];
  let parent: HTMLElement = root;
  for (let i = 0; i < n; i++) {
    const strip = document.createElement("div");
    Object.assign(strip.style, {
      position: "absolute",
      left: "0",
      top: i === 0 ? "0" : `${sh}px`,
      width: `${w}px`,
      height: `${sh + 0.6}px`,
      transformOrigin: "50% 0",
      transformStyle: "preserve-3d",
    });
    const front = document.createElement("div");
    Object.assign(front.style, {
      position: "absolute",
      inset: "0",
      overflow: "hidden",
      backfaceVisibility: "hidden",
      background: "var(--paper)",
    });
    const clone = source.cloneNode(true) as HTMLElement;
    Object.assign(clone.style, { position: "absolute", left: "0", top: `${-i * sh}px`, width: `${w}px`, height: `${h}px`, margin: "0" });
    const sc = clone.querySelector<HTMLElement>("[data-flip-scroll]");
    if (sc) requestAnimationFrame(() => (sc.scrollTop = scrollTop));
    // canvases don't clone their pixels
    const fromC = source.querySelectorAll("canvas");
    clone.querySelectorAll("canvas").forEach((cv, k) => {
      const o = fromC[k];
      if (!o?.width) return;
      cv.width = o.width;
      cv.height = o.height;
      cv.getContext("2d")?.drawImage(o, 0, 0);
    });
    front.appendChild(clone);
    const shade = document.createElement("div");
    Object.assign(shade.style, { position: "absolute", inset: "0", background: "rgba(30,18,4,.5)", opacity: "0" });
    front.appendChild(shade);
    // the back of the sheet: plain paper
    const back = document.createElement("div");
    Object.assign(back.style, {
      position: "absolute",
      inset: "0",
      background: "linear-gradient(#efe6d0, #e7dcc2)",
      transform: "rotateX(180deg)",
      backfaceVisibility: "hidden",
    });
    strip.append(front, back);
    parent.appendChild(strip);
    parent = strip;
    strips.push(strip);
    shades.push(shade);
  }
  host.appendChild(root);

  const set = (p: number) => {
    // p: 0 = lying on the pad, 1 = flipped over the rings
    const base = 172 * p;
    const bend = Math.sin(Math.PI * p) * 55;
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const y = (i + 0.5) / n;
      const abs = Math.min(180, base + bend * Math.pow(y, 1.5));
      strips[i].style.transform = `rotateX(${(abs - prev).toFixed(2)}deg)`;
      shades[i].style.opacity = (Math.sin((abs * Math.PI) / 180) * 0.35).toFixed(3);
      prev = abs;
    }
  };
  set(from);

  return new Promise((done) => {
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      set(from + (to - from) * ease(t));
      if (t < 1) requestAnimationFrame(tick);
      else {
        root.remove();
        done();
      }
    };
    requestAnimationFrame(tick);
  });
}
