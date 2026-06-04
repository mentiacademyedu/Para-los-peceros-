// Preflop range data + lookup.
//
// Ranges are stored as poker-notation strings and expanded on demand.
// RFI (raise-first-in) charts are reasonably accurate GTO baselines.
// vs-RFI (facing one raise) uses a position-bucket baseline model and is
// clearly flagged as approximate in the UI. Everything is editable/overridable
// via localStorage so you can paste your own solver outputs per spot.

import { expandRange, allHands, comboCount } from './hands.js'
import { positionBucket, heroIsIP } from './positions.js'

// ---- RFI: raise-first-in (folded to hero) -------------------------------
export const RFI = {
  '6max': {
    UTG: '22+, A2s+, KTs+, QTs+, JTs, T9s, 98s, 87s, 76s, AJo+, KQo',
    HJ:  '22+, A2s+, K9s+, Q9s+, J9s+, T8s+, 97s+, 87s, 76s, 65s, ATo+, KJo+, QJo, JTo',
    CO:  '22+, A2s+, K7s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 76s, 65s, 54s, A9o+, KTo+, QTo+, JTo',
    BTN: '22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 96s+, 85s+, 75s+, 64s+, 54s, 43s, A2o+, K8o+, Q9o+, J9o+, T9o, 98o',
    SB:  '22+, A2s+, K5s+, Q7s+, J8s+, T8s+, 97s+, 86s+, 76s, 65s, 54s, A4o+, K9o+, Q9o+, J9o+, T9o',
    // BB never has an RFI spot (action is closed to it preflop).
  },
  '9max': {
    UTG:    '66+, ATs+, KTs+, QTs+, JTs, T9s, AJo+, KQo',
    'UTG+1':'55+, A9s+, KTs+, QTs+, JTs, T9s, 98s, AJo+, KQo',
    'UTG+2':'44+, A8s+, A5s, KTs+, QTs+, J9s+, T9s, 98s, ATo+, KJo+, QJo',
    LJ:     '33+, A5s+, K9s+, Q9s+, J9s+, T8s+, 98s, 87s, ATo+, KJo+, QJo',
    HJ:     '22+, A2s+, K9s+, Q9s+, J9s+, T8s+, 97s+, 87s, 76s, ATo+, KJo+, QJo',
    CO:     '22+, A2s+, K8s+, Q9s+, J9s+, T8s+, 97s+, 87s, 76s, 65s, A9o+, KTo+, QTo+, JTo',
    BTN:    '22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 76s, 65s, 54s, A7o+, K9o+, Q9o+, JTo, T9o',
    SB:     '22+, A2s+, K7s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 76s, 65s, A5o+, K9o+, QTo+, JTo',
  },
}

// ---- vs-RFI baseline model (hero faces a single raise) -------------------
// Keyed by raiser bucket + whether hero is in position. raise = 3-bet range,
// call = flat range. Everything else folds. Approximate, editable.
const VS_RFI_BASE = {
  EARLY: {
    IP:  { raise: 'QQ+, AKs, AKo, A5s', call: 'JJ-22, AQs, AJs, ATs, KQs, KJs, QJs, JTs, T9s, 98s, AQo' },
    OOP: { raise: 'QQ+, AKs, AKo', call: 'JJ-66, AQs, AJs, KQs, QJs, JTs' },
  },
  MID: {
    IP:  { raise: 'TT+, AQs+, AKo, A5s, A4s', call: '99-22, AJs, ATs, KQs, KJs, KTs, QJs, QTs, JTs, T9s, 98s, 87s, AQo, AJo, KQo' },
    OOP: { raise: 'JJ+, AQs+, AKo, A5s', call: 'TT-44, AQs, AJs, KQs, KJs, QJs, JTs, T9s' },
  },
  LATE: {
    IP:  { raise: '99+, ATs+, A5s, A4s, KTs+, QTs+, AJo+, KQo', call: '88-22, A9s-A2s, KJs, KTs, QTs, JTs, T9s, 98s, 87s, 76s, KJo, QJo' },
    OOP: { raise: '99+, AJs+, A5s, A4s, KQs, AQo+', call: 'TT-22, ATs, KJs, KTs, QJs, JTs, T9s, 98s, AJo, KQo' },
  },
}

// The big blind defends much wider (great pot odds, closes the action).
const BB_VS_RFI = {
  EARLY: { raise: 'JJ+, AKs, AQs, A5s, AKo', call: '99-22, ATs+, KTs+, Q9s+, J9s+, T9s, 98s, 87s, 76s, 65s, 54s, AJo+, KQo, A5s-A2s' },
  MID:   { raise: 'TT+, AQs+, A5s, A4s, AKo', call: '99-22, A2s+, K8s+, Q9s+, J9s+, T8s+, 97s+, 86s+, 76s, 65s, 54s, ATo+, KJo+, QJo, JTo' },
  LATE:  { raise: '99+, AJs+, A8s, A5s-A2s, KJs+, AJo+, KQo', call: '88-22, A2s+, K5s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 75s+, 65s, 54s, A8o-A2o, K9o+, Q9o+, J9o+, T9o' },
}

// ---- vs-3-bet baseline model (hero opened, faces a single 3-bet) ---------
// Keyed by the OPENER's position bucket + whether the opener (hero) is in
// position vs the 3-bettor. raise = 4-bet range, call = flat. Approximate.
const VS_3BET_BASE = {
  EARLY: {
    IP:  { fourbet: 'QQ+, AKs, A5s, AKo', call: 'JJ-TT, AQs, KQs, AJs' },
    OOP: { fourbet: 'QQ+, AKs, A5s', call: 'JJ, TT, AQs, AKo' },
  },
  MID: {
    IP:  { fourbet: 'QQ+, AKs, AKo, A5s, A4s', call: 'TT-66, AQs, AJs, KQs, KJs, QJs, JTs, T9s, AQo' },
    OOP: { fourbet: 'QQ+, AKs, AKo, A5s', call: 'JJ-99, AQs, AJs, KQs' },
  },
  LATE: {
    IP:  { fourbet: 'JJ+, AQs+, AKo, A5s, A4s, KQs', call: 'TT-22, ATs, A9s, KJs, KTs, QTs, JTs, T9s, 98s, 87s, AQo, KQo' },
    OOP: { fourbet: 'QQ+, AKs, AKo, A5s', call: 'JJ-66, AQs, AJs, KQs, KJs, QJs, JTs, T9s, AQo' },
  },
}

// ---- vs-4-bet (you 3-bet, the opener 4-bets back): 5-bet jam / call / fold -
// Keyed by the 4-bettor's (opener's) bucket — tighter 4-bettors get more respect.
const VS_4BET_BY_OPENER = {
  EARLY: { fivebet: 'KK+, AKs', call: 'QQ' },
  MID:   { fivebet: 'KK+, AKs, A5s', call: 'QQ, AKo' },
  LATE:  { fivebet: 'QQ+, AKs, AKo, A5s', call: 'JJ, TT' },
  BLIND: { fivebet: 'QQ+, AKs, AKo, A5s', call: 'JJ, TT' },
}

// ---- vs-5-bet (you 4-bet as opener, face an all-in jam): call or fold -----
// Keyed by the jammer's (3-bettor's) bucket — wider jam ranges => call wider.
const VS_5BET_BY_JAMMER = {
  EARLY: 'KK+, AKs',
  MID: 'KK+, AKs',
  LATE: 'QQ+, AKs, AKo',
  BLIND: 'QQ+, AKs, AKo',
}

const STORAGE_KEY = 'caller.rangeOverrides.v1'

export function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}
export function saveOverride(key, value) {
  const all = loadOverrides()
  all[key] = value
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}
export function clearOverride(key) {
  const all = loadOverrides()
  delete all[key]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}
export function clearAllOverrides() {
  localStorage.removeItem(STORAGE_KEY)
}
export function overrideCount() {
  return Object.keys(loadOverrides()).length
}
export function exportOverrides() {
  return JSON.stringify(loadOverrides(), null, 2)
}
// Merge imported overrides into storage. Returns how many spots were imported.
export function importOverrides(json, { merge = true } = {}) {
  const incoming = JSON.parse(json)
  if (typeof incoming !== 'object' || incoming === null || Array.isArray(incoming)) {
    throw new Error('Invalid ranges file')
  }
  const base = merge ? loadOverrides() : {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...base, ...incoming }))
  return Object.keys(incoming).length
}

// Stable key for an override entry.
export function rangeKey(format, hero, context) {
  if (context.type === 'RFI') return `${format}|RFI|${hero}`
  if (context.type === 'vsRFI') return `${format}|vsRFI|${hero}|${context.raiser}`
  if (context.type === 'vs3betOpener') return `${format}|vs3betOpener|${hero}|${context.raiser}`
  if (context.type === 'vs4bet') return `${format}|vs4bet|${hero}|${context.raiser}`
  if (context.type === 'vs5bet') return `${format}|vs5bet|${hero}|${context.raiser}`
  return `${format}|${context.type}|${hero}`
}

// Resolve the strategy for a (format, hero, context) into a hand -> action map.
// action is 'R' (raise/3bet), 'C' (call), or 'F' (fold).
// Returns { map, approx, title, raiseStr, callStr }.
export function getStrategy(format, hero, context) {
  const overrides = loadOverrides()
  const key = rangeKey(format, hero, context)
  const ov = overrides[key]

  let raiseStr = '', callStr = '', approx = false

  if (ov) {
    raiseStr = ov.raise || ''
    callStr = ov.call || ''
    approx = false
  } else if (context.type === 'RFI') {
    raiseStr = RFI[format]?.[hero] || ''
    callStr = ''
    approx = false
  } else if (context.type === 'vsRFI') {
    const bucket = positionBucket(format, context.raiser)
    if (hero === 'BB') {
      const b = BB_VS_RFI[bucket] || BB_VS_RFI.MID
      raiseStr = b.raise; callStr = b.call
    } else {
      const ip = heroIsIP(format, hero, context.raiser) ? 'IP' : 'OOP'
      const b = (VS_RFI_BASE[bucket] || VS_RFI_BASE.MID)[ip]
      raiseStr = b.raise; callStr = b.call
    }
    approx = true
  } else if (context.type === 'vs3betOpener') {
    // hero opened and faces a single 3-bet; bucket by the opener's own seat.
    const bucket = positionBucket(format, hero)
    const ip = heroIsIP(format, hero, context.raiser) ? 'IP' : 'OOP'
    const b = (VS_3BET_BASE[bucket] || VS_3BET_BASE.MID)[ip]
    raiseStr = b.fourbet; callStr = b.call
    approx = true
  } else if (context.type === 'vs4bet') {
    // hero 3-bet and the opener 4-bet back: 5-bet jam, call, or fold.
    const bucket = positionBucket(format, context.raiser) // the 4-bettor (opener)
    const b = VS_4BET_BY_OPENER[bucket] || VS_4BET_BY_OPENER.MID
    raiseStr = b.fivebet; callStr = b.call
    approx = true
  } else if (context.type === 'vs5bet') {
    // hero 4-bet as opener and faces a 5-bet jam: call or fold only.
    const bucket = positionBucket(format, context.raiser) // the jammer (3-bettor)
    callStr = VS_5BET_BY_JAMMER[bucket] || VS_5BET_BY_JAMMER.MID
    raiseStr = ''
    approx = true
  } else {
    // cold vs3bet / multiway not yet modelled
    approx = true
  }

  // Title as an i18n key + params (the UI localizes it).
  let titleKey = 'title.rfi', titleParams = { pos: hero }
  if (context.type === 'vsRFI') { titleKey = 'title.vsRFI'; titleParams = { hero, raiser: context.raiser } }
  else if (context.type === 'vs3betOpener') { titleKey = 'title.vs3betPos'; titleParams = { hero, raiser: context.raiser } }
  else if (context.type === 'vs4bet') { titleKey = 'title.vs4betPos'; titleParams = { hero, raiser: context.raiser } }
  else if (context.type === 'vs5bet') { titleKey = 'title.vs5bet'; titleParams = { hero } }
  else if (context.type === 'vs3bet') { titleKey = 'title.vs3bet'; titleParams = { hero } }
  else if (context.type === 'multiway') { titleKey = 'title.multiway'; titleParams = { hero } }

  const raiseSet = expandRange(raiseStr)
  const callSet = expandRange(callStr)
  const map = {}
  for (const h of raiseSet) map[h] = 'R'
  for (const h of callSet) if (!map[h]) map[h] = 'C'

  return { map, approx, titleKey, titleParams, raiseStr, callStr, key }
}

// Look up the recommended action for a specific hand in a scenario.
export function actionForHand(format, hero, context, hand) {
  const { map } = getStrategy(format, hero, context)
  return map[hand] || 'F'
}

// Combo-weighted action distribution for a strategy map (out of 1326 combos).
export function rangeStats(map) {
  let R = 0, C = 0, F = 0
  for (const h of allHands()) {
    const w = comboCount(h)
    const a = map[h] || 'F'
    if (a === 'R') R += w
    else if (a === 'C') C += w
    else F += w
  }
  const total = R + C + F || 1
  return { R, C, F, total, pR: (100 * R) / total, pC: (100 * C) / total, pF: (100 * F) / total }
}
