// Derive hero's preflop decision context from the action around the table.
// Notes are returned as i18n keys (+ params) so the UI can localize them.

import { FORMATS } from './positions.js'

// actions: { [position]: 'fold' | 'call' | 'raise' | null }
// Returns { type, raiser, callers, noteKey, noteParams, supported }.
export function deriveContext(format, hero, actions) {
  const order = FORMATS[format]
  const heroIdx = order.indexOf(hero)
  const before = order.slice(0, heroIdx)

  const raisers = before.filter((p) => actions[p] === 'raise')
  const callers = before.filter((p) => actions[p] === 'call')

  if (raisers.length === 0) {
    if (hero === 'BB' && callers.length > 0) {
      return { type: 'multiway', raiser: null, callers, noteKey: 'note.bbLimp', noteParams: null, supported: false }
    }
    return { type: 'RFI', raiser: null, callers: [], noteKey: callers.length ? 'note.limpFold' : null, noteParams: null, supported: true }
  }

  if (raisers.length === 1) {
    const raiser = raisers[0]
    if (callers.length === 0) {
      return { type: 'vsRFI', raiser, callers: [], noteKey: null, noteParams: null, supported: true }
    }
    return {
      type: 'multiway', raiser, callers,
      noteKey: 'note.multiway', noteParams: { raiser, callers: callers.join(', ') }, supported: true,
    }
  }

  return {
    type: 'vs3bet', raiser: raisers[raisers.length - 1], callers,
    noteKey: 'note.vs3bet', noteParams: null, supported: false,
  }
}

// What hero faces AFTER acting. Returns { type, supported, noteKey, noteParams }
// or null. noteParams may carry a `wayKey` that the UI resolves and injects as `way`.
export function deriveFollowup(format, hero, actions, heroAction) {
  if (!heroAction || heroAction === 'fold') return null
  const order = FORMATS[format]
  const heroIdx = order.indexOf(hero)
  const after = order.slice(heroIdx + 1)
  const raisersAfter = after.filter((p) => actions[p] === 'raise')
  const callersAfter = after.filter((p) => actions[p] === 'call')

  if (heroAction === 'raise') {
    if (raisersAfter.length > 0) {
      return { type: 'vs3bet', supported: false, noteKey: 'fu.3bet', noteParams: { who: raisersAfter.join(', ') } }
    }
    if (callersAfter.length > 0) {
      return {
        type: 'postflop', supported: false, noteKey: 'fu.calledRaise',
        noteParams: { who: callersAfter.join(', '), wayKey: callersAfter.length > 1 ? 'way.multiway' : 'way.headsup' },
      }
    }
    return { type: 'won', supported: true, noteKey: 'fu.won', noteParams: null }
  }

  // hero called
  if (raisersAfter.length > 0) {
    return { type: 'vs3bet', supported: false, noteKey: 'fu.squeeze', noteParams: { who: raisersAfter.join(', ') } }
  }
  return callersAfter.length
    ? { type: 'postflop', supported: false, noteKey: 'fu.callFlopMulti', noteParams: { who: callersAfter.join(', ') } }
    : { type: 'postflop', supported: false, noteKey: 'fu.callFlop', noteParams: null }
}

// Localized "action so far" line. `t` is the translate function.
export function describeAction(format, hero, actions, t) {
  const order = FORMATS[format]
  const heroIdx = order.indexOf(hero)
  const parts = []
  for (let i = 0; i < heroIdx; i++) {
    const p = order[i]
    const a = actions[p]
    if (a) parts.push(`${p} ${t('verb.' + a)}`)
  }
  return parts.length ? parts.join(', ') : t('foldsToHero')
}
