export function BrassCorner({ className }: { className: string }) {
  return (
    <span className={`brass-corner ${className}`} aria-hidden>
      <svg viewBox="0 0 30 30">
        <defs>
          <linearGradient id="brassg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ecd49c" />
            <stop offset="0.5" stopColor="#b8955c" />
            <stop offset="1" stopColor="#6f5531" />
          </linearGradient>
        </defs>
        <path d="M0 4 Q0 0 4 0 H30 V7 H9 Q7 7 7 9 V30 H0 Z" fill="url(#brassg)" />
        <circle cx="4" cy="4" r="1.6" fill="#5a4426" />
        <path d="M0 4 Q0 0 4 0 H30" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth=".8" />
      </svg>
    </span>
  );
}
