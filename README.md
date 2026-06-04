# Poker Caller Simulator

Yes i vibecoded this to be fast with it, dont cry i couldnt care less
Yes the data was checked by humans

A preflop range trainer for studying GTO opening / facing-a-raise decisions.
Reconstruct hands you played, or drill random spots, for 6-max and 9-max.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## How it works

Three tabs (top right):

- **Analyze a hand** — the main tool. Click a seat to make it *you*, set what
  each earlier player did (Fold / Call / Raise), pick your two cards, and it
  shows the recommended action (raise / call / fold) plus the full range grid.
  Use this to check hands you felt you misplayed.
- **Trainer** — random spot, you guess fold/call/raise, it grades you and keeps
  score, then reveals the range.
- **Edit ranges** — paste your own solver output (poker notation) for any spot.
  Saved in your browser (localStorage) and used everywhere afterwards.

## Range accuracy

- **RFI (open) ranges** — reasonable GTO baselines for both formats.
- **Facing a raise** — a position-bucket baseline model, flagged "approximate"
  in the UI. Override any spot in *Edit ranges* with real solver output.
- **Facing a 3-bet / multiway** — not modelled yet (Phase 2).

## Notation reference

`22+` `A2s+` `KTo+` `T9s` `A5s-A2s` `54s-87s` — comma separated.

## Roadmap

- Phase 1 (done): preflop RFI + vs-RFI, analyze + trainer + range editor.
- Phase 2: 3-bet / 4-bet pots, multiway squeeze ranges, postflop (needs solver
  outputs per board texture).

## Code map

- `src/poker/hands.js` — 13×13 grid + range-notation parser
- `src/poker/positions.js` — seat orders, IP/OOP, position buckets
- `src/poker/ranges.js` — range data + strategy lookup + overrides
- `src/poker/scenario.js` — derives hero's context from table action
- `src/components/` — RangeGrid, PokerTable
- `src/App.jsx` — the three tabs
