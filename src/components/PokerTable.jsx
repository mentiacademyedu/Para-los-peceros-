import { FORMATS } from '../poker/positions.js'

const ACTION_LABEL = { fold: 'Fold', call: 'Call', raise: 'Raise' }
const ACTION_CLASS = { fold: 'a-fold', call: 'a-call', raise: 'a-raise' }

// Visual table. Click a seat name to make it hero. EVERY non-hero seat gets
// fold/call/raise toggles (before AND after hero), so you can walk the whole
// hand. Hero gets its own action chips representing what you did.
export default function PokerTable({ format, hero, actions, heroAction, onHero, onAction, onHeroAction }) {
  const seats = FORMATS[format]
  const n = seats.length
  const heroIdx = seats.indexOf(hero)

  return (
    <div className="table-wrap">
      <div className="felt">
        <div className="felt-center">
          <span className="felt-title">{format.toUpperCase()}</span>
        </div>
        {seats.map((pos, i) => {
          // place around an ellipse, hero anchored at the bottom
          const rel = (i - heroIdx + n) % n
          const angle = 90 + (rel / n) * 360 // degrees, 90 = bottom
          const rad = (angle * Math.PI) / 180
          const x = 50 + 41 * Math.cos(rad)
          const y = 50 + 40 * Math.sin(rad)
          const isHero = pos === hero
          const before = i < heroIdx
          const a = isHero ? heroAction : actions[pos]
          const set = isHero ? onHeroAction : (act) => onAction(pos, act)
          return (
            <div
              key={pos}
              className={`seat ${isHero ? 'seat-hero' : ''} ${before ? 'seat-before' : 'seat-after'}`}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <button className="seat-name" onClick={() => onHero(pos)} title="Set as hero (you)">
                {pos}{isHero ? ' ★' : ''}
              </button>
              {isHero && <div className="seat-tag hero-tag">YOU</div>}
              <div className="seat-actions">
                {['fold', 'call', 'raise'].map((act) => (
                  <button
                    key={act}
                    className={`mini ${a === act ? ACTION_CLASS[act] + ' on' : ''}`}
                    onClick={() => set(a === act ? null : act)}
                    title={`${pos} ${ACTION_LABEL[act]}`}
                  >
                    {ACTION_LABEL[act][0]}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
