"use client";

/**
 * A pointer drag that always ends: on pointerup, pointercancel, losing the
 * window, or when a move arrives with no buttons pressed. Nothing can be
 * left "stuck" following the mouse.
 */
export function drag(
  e: { clientX: number; clientY: number; pointerId: number; button?: number },
  onMove: (ev: PointerEvent, dx: number, dy: number) => void,
  onEnd?: (ev: PointerEvent | null, moved: boolean) => void,
  threshold = 0,
) {
  const sx = e.clientX;
  const sy = e.clientY;
  let moved = threshold === 0;
  let done = false;

  const finish = (ev: PointerEvent | null) => {
    if (done) return;
    done = true;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    window.removeEventListener("blur", blur);
    onEnd?.(ev, moved);
  };
  const move = (ev: PointerEvent) => {
    if (ev.pointerId !== e.pointerId) return;
    if (ev.buttons === 0 && ev.pointerType === "mouse") return finish(ev);
    const dx = ev.clientX - sx;
    const dy = ev.clientY - sy;
    if (!moved && Math.hypot(dx, dy) < threshold) return;
    moved = true;
    onMove(ev, dx, dy);
  };
  const up = (ev: PointerEvent) => {
    if (ev.pointerId === e.pointerId) finish(ev);
  };
  const blur = () => finish(null);

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
  window.addEventListener("blur", blur);
  return () => finish(null);
}
