// Derive hero's preflop decision context from the action around the table.

import { FORMATS } from './positions.js'

// actions: { [position]: 'fold' | 'call' | 'raise' | null }
// Returns the context hero faces given who acted BEFORE hero.
//   { type, raiser, callers, note, supported }
export function deriveContext(format, hero, actions) {
  const order = FORMATS[format]
  const heroIdx = order.indexOf(hero)
  const before = order.slice(0, heroIdx)

  const raisers = before.filter((p) => actions[p] === 'raise')
  const callers = before.filter((p) => actions[p] === 'call')

  if (raisers.length === 0) {
    if (hero === 'BB' && callers.length > 0) {
      return {
        type: 'multiway', raiser: null, callers,
        note: 'Limped pot — BB checks its option. Not modelled; use judgment.',
        supported: false,
      }
    }
    return {
      type: 'RFI', raiser: null, callers: [],
      note: callers.length ? 'Treating limps as fold-equivalent for the RFI baseline.' : '',
      supported: true,
    }
  }

  if (raisers.length === 1) {
    const raiser = raisers[0]
    if (callers.length === 0) {
      return { type: 'vsRFI', raiser, callers: [], note: '', supported: true }
    }
    return {
      type: 'multiway', raiser, callers,
      note: `Multiway: ${raiser} raised, ${callers.join(', ')} called. Baseline uses the heads-up vs-open range — tighten in practice (squeeze dynamics).`,
      supported: true,
    }
  }

  // Two or more raises before hero => hero faces a 3-bet (or more).
  return {
    type: 'vs3bet', raiser: raisers[raisers.length - 1], callers,
    note: 'Facing a 3-bet+. Not yet modelled (Phase 2). No reliable range shown.',
    supported: false,
  }
}

// What hero faces AFTER acting, based on the seats that act after hero.
// heroAction is 'fold' | 'call' | 'raise' | null.
// Returns { type, note, supported } or null if there's no follow-up decision.
export function deriveFollowup(format, hero, actions, heroAction) {
  if (!heroAction || heroAction === 'fold') return null
  const order = FORMATS[format]
  const heroIdx = order.indexOf(hero)
  const after = order.slice(heroIdx + 1)
  const raisersAfter = after.filter((p) => actions[p] === 'raise')
  const callersAfter = after.filter((p) => actions[p] === 'call')

  if (heroAction === 'raise') {
    if (raisersAfter.length > 0) {
      return {
        type: 'vs3bet',
        note: `${raisersAfter.join(', ')} 3-bet you. Facing a 3-bet isn't modelled yet (Phase 2) — no range shown.`,
        supported: false,
      }
    }
    if (callersAfter.length > 0) {
      return {
        type: 'postflop',
        note: `${callersAfter.join(', ')} called your raise — you see a flop ${callersAfter.length > 1 ? 'multiway' : 'heads-up'}. Postflop is Phase 2.`,
        supported: false,
      }
    }
    return { type: 'won', note: 'Everyone folds to your raise — you take it down preflop.', supported: true }
  }

  // hero called
  if (raisersAfter.length > 0) {
    return {
      type: 'vs3bet',
      note: `${raisersAfter.join(', ')} raised behind after your call (squeeze) — not modelled yet.`,
      supported: false,
    }
  }
  return {
    type: 'postflop',
    note: callersAfter.length
      ? `You and ${callersAfter.join(', ')} see a flop multiway. Postflop is Phase 2.`
      : 'You call and see a flop. Postflop is Phase 2.',
    supported: false,
  }
}

// A human-readable line describing the action so far.
export function describeAction(format, hero, actions) {
  const order = FORMATS[format]
  const heroIdx = order.indexOf(hero)
  const parts = []
  for (let i = 0; i < heroIdx; i++) {
    const p = order[i]
    const a = actions[p]
    if (a) parts.push(`${p} ${a}s`)
  }
  return parts.length ? parts.join(', ') : 'folds to hero'
}
