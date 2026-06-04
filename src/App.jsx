import { useMemo, useState } from 'react'
import { FORMATS } from './poker/positions.js'
import { RANKS, cardsToHand, comboCount, expandRange } from './poker/hands.js'
import { deriveContext, describeAction, deriveFollowup } from './poker/scenario.js'
import { getStrategy, saveOverride, clearOverride, rangeKey } from './poker/ranges.js'
import RangeGrid, { Legend } from './components/RangeGrid.jsx'
import PokerTable from './components/PokerTable.jsx'

const SUITS = [
  { s: 's', sym: '♠', color: '#cfd6e4' },
  { s: 'h', sym: '♥', color: '#ff6b6b' },
  { s: 'd', sym: '♦', color: '#5aa9ff' },
  { s: 'c', sym: '♣', color: '#5ad18a' },
]
const ACTION_NAME = { R: 'RAISE / 3-BET', C: 'CALL', F: 'FOLD' }
const ACTION_COLOR = { R: '#e2483d', C: '#3aa757', F: '#6b7280' }

const emptyActions = () => ({})

export default function App() {
  const [format, setFormat] = useState('6max')
  const [tab, setTab] = useState('analyze')

  function changeFormat(f) {
    setFormat(f)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">♠ Poker Caller <span>Simulator</span></div>
        <div className="format-toggle">
          {Object.keys(FORMATS).map((f) => (
            <button key={f} className={format === f ? 'on' : ''} onClick={() => changeFormat(f)}>
              {f}
            </button>
          ))}
        </div>
        <nav className="tabs">
          {[['analyze', 'Analyze a hand'], ['trainer', 'Trainer'], ['edit', 'Edit ranges']].map(([k, label]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>
          ))}
        </nav>
      </header>

      {tab === 'analyze' && <Analyze format={format} />}
      {tab === 'trainer' && <Trainer format={format} />}
      {tab === 'edit' && <EditRanges format={format} />}
    </div>
  )
}

// -------------------- ANALYZE (manual hand reconstruction) ----------------
function Analyze({ format }) {
  const seats = FORMATS[format]
  const [hero, setHero] = useState(seats[3] || seats[0])
  const [actions, setActions] = useState(emptyActions())
  const [heroAction, setHeroAction] = useState(null)
  const [card1, setCard1] = useState('As')
  const [card2, setCard2] = useState('Ks')

  // keep hero valid if format changed
  if (!seats.includes(hero)) {
    setHero(seats[3] || seats[0])
    setActions(emptyActions())
    setHeroAction(null)
  }

  const hand = cardsToHand(card1, card2)
  const context = useMemo(() => deriveContext(format, hero, actions), [format, hero, actions])
  const strat = useMemo(() => getStrategy(format, hero, context), [format, hero, context])
  const action = strat.map[hand] || 'F'
  const actionLine = describeAction(format, hero, actions)
  const followup = useMemo(
    () => deriveFollowup(format, hero, actions, heroAction),
    [format, hero, actions, heroAction]
  )

  function setAction(pos, a) {
    setActions((prev) => ({ ...prev, [pos]: a }))
  }
  function reset() {
    setActions(emptyActions())
    setHeroAction(null)
  }

  return (
    <div className="layout">
      <section className="panel">
        <h2>1 · Set the table</h2>
        <p className="hint">Click a seat name to make it <b>you</b>. Set what every other player did — including SB/BB acting after you. Your own chips = what you did.</p>
        <PokerTable
          format={format}
          hero={hero}
          actions={actions}
          heroAction={heroAction}
          onHero={setHero}
          onAction={setAction}
          onHeroAction={setHeroAction}
        />
        <button className="ghost" onClick={reset}>Reset actions</button>

        <h2>2 · Your cards</h2>
        <CardPicker card1={card1} card2={card2} onCard1={setCard1} onCard2={setCard2} />
        <div className="hand-class">Hand class: <b>{hand}</b> <span className="muted">({comboCount(hand)} combos)</span></div>
      </section>

      <section className="panel">
        <h2>3 · Recommendation</h2>
        <div className="action-line">Action so far: <b>{actionLine}</b></div>

        {context.supported ? (
          <div className="verdict" style={{ borderColor: ACTION_COLOR[action] }}>
            <div className="verdict-hand">{hand}</div>
            <div className="verdict-action" style={{ color: ACTION_COLOR[action] }}>{ACTION_NAME[action]}</div>
            <div className="verdict-ctx">{strat.title}</div>
          </div>
        ) : (
          <div className="verdict warn">
            <div className="verdict-action" style={{ color: '#e8a33d' }}>NOT MODELLED YET</div>
            <div className="verdict-ctx">{context.note}</div>
          </div>
        )}

        {strat.approx && context.supported && (
          <div className="banner">⚠ Baseline approximation — refine this spot in “Edit ranges”.</div>
        )}
        {context.note && context.supported && <div className="note">{context.note}</div>}

        {followup && (
          <div className={`followup ${followup.supported ? '' : 'followup-soon'}`}>
            <div className="followup-head">After you {heroAction}:</div>
            <div>{followup.note}</div>
          </div>
        )}

        <h2>{strat.title}</h2>
        <Legend />
        <RangeGrid map={strat.map} highlight={hand} onCellClick={(h) => pickHandIntoCards(h, setCard1, setCard2)} />
        <p className="hint">Tip: click any cell to load that hand into your cards.</p>
      </section>
    </div>
  )
}

// Load a hand class (e.g. 'AKs') back into two concrete cards for the picker.
function pickHandIntoCards(hand, setCard1, setCard2) {
  const r1 = hand[0], r2 = hand[1]
  if (hand.length === 2) { setCard1(r1 + 's'); setCard2(r2 + 'h'); return }
  if (hand.endsWith('s')) { setCard1(r1 + 's'); setCard2(r2 + 's') }
  else { setCard1(r1 + 's'); setCard2(r2 + 'h') }
}

function CardPicker({ card1, card2, onCard1, onCard2 }) {
  return (
    <div className="cards">
      <CardSelect card={card1} onChange={onCard1} />
      <CardSelect card={card2} onChange={onCard2} />
    </div>
  )
}

function CardSelect({ card, onChange }) {
  const rank = card[0]
  const suit = card[1]
  const suitObj = SUITS.find((s) => s.s === suit) || SUITS[0]
  return (
    <div className="card-select">
      <div className="card-face" style={{ color: suitObj.color }}>
        <span className="card-rank">{rank}</span>
        <span className="card-suit">{suitObj.sym}</span>
      </div>
      <div className="card-controls">
        <select value={rank} onChange={(e) => onChange(e.target.value + suit)}>
          {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="suit-row">
          {SUITS.map((s) => (
            <button
              key={s.s}
              className={`suit-btn ${suit === s.s ? 'on' : ''}`}
              style={{ color: s.color }}
              onClick={() => onChange(rank + s.s)}
            >{s.sym}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// -------------------- TRAINER (random drills) -----------------------------
function randInt(n) { return Math.floor(Math.random() * n) }

function makeDeal(format) {
  const seats = FORMATS[format]
  // choose scenario type
  const wantVs = Math.random() < 0.5
  let hero, actions = {}
  if (wantVs) {
    // hero needs at least one seat before it; pick a raiser before hero
    const heroIdx = 1 + randInt(seats.length - 1)
    hero = seats[heroIdx]
    const raiserIdx = randInt(heroIdx)
    seats.slice(0, heroIdx).forEach((p, i) => { actions[p] = i === raiserIdx ? 'raise' : 'fold' })
  } else {
    // folded to hero (RFI). hero can't be BB (no RFI spot).
    const candidates = seats.filter((s) => s !== 'BB')
    hero = candidates[randInt(candidates.length)]
    const heroIdx = seats.indexOf(hero)
    seats.slice(0, heroIdx).forEach((p) => { actions[p] = 'fold' })
  }
  // deal a random hand weighted by combos
  const r1 = RANKS[randInt(13)]
  let r2 = RANKS[randInt(13)]
  const suited = Math.random() < 0.5
  let c1, c2
  if (r1 === r2) { c1 = r1 + 's'; c2 = r2 + 'h' }
  else if (suited) { c1 = r1 + 's'; c2 = r2 + 's' }
  else { c1 = r1 + 's'; c2 = r2 + 'h' }
  return { hero, actions, card1: c1, card2: c2 }
}

function Trainer({ format }) {
  const [deal, setDeal] = useState(() => makeDeal(format))
  const [guess, setGuess] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  // reset the deal when format changes
  const [lastFormat, setLastFormat] = useState(format)
  if (lastFormat !== format) {
    setLastFormat(format)
    setDeal(makeDeal(format))
    setGuess(null)
  }

  const hand = cardsToHand(deal.card1, deal.card2)
  const context = useMemo(() => deriveContext(format, deal.hero, deal.actions), [format, deal])
  const strat = useMemo(() => getStrategy(format, deal.hero, context), [format, deal.hero, context])
  const correct = strat.map[hand] || 'F'
  const revealed = guess !== null

  function answer(a) {
    if (revealed) return
    setGuess(a)
    setScore((s) => ({ correct: s.correct + (a === correct ? 1 : 0), total: s.total + 1 }))
  }
  function next() { setDeal(makeDeal(format)); setGuess(null) }

  const options = context.type === 'RFI' ? ['R', 'F'] : ['R', 'C', 'F']

  return (
    <div className="layout">
      <section className="panel">
        <h2>Drill</h2>
        <div className="score">Score: <b>{score.correct}/{score.total}</b>
          {score.total > 0 && <span className="muted"> ({Math.round((100 * score.correct) / score.total)}%)</span>}
        </div>
        <div className="drill-q">
          <div>You are <b>{deal.hero}</b> in <b>{format}</b></div>
          <div className="muted">{describeAction(format, deal.hero, deal.actions)}</div>
          <div className="drill-cards">
            <BigCard card={deal.card1} /><BigCard card={deal.card2} />
          </div>
          <div className="muted">Your hand: <b>{hand}</b></div>
        </div>

        {!context.supported ? (
          <div className="banner">This random spot isn’t modelled — <button className="ghost" onClick={next}>skip</button></div>
        ) : (
          <div className="answer-btns">
            {options.map((a) => (
              <button
                key={a}
                className={`big-btn ${revealed && a === correct ? 'right' : ''} ${revealed && a === guess && a !== correct ? 'wrong' : ''}`}
                style={{ borderColor: ACTION_COLOR[a] }}
                onClick={() => answer(a)}
                disabled={revealed}
              >{ACTION_NAME[a]}</button>
            ))}
          </div>
        )}

        {revealed && (
          <div className={`result ${guess === correct ? 'ok' : 'bad'}`}>
            {guess === correct ? '✓ Correct' : `✗ Wrong — solver says ${ACTION_NAME[correct]}`}
            <button className="primary" onClick={next}>Next hand →</button>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>{strat.title}</h2>
        {strat.approx && <div className="banner">⚠ Baseline approximation.</div>}
        <Legend />
        <RangeGrid map={revealed ? strat.map : {}} highlight={hand} />
        {!revealed && <p className="hint">Range hidden until you answer.</p>}
      </section>
    </div>
  )
}

function BigCard({ card }) {
  const suitObj = SUITS.find((s) => s.s === card[1]) || SUITS[0]
  return (
    <div className="big-card" style={{ color: suitObj.color }}>
      <span>{card[0]}</span><span>{suitObj.sym}</span>
    </div>
  )
}

// -------------------- EDIT RANGES -----------------------------------------
function EditRanges({ format }) {
  const seats = FORMATS[format]
  const [hero, setHero] = useState(seats[0])
  const [ctxType, setCtxType] = useState('RFI')
  const [raiser, setRaiser] = useState(seats[0])

  if (!seats.includes(hero)) setHero(seats[0])

  const context = ctxType === 'RFI'
    ? { type: 'RFI', raiser: null, callers: [], supported: true }
    : { type: 'vsRFI', raiser, callers: [], supported: true }

  const strat = getStrategy(format, hero, context)
  const [raiseStr, setRaiseStr] = useState(strat.raiseStr)
  const [callStr, setCallStr] = useState(strat.callStr)

  // reload editor when target changes
  const targetKey = rangeKey(format, hero, context)
  const [lastKey, setLastKey] = useState(targetKey)
  if (lastKey !== targetKey) {
    setLastKey(targetKey)
    setRaiseStr(strat.raiseStr)
    setCallStr(strat.callStr)
  }

  const preview = getStrategy(format, hero, context)
  // live preview from current editor text
  const liveMap = useMemo(() => {
    const m = {}
    for (const h of expandRange(raiseStr)) m[h] = 'R'
    for (const h of expandRange(callStr)) if (!m[h]) m[h] = 'C'
    return m
  }, [raiseStr, callStr])

  function save() {
    saveOverride(targetKey, { raise: raiseStr, call: callStr, title: preview.title })
    alert('Saved. This spot now uses your custom range.')
  }
  function reset() {
    clearOverride(targetKey)
    const fresh = getStrategy(format, hero, context)
    setRaiseStr(fresh.raiseStr)
    setCallStr(fresh.callStr)
  }

  return (
    <div className="layout">
      <section className="panel">
        <h2>Edit a range</h2>
        <p className="hint">Paste your own solver output as poker notation. Saved locally in your browser.</p>
        <div className="edit-controls">
          <label>Hero
            <select value={hero} onChange={(e) => setHero(e.target.value)}>
              {seats.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label>Situation
            <select value={ctxType} onChange={(e) => setCtxType(e.target.value)}>
              <option value="RFI">Open (RFI)</option>
              <option value="vsRFI">Facing a raise</option>
            </select>
          </label>
          {ctxType === 'vsRFI' && (
            <label>Raiser
              <select value={raiser} onChange={(e) => setRaiser(e.target.value)}>
                {seats.filter((s) => seats.indexOf(s) < seats.indexOf(hero)).map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          )}
        </div>
        <label className="field">Raise / 3-bet range
          <textarea value={raiseStr} onChange={(e) => setRaiseStr(e.target.value)} rows={3} />
        </label>
        {ctxType !== 'RFI' && (
          <label className="field">Call range
            <textarea value={callStr} onChange={(e) => setCallStr(e.target.value)} rows={3} />
          </label>
        )}
        <div className="edit-actions">
          <button className="primary" onClick={save}>Save spot</button>
          <button className="ghost" onClick={reset}>Reset to baseline</button>
        </div>
        <p className="hint">Notation examples: <code>22+</code>, <code>A2s+</code>, <code>KTo+</code>, <code>T9s</code>, <code>A5s-A2s</code></p>
      </section>

      <section className="panel">
        <h2>Live preview</h2>
        <Legend />
        <RangeGrid map={liveMap} />
      </section>
    </div>
  )
}
