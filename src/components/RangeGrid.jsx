import { RANKS, cellHand } from '../poker/hands.js'

const COLORS = { R: '#e2483d', C: '#3aa757', F: '#23262d' }

// map: { hand: 'R'|'C'|'F' }. highlight: a hand string to outline.
export default function RangeGrid({ map = {}, highlight, onCellClick, compact }) {
  return (
    <div className={`grid ${compact ? 'grid-compact' : ''}`}>
      {Array.from({ length: 13 }, (_, r) =>
        Array.from({ length: 13 }, (_, c) => {
          const hand = cellHand(r, c)
          const action = map[hand] || 'F'
          const isHi = highlight === hand
          return (
            <div
              key={`${r}-${c}`}
              className={`cell ${isHi ? 'cell-hi' : ''}`}
              style={{ background: COLORS[action] }}
              onClick={onCellClick ? () => onCellClick(hand) : undefined}
              title={hand}
            >
              <span>{hand}</span>
            </div>
          )
        })
      )}
    </div>
  )
}

export function Legend() {
  return (
    <div className="legend">
      <span><i style={{ background: COLORS.R }} /> Raise / 3-bet</span>
      <span><i style={{ background: COLORS.C }} /> Call</span>
      <span><i style={{ background: COLORS.F }} /> Fold</span>
    </div>
  )
}
