# Design

The notebook is a leather-bound field journal lying open on a dark desk under a lamp. The book is the light source; everything around it is walnut and shadow.

## World

- **Desk**: `--desk #15100c` with a warm radial lamp pool (`#3a2c20`). Never textured.
- **Leather** (per cover, `data-cover` on `<html>`): oxblood `#4a1616`, saddle `#6b3a1c`, black `#1d1a19`, English green `#1f3527`; each has `-hi` / `-lo` tones for the lit and shadowed side. A blind-tooled rule is pressed 6px inside the edge.
- **Brass**: `--brass #b8955c`, `--brass-hi #e3c88f`, `--brass-lo #6f5531`. Used for corners, the cover plate, and the one urgent control: "Momento difícil".
- **Paper**: ivory `--paper #f4eddc`, edges `--paper-edge #d9cdb2`. Paper styles (`data-paper`): ruled (blue `--rule #b9cadb`, 32px line), dots, graph, plain. Graph and ruled patterns are the actual notebook paper, not decoration.
- **Ink**: iron-gall blue-black `--ink #1c2333`; `--ink-2 #434a5c` secondary; `--ink-3 #5f6372` captions/placeholders (≥4.5:1 on paper).
- **Vermilion** `--vermilion #a8321f`: ledger margins, stamps, verse references, today markers, falls. **Ribbon** `#8b1a1a`.

## Type

- **IM Fell English SC** (`--font-engraved`): engraved small caps for titles, section heads, labels on leather. Its old-style "1" reads as "I", so any digit inside engraved text is wrapped with `<Figs>` / `.fig` (Archivo lining figures).
- **IM Fell English italic** (`--font-fell`): Scripture and notes.
- **Archivo** (`--font-ui`): everything written and operated; `.num` for tabular numerals.

## Structure

- Desktop: a CSS 3D ring binder on the desk (`components/book/Book3D.tsx`). Each sheet is a leaf with two faces (front = right page of spread *j*, back = left page of spread *j+1*); the front cover's inside carries spread 0's left page; the last right page is glued to the back cover. Leaves turn around the spine (850ms, staggered 70ms when jumping). Six brass rings float above the spine. Index tabs live on their leaves, so they move to the left side as pages turn.
- The desk: brass "now" plate (month, days left, day of year) top-left; tools column left (pen/marker/eraser + inks, sticker sheets, tape rolls, photo); sync + "Momento difícil" top-right; control bar bottom. Drag the desk to rotate (rx −5…60°, ry ±55°), wheel to zoom; pen mode squares the view to frontal.
- Only the two faces in view are interactive (`inert` + `pointer-events`); 3D containers are pointer-transparent.
- Phone: one page at a time on a leather ground, header with month and days left, brass FAB for tools, bottom nav (Hoy, Mes, Trackers, Retos, Fe, Más).
- Decorations (`components/book/Deco.tsx`) are stored per page in `deco:<page-id>`, normalised by page width so desktop and phone agree.

## Components

- `.check`: an ink box; checking draws an X in two strokes (the one authored micro-moment).
- `.stamp`: rubber stamp in vermilion, rotated −4°.
- Tally (`components/Tally.tsx`): streaks as groups of five strokes, fifth stroke in vermilion.
- Stickers: crisp vector emblems and stamps, draggable on any day page.
- Buttons: `.ink-btn` (filled ink), `.ghost`, `.red` (only for "registrar caída"); `.brass-btn` on leather only.
- No cards-as-layout: sections are separated by rules and space, like a ledger.

## Motion

- Page turn: real leaves rotate around the spine; dragging the outer edge turns a page by hand and it completes past 90° or on a flick.
- Login: the cover swings open (1s) to the first page.
- Stamps land with an expo ease-out. Everything collapses to instant under `prefers-reduced-motion`.
