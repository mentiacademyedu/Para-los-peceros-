// The 13x13 hand matrix and a parser for poker range notation.

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
// Lower index = higher rank (A=0 ... 2=12).
const RI = Object.fromEntries(RANKS.map((r, i) => [r, i]))

// Canonical label for the grid cell at (row, col).
// Diagonal = pairs, above diagonal (col>row) = suited, below = offsuit.
export function cellHand(row, col) {
  const hi = RANKS[Math.min(row, col)]
  const lo = RANKS[Math.max(row, col)]
  if (row === col) return hi + hi
  return row < col ? hi + lo + 's' : hi + lo + 'o'
}

// All 169 hands in grid order (row-major).
export function allHands() {
  const out = []
  for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) out.push(cellHand(r, c))
  return out
}

// Normalize two concrete cards (e.g. 'Ah','Kh') to a hand class ('AKs').
export function cardsToHand(card1, card2) {
  const r1 = card1[0].toUpperCase()
  const r2 = card2[0].toUpperCase()
  const s1 = card1[1].toLowerCase()
  const s2 = card2[1].toLowerCase()
  if (r1 === r2) return r1 + r2
  const hi = RI[r1] < RI[r2] ? r1 : r2
  const lo = RI[r1] < RI[r2] ? r2 : r1
  return hi + lo + (s1 === s2 ? 's' : 'o')
}

// Expand a notation string ("22+, A2s+, KTs+, AJo+") into a Set of hands.
export function expandRange(str) {
  const set = new Set()
  if (!str) return set
  for (let token of str.split(',')) {
    token = token.trim()
    if (token) addToken(set, token)
  }
  return set
}

function addToken(set, t) {
  let m
  // pair plus: 77+
  if ((m = t.match(/^([2-9TJQKA])\1\+$/))) {
    for (let i = RI[m[1]]; i >= 0; i--) set.add(RANKS[i] + RANKS[i])
    return
  }
  // pair range: TT-77
  if ((m = t.match(/^([2-9TJQKA])\1-([2-9TJQKA])\2$/))) {
    const a = RI[m[1]], b = RI[m[2]]
    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) set.add(RANKS[i] + RANKS[i])
    return
  }
  // single pair: TT
  if ((m = t.match(/^([2-9TJQKA])\1$/))) { set.add(t); return }
  // suited/offsuit plus: K9s+ , ATo+
  if ((m = t.match(/^([2-9TJQKA])([2-9TJQKA])([so])\+$/))) {
    const hi = RI[m[1]], loStart = RI[m[2]], suit = m[3]
    for (let i = loStart; i > hi; i--) set.add(RANKS[hi] + RANKS[i] + suit)
    return
  }
  // range form: A2s-A5s (same high card) or 54s-87s (same gap connectors)
  if ((m = t.match(/^([2-9TJQKA])([2-9TJQKA])([so])-([2-9TJQKA])([2-9TJQKA])([so])$/))) {
    if (m[3] === m[6]) {
      const suit = m[3]
      // same high card
      if (m[1] === m[4]) {
        const hi = RI[m[1]]
        const a = RI[m[2]], b = RI[m[5]]
        for (let i = Math.min(a, b); i <= Math.max(a, b); i++) if (i > hi) set.add(RANKS[hi] + RANKS[i] + suit)
        return
      }
      // same gap connector run
      const hi1 = RI[m[1]], lo1 = RI[m[2]], hi2 = RI[m[4]], lo2 = RI[m[5]]
      if (lo1 - hi1 === lo2 - hi2) {
        const gap = lo1 - hi1
        for (let h = Math.min(hi1, hi2); h <= Math.max(hi1, hi2); h++) set.add(RANKS[h] + RANKS[h + gap] + suit)
        return
      }
    }
  }
  // single suited/offsuit: AQs
  if ((m = t.match(/^([2-9TJQKA])([2-9TJQKA])([so])$/))) {
    const hi = Math.min(RI[m[1]], RI[m[2]]), lo = Math.max(RI[m[1]], RI[m[2]])
    set.add(RANKS[hi] + RANKS[lo] + m[3])
    return
  }
  console.warn('Unparsed range token:', t)
}

// Number of combos a hand class represents (pairs=6, suited=4, offsuit=12).
export function comboCount(hand) {
  if (hand.length === 2) return 6
  return hand.endsWith('s') ? 4 : 12
}
