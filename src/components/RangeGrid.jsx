import { cellHand } from '../poker/hands.js'

// GTO Wizard-style palette: Raise = red, Call = green, Fold = blue.
export const COLORS = { R: '#e0544a', C: '#5bab53', F: '#4a83c3' }
const LABEL = { R: 'Raise', C: 'Call', F: 'Fold' }

// Turn a cell value into proportional segments.
// value can be 'R'|'C'|'F' (pure) or { R, C, F } frequencies.
function segments(value) {
  if (!value || typeof value === 'string') return [[value || 'F', 1]]
  const entries = ['R', 'C', 'F'].filter((a) => value[a] > 0).map((a) => [a, value[a]])
  const sum = entries.reduce((s, [, v]) => s + v, 0) || 1
  return entries.map(([a, v]) => [a, v / sum])
}

// map: { hand: 'R'|'C'|'F' | {R,C,F} }. highlight: a hand string to outline.
export default function RangeGrid({ map = {}, highlight, onCellClick, hideFills }) {
  return (
    <div className="grid">
      {Array.from({ length: 13 }, (_, r) =>
        Array.from({ length: 13 }, (_, c) => {
          const hand = cellHand(r, c)
          const segs = hideFills ? [['F', 1]] : segments(map[hand])
          const isHi = highlight === hand
          return (
            <div
              key={`${r}-${c}`}
              className={`cell ${isHi ? 'cell-hi' : ''}`}
              onClick={onCellClick ? () => onCellClick(hand) : undefined}
              title={hand}
            >
              <div className="cell-fill">
                {segs.map(([a, frac], i) => (
                  <span key={i} className="seg" style={{ width: `${frac * 100}%`, background: COLORS[a] }} />
                ))}
              </div>
              <span className="cell-label">{hand}</span>
            </div>
          )
        })
      )}
    </div>
  )
}

// GTOW-style stacked frequency bar + percentages.
export function StrategyBar({ stats }) {
  const parts = [['R', stats.pR], ['C', stats.pC], ['F', stats.pF]]
  return (
    <div className="stratbar">
      <div className="stratbar-track">
        {parts.map(([a, p]) => (p > 0 ? <div key={a} className="stratbar-seg" style={{ width: `${p}%`, background: COLORS[a] }} /> : null))}
      </div>
      <div className="stratbar-legend">
        {parts.map(([a, p]) => (
          <span key={a}><i style={{ background: COLORS[a] }} />{LABEL[a]} <b>{p.toFixed(1)}%</b></span>
        ))}
      </div>
    </div>
  )
}

export function Legend() {
  return (
    <div className="legend">
      {['R', 'C', 'F'].map((a) => (
        <span key={a}><i style={{ background: COLORS[a] }} />{LABEL[a]}</span>
      ))}
    </div>
  )
}
