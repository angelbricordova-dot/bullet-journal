"use client";

import { play } from "@/lib/sfx";

export function HabitCheck({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      className="check"
      onClick={() => {
        if (!checked) play("check");
        onToggle();
      }}
      aria-label={label}
    >
      <svg viewBox="0 0 30 30" aria-hidden>
        <path d="M7 7 L23 23" />
        <path d="M23 7 L7 23" />
      </svg>
    </button>
  );
}
