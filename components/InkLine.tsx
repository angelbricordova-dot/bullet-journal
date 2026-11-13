"use client";

import { useLayoutEffect, useRef, type KeyboardEvent, type Ref, type TextareaHTMLAttributes } from "react";

/**
 * One written entry on the ruled page. Long text wraps onto the next
 * ruled line instead of running off sideways; Enter never adds a newline.
 */
export function InkLine({
  value,
  onValue,
  onEnter,
  ref,
  className,
  onKeyDown,
  ...rest
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> & {
  value: string;
  onValue: (v: string) => void;
  onEnter?: () => void;
  ref?: Ref<HTMLTextAreaElement>;
}) {
  const own = useRef<HTMLTextAreaElement | null>(null);
  useLayoutEffect(() => {
    const el = own.current;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);
  return (
    <textarea
      {...rest}
      ref={(el) => {
        own.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      rows={1}
      className={`ink-line ${className ?? ""}`}
      value={value}
      onChange={(e) => onValue(e.target.value.replace(/\n/g, " "))}
      onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
          e.preventDefault();
          onEnter?.();
        }
        onKeyDown?.(e);
      }}
    />
  );
}
