import type { ReactNode } from "react";

const INK = "var(--ink)";
const RED = "var(--vermilion)";

function Emblem({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 48 48" width="56" height="56" role="img" aria-label={label} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export const STICKERS: { kind: string; label: string; node: ReactNode }[] = [
  { kind: "st-hecho", label: "Hecho", node: <span className="stamp">Hecho</span> },
  { kind: "st-victoria", label: "Victoria", node: <span className="stamp">Victoria</span> },
  { kind: "st-limpio", label: "Día limpio", node: <span className="stamp">Día limpio</span> },
  { kind: "st-fiel", label: "Fiel", node: <span className="stamp">Fiel</span> },
  { kind: "st-firme", label: "No me rindo", node: <span className="stamp">No me rindo</span> },
  {
    kind: "seal",
    label: "Sello de lacre",
    node: (
      <svg viewBox="0 0 48 48" width="58" height="58" role="img" aria-label="Sello de lacre">
        <path
          d="M24 3 L28 6 L33 5 L35 9 L40 11 L39 16 L43 20 L40 24 L43 28 L39 32 L40 37 L35 39 L33 43 L28 42 L24 45 L20 42 L15 43 L13 39 L8 37 L9 32 L5 28 L8 24 L5 20 L9 16 L8 11 L13 9 L15 5 L20 6 Z"
          fill="#8e2219"
        />
        <circle cx="24" cy="24" r="12.5" fill="none" stroke="#5e130d" strokeWidth="1.6" />
        <circle cx="24" cy="24" r="12.5" fill="none" stroke="rgba(255,190,170,.35)" strokeWidth=".8" transform="translate(-.6 -.6)" />
        <text x="24" y="30" textAnchor="middle" fontSize="17" fill="#5e130d" style={{ fontFamily: "var(--font-fell-sc)" }}>A</text>
      </svg>
    ),
  },
  { kind: "cross", label: "Cruz", node: <Emblem label="Cruz"><path d="M24 5 V43 M13 16 H35" strokeWidth="3.4" strokeLinecap="square" /></Emblem> },
  {
    kind: "anchor",
    label: "Ancla",
    node: (
      <Emblem label="Ancla">
        <circle cx="24" cy="9" r="3.5" />
        <path d="M24 12.5 V41 M16 18 H32 M9 29 Q11 41 24 41 Q37 41 39 29 M6 32 L9 29 L12 32 M36 32 L39 29 L42 32" />
      </Emblem>
    ),
  },
  {
    kind: "mountain",
    label: "Montaña",
    node: (
      <Emblem label="Montaña">
        <path d="M4 40 L18 15 L26 28 L31 21 L44 40 Z" />
        <path d="M14 22 L18 15 L22 22 L20 20.5 L18 23 L16 20.5 Z" fill={INK} />
      </Emblem>
    ),
  },
  {
    kind: "compass",
    label: "Brújula",
    node: (
      <Emblem label="Brújula">
        <circle cx="24" cy="24" r="17" />
        <path d="M24 4 V8 M24 40 V44 M4 24 H8 M40 24 H44" />
        <path d="M24 11 L28.5 24 H19.5 Z" fill={RED} stroke={RED} />
        <path d="M24 37 L19.5 24 H28.5 Z" fill={INK} />
      </Emblem>
    ),
  },
  {
    kind: "flame",
    label: "Llama",
    node: (
      <Emblem label="Llama">
        <path d="M24 43 C14 43 10 35 13.5 27.5 C16 22 20.5 19.5 19 11 C26.5 15 31 21.5 30 29.5 C33 27.5 34 24.5 33 21 C38.5 27.5 38.5 43 24 43 Z" fill={RED} stroke={RED} fillOpacity=".12" />
      </Emblem>
    ),
  },
  {
    kind: "dumbbell",
    label: "Pesa",
    node: (
      <Emblem label="Pesa">
        <path d="M13 24 H35" strokeWidth="3" />
        <rect x="8" y="15" width="5.5" height="18" rx="1.2" fill={INK} />
        <rect x="34.5" y="15" width="5.5" height="18" rx="1.2" fill={INK} />
        <rect x="4" y="19" width="4" height="10" rx="1" fill={INK} />
        <rect x="40" y="19" width="4" height="10" rx="1" fill={INK} />
      </Emblem>
    ),
  },
  {
    kind: "coffee",
    label: "Café",
    node: (
      <Emblem label="Café">
        <path d="M11 19 H33 V31 Q33 40 22 40 Q11 40 11 31 Z M33 22 Q40 22 40 27 Q40 32 33 32" />
        <path d="M17 7 Q19.5 10 17 13 M23 7 Q25.5 10 23 13" />
      </Emblem>
    ),
  },
  {
    kind: "sun",
    label: "Amanecer",
    node: (
      <Emblem label="Amanecer">
        <path d="M10 34 A14 14 0 0 1 38 34 Z" />
        <path d="M4 34 H44 M24 10 V15 M10.5 18.5 L14 22 M37.5 18.5 L34 22 M4.5 27 H8.5 M39.5 27 H43.5" />
        <path d="M12 40 H36" />
      </Emblem>
    ),
  },
  {
    kind: "moon",
    label: "Noche",
    node: (
      <Emblem label="Noche">
        <path d="M29 7 A17 17 0 1 0 41 33 A13.5 13.5 0 1 1 29 7 Z" fill={INK} fillOpacity=".08" />
        <path d="M37 10 V15 M34.5 12.5 H39.5" strokeWidth="1.6" />
      </Emblem>
    ),
  },
  {
    kind: "crown",
    label: "Corona",
    node: (
      <Emblem label="Corona">
        <path d="M8 33 L10 15 L18 25 L24 11 L30 25 L38 15 L40 33 Z" />
        <path d="M8 38 H40" strokeWidth="3" />
      </Emblem>
    ),
  },
  {
    kind: "shield",
    label: "Escudo",
    node: (
      <Emblem label="Escudo">
        <path d="M24 5 L40 11 V23 C40 33 33 39.5 24 43 C15 39.5 8 33 8 23 V11 Z" />
        <path d="M24 13 V35 M16.5 21 H31.5" strokeWidth="2.8" />
      </Emblem>
    ),
  },
  {
    kind: "bible",
    label: "Biblia",
    node: (
      <Emblem label="Biblia">
        <path d="M6 12 Q15 9 24 13 Q33 9 42 12 V38 Q33 35 24 39 Q15 35 6 38 Z M24 13 V39" />
        <path d="M33 17 V29 M29.5 21 H36.5" stroke={RED} />
      </Emblem>
    ),
  },
  {
    kind: "heart",
    label: "Angélica",
    node: (
      <Emblem label="Corazón">
        <path d="M24 40 C10 30.5 6 22.5 10 15.5 C13.5 9.5 21 10.5 24 17 C27 10.5 34.5 9.5 38 15.5 C42 22.5 38 30.5 24 40 Z" stroke={RED} fill={RED} fillOpacity=".12" />
      </Emblem>
    ),
  },
  {
    kind: "key",
    label: "Llave",
    node: (
      <Emblem label="Llave">
        <circle cx="13" cy="24" r="7" />
        <path d="M20 24 H43 M37 24 V30 M42 24 V29" />
      </Emblem>
    ),
  },
  {
    kind: "paw",
    label: "Huella",
    node: (
      <Emblem label="Huella">
        <path d="M24 26 C30 26 35 32 34 37 C33 41 28 40 24 39 C20 40 15 41 14 37 C13 32 18 26 24 26 Z" fill={INK} />
        <ellipse cx="13" cy="20" rx="3.4" ry="4.4" fill={INK} />
        <ellipse cx="20" cy="13" rx="3.4" ry="4.6" fill={INK} />
        <ellipse cx="28" cy="13" rx="3.4" ry="4.6" fill={INK} />
        <ellipse cx="35" cy="20" rx="3.4" ry="4.4" fill={INK} />
      </Emblem>
    ),
  },
];

export const STICKER_NODES: Record<string, ReactNode> = Object.fromEntries(STICKERS.map((s) => [s.kind, s.node]));

export const STICKER_SHEETS: { name: string; kinds: string[] }[] = [
  { name: "Sellos", kinds: ["st-hecho", "st-victoria", "st-limpio", "st-fiel", "st-firme", "seal"] },
  { name: "Emblemas", kinds: ["cross", "anchor", "mountain", "compass", "shield", "crown", "key", "flame"] },
  { name: "Día a día", kinds: ["dumbbell", "coffee", "sun", "moon", "bible", "heart", "paw"] },
];
