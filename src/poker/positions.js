// Seats listed in PREFLOP action order (first to act -> last to act).
// UTG acts first; BB acts last preflop.
export const FORMATS = {
  '6max': ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  '9max': ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
}

// Postflop action order (first to act -> last). Blinds act first postflop,
// BTN acts last (most "in position"). Used to decide IP/OOP.
export const POSTFLOP_ORDER = {
  '6max': ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'],
  '9max': ['SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN'],
}

// Is `hero` in position vs `villain` (acts after them postflop)?
export function heroIsIP(format, hero, villain) {
  const order = POSTFLOP_ORDER[format]
  return order.indexOf(hero) > order.indexOf(villain)
}

// Coarse bucket for a raiser's position, used for baseline vs-RFI ranges.
export function positionBucket(format, pos) {
  const early = ['UTG', 'UTG+1', 'UTG+2', 'LJ']
  const mid = ['HJ', 'CO']
  const late = ['BTN', 'SB']
  if (early.includes(pos)) return 'EARLY'
  if (mid.includes(pos)) return 'MID'
  if (late.includes(pos)) return 'LATE'
  return 'BLIND'
}
