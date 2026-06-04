# Poker Caller Simulator

Yes i vibecoded this to be fast with it, dont cry i couldnt care less
Yes the data was checked by humans

> 🇪🇸 Español abajo · 🇬🇧 English below

---

## 🇪🇸 Español

Entrenador de rangos preflop para estudiar decisiones GTO de apertura y de
respuesta a una subida. Reconstruye manos que jugaste, o practica spots
aleatorios, en 6-max y 9-max. Interfaz en español o inglés (botón EN/ES).

### Ejecutar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción en dist/
```

### Cómo funciona

Tres pestañas (arriba a la derecha):

- **Analizar mano** — la herramienta principal. Haz clic en un asiento para que
  seas *tú*, marca lo que hizo cada jugador (Foldear / Pagar / Subir) —incluido
  SB/BB que actúan después de ti—, elige tus dos cartas y te muestra la acción
  recomendada (subir / pagar / retirarse) más la cuadrícula completa del rango.
  Úsala para revisar manos que sientes que jugaste mal.
- **Entrenador** — spot aleatorio: adivinas retirarte/pagar/subir, te califica,
  lleva el puntaje y luego revela el rango.
- **Editar rangos** — pega tu propio output del solver (notación de poker) para
  cualquier spot. Se guarda en tu navegador (localStorage) y se usa en todos lados.

### Precisión de los rangos

- **Rangos de apertura (RFI)** — bases GTO razonables para ambos formatos.
- **Frente a una subida** — modelo base por posición, marcado como "aproximado"
  en la interfaz. Sobrescribe cualquier spot en *Editar rangos* con tu solver.
- **Frente a un 3-bet / multiway** — aún no modelado (Fase 2).

### Notación

`22+` `A2s+` `KTo+` `T9s` `A5s-A2s` `54s-87s` — separados por comas.

### Hoja de ruta

- Fase 1 (lista): preflop RFI + vs-RFI, analizar + entrenador + editor de rangos.
- Fase 2: botes de 3-bet / 4-bet, rangos de squeeze multiway, postflop (requiere
  outputs del solver por textura de board).

---

## 🇬🇧 English

A preflop range trainer for studying GTO opening / facing-a-raise decisions.
Reconstruct hands you played, or drill random spots, for 6-max and 9-max.
Interface in Spanish or English (EN/ES toggle).

### Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

### How it works

Three tabs (top right):

- **Analyze a hand** — the main tool. Click a seat to make it *you*, set what
  each player did (Fold / Call / Raise) — including SB/BB acting after you —
  pick your two cards, and it shows the recommended action (raise / call / fold)
  plus the full range grid. Use this to check hands you felt you misplayed.
- **Trainer** — random spot, you guess fold/call/raise, it grades you and keeps
  score, then reveals the range.
- **Edit ranges** — paste your own solver output (poker notation) for any spot.
  Saved in your browser (localStorage) and used everywhere afterwards.

### Range accuracy

- **RFI (open) ranges** — reasonable GTO baselines for both formats.
- **Facing a raise** — a position-bucket baseline model, flagged "approximate"
  in the UI. Override any spot in *Edit ranges* with real solver output.
- **Facing a 3-bet / multiway** — not modelled yet (Phase 2).

### Notation reference

`22+` `A2s+` `KTo+` `T9s` `A5s-A2s` `54s-87s` — comma separated.

### Roadmap

- Phase 1 (done): preflop RFI + vs-RFI, analyze + trainer + range editor.
- Phase 2: 3-bet / 4-bet pots, multiway squeeze ranges, postflop (needs solver
  outputs per board texture).

---

## Code map

- `src/poker/hands.js` — 13×13 grid + range-notation parser
- `src/poker/positions.js` — seat orders, IP/OOP, position buckets
- `src/poker/ranges.js` — range data + strategy lookup + overrides
- `src/poker/scenario.js` — derives hero's context from table action
- `src/i18n.js` — EN/ES strings + translate helper
- `src/components/` — RangeGrid, PokerTable
- `src/App.jsx` — the three tabs
