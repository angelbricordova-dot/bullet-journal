/** A clean segmented bar: one segment per day of the goal, grouped by ten. */
export function Segments({ value, target, label }: { value: number; target: number; label: string }) {
  const n = Math.max(1, Math.min(120, target));
  const filled = Math.min(value, n);
  return (
    <div role="img" aria-label={`${label}: ${filled} de ${n} días`} style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: Math.ceil(n / 10) }, (_, g) => (
        <div key={g} style={{ flex: Math.min(10, n - g * 10), display: "flex", gap: 2 }}>
          {Array.from({ length: Math.min(10, n - g * 10) }, (_, k) => {
            const i = g * 10 + k;
            const on = i < filled;
            const next = i === filled;
            return (
              <span
                key={k}
                style={{
                  flex: 1,
                  height: 12,
                  borderRadius: 2,
                  background: on ? "var(--ink)" : "transparent",
                  boxShadow: on ? "none" : next ? "inset 0 0 0 1.5px var(--vermilion)" : "inset 0 0 0 1px color-mix(in oklab, var(--ink) 22%, transparent)",
                  transition: "background-color 300ms",
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
