/** Prison-wall tally: groups of five strokes. `value` days marked out of `target`. */
export function Tally({ value, target, label }: { value: number; target: number; label: string }) {
  const groups = Math.ceil(target / 5);
  return (
    <div
      role="img"
      aria-label={`${label}: ${Math.min(value, target)} de ${target} días`}
      style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px" }}
    >
      {Array.from({ length: groups }, (_, g) => {
        const filled = Math.max(0, Math.min(5, value - g * 5));
        const size = Math.min(5, target - g * 5);
        return (
          <svg key={g} width="28" height="22" viewBox="0 0 28 22" aria-hidden>
            {Array.from({ length: Math.min(size, 4) }, (_, i) => (
              <line
                key={i}
                x1={4 + i * 6}
                x2={4 + i * 6 + (i % 2 ? 0.6 : -0.4)}
                y1="3"
                y2="19"
                stroke={i < filled ? "var(--ink)" : "var(--paper-edge)"}
                strokeWidth="2"
                strokeLinecap="round"
              />
            ))}
            {size === 5 && (
              <line x1="1" y1="16" x2="25" y2="6" stroke={filled === 5 ? "var(--vermilion)" : "var(--paper-edge)"} strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        );
      })}
    </div>
  );
}
