import type { Challenge, DayDoc, MoneyDoc, Settings } from "./types";

export const START_DATE = "2026-11-11";

export const DEFAULT_SETTINGS: Settings = {
  owner: "Alejandro Gabriel Lamont Bencomo",
  initials: "A. G. L. B.",
  cover: "oxblood",
  paper: "ruled",
  startDate: START_DATE,
  habits: [
    { id: "phone", name: "Primera hora sin celular", hint: "Nada de reels al despertar", active: true },
    { id: "pray", name: "Oración y Palabra", hint: "Antes de abrir cualquier app", active: true },
    { id: "bed", name: "Cama tendida", active: true },
    { id: "room", name: "Cuarto y ropa en orden", active: true },
    { id: "teeth", name: "Cepillado mañana y noche", active: true },
    { id: "gym", name: "Gimnasio", hint: "Ya está pagado: ve", active: true },
    { id: "work", name: "Dos horas de trabajo profundo", hint: "Clientes, prospectos o proyecto propio", active: true },
    { id: "sleep", name: "En la cama antes de las 11:30", active: true },
  ],
  reasons: [
    "Quiero estar cerca de Dios y vivir limpio delante de Él.",
    "Angélica merece un hombre íntegro que trabaje duro por su futuro.",
    "No quiero repetir lo que me hizo daño ni pasarlo a mis hijos.",
    "Sé hacer cosas que valen dinero. El talento sin disciplina se pierde.",
  ],
  payday: "2026-12-11",
  dates: [
    { id: "angelica", label: "Cumpleaños de Angélica", date: "11-22" },
  ],
};

export function emptyDay(): DayDoc {
  return { log: [], habits: {}, gratitude: ["", "", ""], note: "", stickers: [] };
}

export const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: "purity",
    name: "Pureza",
    why: "Guardar mis ojos, mi mente y mi cuerpo para Dios y para Angélica.",
    kind: "abstain",
    start: "2026-11-11T06:00:00",
    target: 90,
    falls: [],
    wins: [],
  },
  {
    id: "noreels",
    name: "Mañanas sin reels",
    why: "La primera hora es de Dios y de mi trabajo, no del algoritmo.",
    kind: "habit",
    habitId: "phone",
    start: START_DATE,
    target: 40,
    falls: [],
    wins: [],
  },
  {
    id: "gym",
    name: "Volver al gimnasio",
    why: "Disciplina en el cuerpo, disciplina en todo.",
    kind: "habit",
    habitId: "gym",
    start: START_DATE,
    target: 30,
    falls: [],
    wins: [],
  },
];

export const DEFAULT_MONEY: MoneyDoc = {
  opening: 180,
  openingDate: START_DATE,
  txns: [],
  clients: [],
  goal: { name: "Fondo de emergencia", amount: 500, saved: 0 },
};

export const SOS_ACTIONS = [
  "Levántate y sal del cuarto ahora mismo.",
  "Deja el teléfono en otra habitación por 15 minutos.",
  "20 flexiones o 40 sentadillas. Ya.",
  "Ducha fría de 2 minutos.",
  "Ora en voz alta, aunque sea una frase.",
  "Escríbele a alguien de confianza o sal a caminar con los perros.",
];
