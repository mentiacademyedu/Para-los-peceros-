import { useMemo, useState } from 'react'
import { FORMATS } from './poker/positions.js'
import { RANKS, cardsToHand, comboCount, expandRange } from './poker/hands.js'
import { deriveContext, describeAction, deriveFollowup } from './poker/scenario.js'
import { getStrategy, saveOverride, clearOverride, rangeKey, rangeStats } from './poker/ranges.js'
import RangeGrid, { StrategyBar, COLORS } from './components/RangeGrid.jsx'
import PokerTable from './components/PokerTable.jsx'
import { LangContext, LANGS, translate, useLang } from './i18n.js'

// Four-color deck: spades black, hearts red, diamonds blue, clubs green.
const SUITS = [
  { s: 's', sym: '♠', color: '#2a2e37' },
  { s: 'h', sym: '♥', color: '#e0544a' },
  { s: 'd', sym: '♦', color: '#3f7fd0' },
  { s: 'c', sym: '♣', color: '#4f9d63' },
]

// Keep the two hole cards from being the identical card: if `card` collides
// with `other`, shift it to the first suit (a different color) that's free.
function dedupeCard(card, other) {
  if (card !== other) return card
  for (const { s } of SUITS) {
    const candidate = card[0] + s
    if (candidate !== other) return candidate
  }
  return card
}
const ACTION_COLOR = COLORS
const GUESS_TO_ACT = { R: 'raise', C: 'call', F: 'fold' }

// Editable situations. side = where the opponent (raiser) sits relative to hero.
const SITUATIONS = [
  { key: 'RFI',          side: null,     raise: true,  call: false, raiseLabel: 'edit.range.open' },
  { key: 'vsRFI',        side: 'before', raise: true,  call: true,  raiseLabel: 'edit.raiseRange' },
  { key: 'vs3betOpener', side: 'after',  raise: true,  call: true,  raiseLabel: 'edit.range.4bet' },
  { key: 'vs4bet',       side: 'before', raise: true,  call: true,  raiseLabel: 'edit.range.5bet' },
  { key: 'vs5bet',       side: 'after',  raise: false, call: true,  raiseLabel: null },
]
const SIT_LABEL = {
  RFI: 'edit.sit.rfi', vsRFI: 'edit.sit.vsRFI', vs3betOpener: 'edit.sit.vs3bet',
  vs4bet: 'edit.sit.vs4bet', vs5bet: 'edit.sit.vs5bet',
}

const emptyActions = () => ({})

export default function App() {
  const [format, setFormat] = useState('6max')
  const [tab, setTab] = useState('analyze')
  const [lang, setLangState] = useState(() => localStorage.getItem('caller.lang') || 'en')

  const t = (k, v) => translate(lang, k, v)
  function setLang(l) { setLangState(l); localStorage.setItem('caller.lang', l) }

  return (
    <LangContext.Provider value={{ lang, t, setLang }}>
      <div className="app">
        <header className="topbar">
          <div className="brand">♠ Poker Caller <span>{t('brand.sub')}</span></div>
          <div className="format-toggle">
            {Object.keys(FORMATS).map((f) => (
              <button key={f} className={format === f ? 'on' : ''} onClick={() => setFormat(f)}>{f}</button>
            ))}
          </div>
          <div className="format-toggle lang-toggle">
            {LANGS.map((l) => (
              <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>{t('lang.' + l)}</button>
            ))}
          </div>
          <nav className="tabs">
            {['analyze', 'trainer', 'edit'].map((k) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t('tab.' + k)}</button>
            ))}
          </nav>
        </header>

        {tab === 'analyze' && <Analyze format={format} />}
        {tab === 'trainer' && <Trainer format={format} />}
        {tab === 'edit' && <EditRanges format={format} />}
      </div>
    </LangContext.Provider>
  )
}

// -------------------- ANALYZE (manual hand reconstruction) ----------------
function Analyze({ format }) {
  const { t } = useLang()
  const seats = FORMATS[format]
  const [hero, setHero] = useState(seats[3] || seats[0])
  const [actions, setActions] = useState(emptyActions())
  const [heroAction, setHeroAction] = useState(null)
  const [card1, setCard1] = useState('As')
  const [card2, setCard2] = useState('Ks')

  if (!seats.includes(hero)) {
    setHero(seats[3] || seats[0])
    setActions(emptyActions())
    setHeroAction(null)
  }

  const hand = cardsToHand(card1, card2)
  const context = useMemo(() => deriveContext(format, hero, actions), [format, hero, actions])
  const strat = useMemo(() => getStrategy(format, hero, context), [format, hero, context])
  const action = strat.map[hand] || 'F'
  const actionLine = describeAction(format, hero, actions, t)
  const followup = useMemo(
    () => deriveFollowup(format, hero, actions, heroAction),
    [format, hero, actions, heroAction]
  )
  const title = t(strat.titleKey, strat.titleParams)

  // If hero opened and faces a single 3-bet, model the 4-bet/call/fold spot.
  const vs3betCtx = followup && followup.supported && followup.type === 'vs3bet'
    ? { type: 'vs3betOpener', raiser: followup.threeBettor }
    : null
  const strat3 = vs3betCtx ? getStrategy(format, hero, vs3betCtx) : null
  const action3 = strat3 ? (strat3.map[hand] || 'F') : null

  // If 4-betting is the recommended response, also show the vs-5-bet (jam) spot.
  const strat5 = strat3 && action3 === 'R'
    ? getStrategy(format, hero, { type: 'vs5bet', raiser: followup.threeBettor })
    : null
  const action5 = strat5 ? (strat5.map[hand] || 'F') : null

  // If you face an open and 3-betting is recommended, show the vs-4-bet spot.
  const strat4 = context.type === 'vsRFI' && action === 'R'
    ? getStrategy(format, hero, { type: 'vs4bet', raiser: context.raiser })
    : null
  const action4 = strat4 ? (strat4.map[hand] || 'F') : null

  function setAction(pos, a) { setActions((prev) => ({ ...prev, [pos]: a })) }
  function reset() { setActions(emptyActions()); setHeroAction(null) }

  return (
    <div className="layout">
      <section className="panel">
        <h2>{t('analyze.step1')}</h2>
        <p className="hint">{t('analyze.step1.hint')}</p>
        <PokerTable
          format={format} hero={hero} actions={actions} heroAction={heroAction}
          onHero={setHero} onAction={setAction} onHeroAction={setHeroAction}
        />
        <button className="ghost" onClick={reset}>{t('analyze.reset')}</button>

        <h2>{t('analyze.step2')}</h2>
        <CardPicker card1={card1} card2={card2} onCard1={setCard1} onCard2={setCard2} />
        <div className="hand-class">{t('analyze.handClass')} <b>{hand}</b> <span className="muted">({t('analyze.combos', { n: comboCount(hand) })})</span></div>
      </section>

      <section className="panel">
        <h2>{t('analyze.step3')}</h2>
        <div className="action-line">{t('analyze.actionSoFar')} <b>{actionLine}</b></div>

        {context.supported ? (
          <div className="verdict">
            <div className="verdict-hand">{hand}</div>
            <div className="verdict-action" style={{ color: ACTION_COLOR[action] }}>{t('action.' + action)}</div>
            <div className="verdict-ctx">{title}</div>
          </div>
        ) : (
          <div className="verdict warn">
            <div className="verdict-action" style={{ color: '#d9b878' }}>{t('analyze.notModelled')}</div>
            {context.noteKey && <div className="verdict-ctx">{t(context.noteKey, context.noteParams)}</div>}
          </div>
        )}

        {strat.approx && context.supported && <div className="banner">{t('analyze.approx')}</div>}
        {context.noteKey && context.supported && <div className="note">{t(context.noteKey, context.noteParams)}</div>}

        {followup && (
          <div className={`followup ${followup.supported ? '' : 'followup-soon'}`}>
            <div className="followup-head">{t('analyze.afterYou', { action: t('you.' + heroAction) })}</div>
            <div>{renderFollowupNote(t, followup)}</div>
          </div>
        )}

        {context.supported && (
          <>
            <h2>{title}</h2>
            <StrategyBar stats={rangeStats(strat.map)} />
            <RangeGrid map={strat.map} highlight={hand} onCellClick={(h) => pickHandIntoCards(h, setCard1, setCard2)} />
            <p className="hint">{t('analyze.tipCell')}</p>

            {strat4 && (
              <div className="vs4bet-sub">
                <h2>{t('analyze.vs4bet')}</h2>
                <div className="verdict">
                  <div className="verdict-hand">{hand}</div>
                  <div className="verdict-action" style={{ color: ACTION_COLOR[action4] }}>
                    {action4 === 'R' ? t('action.R5') : t('action.' + action4)}
                  </div>
                  <div className="verdict-ctx">{t(strat4.titleKey, strat4.titleParams)}</div>
                </div>
                {strat4.approx && <div className="banner">{t('analyze.approx')}</div>}
                <StrategyBar stats={rangeStats(strat4.map)} />
                <RangeGrid map={strat4.map} highlight={hand} onCellClick={(h) => pickHandIntoCards(h, setCard1, setCard2)} />
              </div>
            )}
          </>
        )}

        {strat3 && (
          <div className="vs3bet-block">
            <h2>{t('analyze.vs3bet')}</h2>
            <div className="verdict">
              <div className="verdict-hand">{hand}</div>
              <div className="verdict-action" style={{ color: ACTION_COLOR[action3] }}>
                {action3 === 'R' ? t('action.R4') : t('action.' + action3)}
              </div>
              <div className="verdict-ctx">{t(strat3.titleKey, strat3.titleParams)}</div>
            </div>
            {strat3.approx && <div className="banner">{t('analyze.approx')}</div>}
            <StrategyBar stats={rangeStats(strat3.map)} />
            <RangeGrid map={strat3.map} highlight={hand} onCellClick={(h) => pickHandIntoCards(h, setCard1, setCard2)} />

            {strat5 && (
              <div className="vs5bet-sub">
                <h2>{t('analyze.vs5bet')}</h2>
                <div className="verdict">
                  <div className="verdict-hand">{hand}</div>
                  <div className="verdict-action" style={{ color: ACTION_COLOR[action5] }}>{t('action.' + action5)}</div>
                  <div className="verdict-ctx">{t(strat5.titleKey, strat5.titleParams)}</div>
                </div>
                <StrategyBar stats={rangeStats(strat5.map)} />
                <RangeGrid map={strat5.map} highlight={hand} onCellClick={(h) => pickHandIntoCards(h, setCard1, setCard2)} />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

// Resolve a followup note, injecting a translated `way` if present.
function renderFollowupNote(t, fu) {
  const params = { ...(fu.noteParams || {}) }
  if (params.wayKey) { params.way = t(params.wayKey); delete params.wayKey }
  return t(fu.noteKey, params)
}

function pickHandIntoCards(hand, setCard1, setCard2) {
  const r1 = hand[0], r2 = hand[1]
  if (hand.length === 2) { setCard1(r1 + 's'); setCard2(r2 + 'h'); return }
  if (hand.endsWith('s')) { setCard1(r1 + 's'); setCard2(r2 + 's') }
  else { setCard1(r1 + 's'); setCard2(r2 + 'h') }
}

function CardPicker({ card1, card2, onCard1, onCard2 }) {
  return (
    <div className="cards">
      <CardSelect card={card1} onChange={(c) => onCard1(dedupeCard(c, card2))} />
      <CardSelect card={card2} onChange={(c) => onCard2(dedupeCard(c, card1))} />
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
  const roll = Math.random()
  let hero, heroAction = null, node
  const actions = {}

  if (roll < 0.34) {
    // RFI — folded to hero (BB never opens)
    const candidates = seats.filter((s) => s !== 'BB')
    hero = candidates[randInt(candidates.length)]
    const heroIdx = seats.indexOf(hero)
    seats.slice(0, heroIdx).forEach((p) => { actions[p] = 'fold' })
    node = { type: 'RFI', raiser: null }
  } else if (roll < 0.67) {
    // vsRFI — one raiser before hero
    const heroIdx = 1 + randInt(seats.length - 1)
    hero = seats[heroIdx]
    const raiserIdx = randInt(heroIdx)
    seats.slice(0, heroIdx).forEach((p, i) => { actions[p] = i === raiserIdx ? 'raise' : 'fold' })
    node = { type: 'vsRFI', raiser: seats[raiserIdx] }
  } else {
    // vs3betOpener — hero opens, a seat behind 3-bets
    const candidates = seats.filter((s) => s !== 'BB')
    hero = candidates[randInt(candidates.length)]
    const heroIdx = seats.indexOf(hero)
    seats.slice(0, heroIdx).forEach((p) => { actions[p] = 'fold' })
    heroAction = 'raise'
    const afterIdx = seats.map((_, i) => i).filter((i) => i > heroIdx)
    const tbIdx = afterIdx[randInt(afterIdx.length)]
    seats.forEach((p, i) => { if (i > heroIdx && i < tbIdx) actions[p] = 'fold' })
    actions[seats[tbIdx]] = 'raise'
    node = { type: 'vs3betOpener', raiser: seats[tbIdx] }
  }

  const r1 = RANKS[randInt(13)]
  const r2 = RANKS[randInt(13)]
  const suited = Math.random() < 0.5
  let c1, c2
  if (r1 === r2) { c1 = r1 + 's'; c2 = r2 + 'h' }
  else if (suited) { c1 = r1 + 's'; c2 = r2 + 's' }
  else { c1 = r1 + 's'; c2 = r2 + 'h' }
  return { hero, actions, heroAction, node, card1: c1, card2: c2 }
}

function Trainer({ format }) {
  const { t } = useLang()
  const [deal, setDeal] = useState(() => makeDeal(format))
  const [guess, setGuess] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const [lastFormat, setLastFormat] = useState(format)
  if (lastFormat !== format) {
    setLastFormat(format)
    setDeal(makeDeal(format))
    setGuess(null)
  }

  const hand = cardsToHand(deal.card1, deal.card2)
  const node = deal.node
  const isVs3bet = node.type === 'vs3betOpener'
  const strat = useMemo(() => getStrategy(format, deal.hero, node), [format, deal.hero, node])
  const correct = strat.map[hand] || 'F'
  const revealed = guess !== null
  const title = t(strat.titleKey, strat.titleParams)
  const label = (a) => (isVs3bet && a === 'R' ? t('action.R4') : t('action.' + a))
  const tableHeroAction = isVs3bet ? 'raise' : (revealed ? GUESS_TO_ACT[guess] : null)

  function answer(a) {
    if (revealed) return
    setGuess(a)
    setScore((s) => ({ correct: s.correct + (a === correct ? 1 : 0), total: s.total + 1 }))
  }
  function next() { setDeal(makeDeal(format)); setGuess(null) }

  const options = node.type === 'RFI' ? ['R', 'F'] : ['R', 'C', 'F']

  return (
    <div className="layout">
      <section className="panel">
        <h2>{t('trainer.drill')}</h2>
        <div className="score">{t('trainer.score')} <b>{score.correct}/{score.total}</b>
          {score.total > 0 && <span className="muted"> ({Math.round((100 * score.correct) / score.total)}%)</span>}
        </div>

        <PokerTable
          format={format} hero={deal.hero} actions={deal.actions}
          heroAction={tableHeroAction} readOnly
        />

        <div className="drill-q">
          <div>{t('trainer.youAre', { hero: deal.hero, format })}</div>
          {isVs3bet
            ? <div className="muted">{t('trainer.vs3betLine', { who: node.raiser })}</div>
            : <div className="muted">{describeAction(format, deal.hero, deal.actions, t)}</div>}
          <div className="drill-cards">
            <BigCard card={deal.card1} /><BigCard card={deal.card2} />
          </div>
          <div className="muted">{t('trainer.yourHand')} <b>{hand}</b></div>
        </div>

        <div className="answer-btns">
          {options.map((a) => (
            <button
              key={a}
              className={`big-btn ${revealed && a === correct ? 'right' : ''} ${revealed && a === guess && a !== correct ? 'wrong' : ''}`}
              onClick={() => answer(a)}
              disabled={revealed}
            >{label(a)}</button>
          ))}
        </div>

        {revealed && (
          <div className={`result ${guess === correct ? 'ok' : 'bad'}`}>
            {guess === correct ? t('trainer.correct') : t('trainer.wrong', { action: label(correct) })}
            <button className="primary" onClick={next}>{t('trainer.next')}</button>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>{title}</h2>
        {strat.approx && <div className="banner">{t('trainer.approx')}</div>}
        {revealed && <StrategyBar stats={rangeStats(strat.map)} />}
        <RangeGrid map={strat.map} highlight={hand} hideFills={!revealed} />
        {!revealed && <p className="hint">{t('trainer.hidden')}</p>}
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
  const { t } = useLang()
  const seats = FORMATS[format]
  const [hero, setHero] = useState(seats[0])
  const [ctxType, setCtxType] = useState('RFI')
  const [raiser, setRaiser] = useState(seats[1])

  if (!seats.includes(hero)) setHero(seats[0])

  const sit = SITUATIONS.find((s) => s.key === ctxType) || SITUATIONS[0]
  const heroIdx = seats.indexOf(hero)
  const raiserOptions = sit.side === 'before' ? seats.filter((_, i) => i < heroIdx)
    : sit.side === 'after' ? seats.filter((_, i) => i > heroIdx)
    : []
  const needsRaiser = sit.side !== null
  const applicable = !needsRaiser || raiserOptions.length > 0
  if (needsRaiser && raiserOptions.length && !raiserOptions.includes(raiser)) setRaiser(raiserOptions[0])

  const context = { type: ctxType, raiser: needsRaiser ? raiser : null, callers: [], supported: true }
  const strat = getStrategy(format, hero, context)
  const [raiseStr, setRaiseStr] = useState(strat.raiseStr)
  const [callStr, setCallStr] = useState(strat.callStr)

  const targetKey = rangeKey(format, hero, context)
  const [lastKey, setLastKey] = useState(targetKey)
  if (lastKey !== targetKey) {
    setLastKey(targetKey)
    setRaiseStr(strat.raiseStr)
    setCallStr(strat.callStr)
  }

  const liveMap = useMemo(() => {
    const m = {}
    if (sit.raise) for (const h of expandRange(raiseStr)) m[h] = 'R'
    if (sit.call) for (const h of expandRange(callStr)) if (!m[h]) m[h] = 'C'
    return m
  }, [raiseStr, callStr, sit])

  function save() {
    saveOverride(targetKey, { raise: sit.raise ? raiseStr : '', call: sit.call ? callStr : '' })
    alert(t('edit.saved'))
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
        <h2>{t('edit.title')}</h2>
        <p className="hint">{t('edit.hint')}</p>
        <div className="edit-controls">
          <label>{t('edit.hero')}
            <select value={hero} onChange={(e) => setHero(e.target.value)}>
              {seats.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label>{t('edit.situation')}
            <select value={ctxType} onChange={(e) => setCtxType(e.target.value)}>
              {SITUATIONS.map((s) => <option key={s.key} value={s.key}>{t(SIT_LABEL[s.key])}</option>)}
            </select>
          </label>
          {needsRaiser && applicable && (
            <label>{t('edit.raiser')}
              <select value={raiser} onChange={(e) => setRaiser(e.target.value)}>
                {raiserOptions.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          )}
        </div>

        {!applicable ? (
          <div className="banner">{t('edit.naSpot')}</div>
        ) : (
          <>
            {sit.raise && (
              <label className="field">{t(sit.raiseLabel)}
                <textarea value={raiseStr} onChange={(e) => setRaiseStr(e.target.value)} rows={3} />
              </label>
            )}
            {sit.call && (
              <label className="field">{t('edit.callRange')}
                <textarea value={callStr} onChange={(e) => setCallStr(e.target.value)} rows={3} />
              </label>
            )}
            <div className="edit-actions">
              <button className="primary" onClick={save}>{t('edit.save')}</button>
              <button className="ghost" onClick={reset}>{t('edit.reset')}</button>
            </div>
          </>
        )}
        <p className="hint">{t('edit.notation')} <code>22+</code>, <code>A2s+</code>, <code>KTo+</code>, <code>T9s</code>, <code>A5s-A2s</code></p>
      </section>

      <section className="panel">
        <h2>{t('edit.preview')}</h2>
        <StrategyBar stats={rangeStats(liveMap)} />
        <RangeGrid map={liveMap} />
      </section>
    </div>
  )
}
