import { createContext, useContext } from 'react'

export const LANGS = ['en', 'es']

const STRINGS = {
  en: {
    'brand.sub': 'Simulator',
    'lang.en': 'EN', 'lang.es': 'ES',
    'tab.analyze': 'Analyze a hand',
    'tab.trainer': 'Trainer',
    'tab.edit': 'Edit ranges',

    'analyze.step1': '1 · Set the table',
    'analyze.step1.hint': 'Click a seat name to make it you. Set what every other player did — including SB/BB acting after you. Your own chips = what you did.',
    'analyze.reset': 'Reset actions',
    'analyze.step2': '2 · Your cards',
    'analyze.handClass': 'Hand class:',
    'analyze.combos': '{n} combos',
    'analyze.step3': '3 · Recommendation',
    'analyze.actionSoFar': 'Action so far:',
    'analyze.tipCell': 'Tip: click any cell to load that hand into your cards.',
    'analyze.notModelled': 'NOT MODELLED YET',
    'analyze.approx': '⚠ Baseline approximation — refine this spot in “Edit ranges”.',
    'analyze.afterYou': 'After you {action}:',

    'action.R': 'RAISE / 3-BET', 'action.C': 'CALL', 'action.F': 'FOLD',
    'legend.R': 'Raise', 'legend.C': 'Call', 'legend.F': 'Fold',
    'word.fold': 'Fold', 'word.call': 'Call', 'word.raise': 'Raise',
    'verb.fold': 'folds', 'verb.call': 'calls', 'verb.raise': 'raises',
    'you.fold': 'fold', 'you.call': 'call', 'you.raise': 'raise',
    'mini.fold': 'F', 'mini.call': 'C', 'mini.raise': 'R',
    'foldsToHero': 'folds to hero',
    'seat.you': 'YOU', 'seat.setHero': 'Set as hero (you)', 'seat.toAct': 'to act',

    'title.rfi': '{pos} — Open (RFI)',
    'title.vsRFI': '{hero} vs {raiser} open',
    'title.vs3bet': '{hero} faces a 3-bet',
    'title.multiway': '{hero} — multiway pot',

    'trainer.drill': 'Drill',
    'trainer.score': 'Score:',
    'trainer.youAre': 'You are {hero} in {format}',
    'trainer.yourHand': 'Your hand:',
    'trainer.notModelled': 'This random spot isn’t modelled —',
    'trainer.skip': 'skip',
    'trainer.correct': '✓ Correct',
    'trainer.wrong': '✗ Wrong — solver says {action}',
    'trainer.next': 'Next hand →',
    'trainer.hidden': 'Range hidden until you answer.',
    'trainer.approx': '⚠ Baseline approximation.',

    'edit.title': 'Edit a range',
    'edit.hint': 'Paste your own solver output as poker notation. Saved locally in your browser.',
    'edit.hero': 'Hero', 'edit.situation': 'Situation', 'edit.raiser': 'Raiser',
    'edit.sit.rfi': 'Open (RFI)', 'edit.sit.vsRFI': 'Facing a raise',
    'edit.raiseRange': 'Raise / 3-bet range', 'edit.callRange': 'Call range',
    'edit.save': 'Save spot', 'edit.reset': 'Reset to baseline',
    'edit.saved': 'Saved. This spot now uses your custom range.',
    'edit.preview': 'Live preview',
    'edit.notation': 'Notation examples:',

    'note.limpFold': 'Treating limps as fold-equivalent for the RFI baseline.',
    'note.bbLimp': 'Limped pot — BB checks its option. Not modelled; use judgment.',
    'note.multiway': 'Multiway: {raiser} raised, {callers} called. Baseline uses the heads-up vs-open range — tighten in practice (squeeze dynamics).',
    'note.vs3bet': 'Facing a 3-bet+. Not yet modelled (Phase 2). No reliable range shown.',

    'fu.3bet': '{who} 3-bet you. Facing a 3-bet isn’t modelled yet (Phase 2) — no range shown.',
    'fu.calledRaise': '{who} called your raise — you see a flop {way}. Postflop is Phase 2.',
    'fu.won': 'Everyone folds to your raise — you take it down preflop.',
    'fu.squeeze': '{who} raised behind after your call (squeeze) — not modelled yet.',
    'fu.callFlopMulti': 'You and {who} see a flop multiway. Postflop is Phase 2.',
    'fu.callFlop': 'You call and see a flop. Postflop is Phase 2.',
    'way.headsup': 'heads-up', 'way.multiway': 'multiway',

    'action.R4': '4-BET',
    'title.vs3betPos': '{hero} vs {raiser} 3-bet',
    'analyze.vs3bet': 'Facing the 3-bet',
    'fu.3betModelled': '{who} 3-bet you — your 4-bet / call / fold decision is below.',
    'trainer.vs3betLine': 'You open, {who} 3-bets — your move?',
    'analyze.vs5bet': 'If you 4-bet and get jammed on (5-bet)',
    'title.vs5bet': '{hero} vs 5-bet jam',
  },
  es: {
    'brand.sub': 'Simulador',
    'lang.en': 'EN', 'lang.es': 'ES',
    'tab.analyze': 'Analizar mano',
    'tab.trainer': 'Entrenador',
    'tab.edit': 'Editar rangos',

    'analyze.step1': '1 · Configura la mesa',
    'analyze.step1.hint': 'Haz clic en el nombre de un asiento para que seas tú. Marca lo que hizo cada jugador — incluyendo SB/BB que actúan después de ti. Tus fichas = lo que hiciste.',
    'analyze.reset': 'Reiniciar acciones',
    'analyze.step2': '2 · Tus cartas',
    'analyze.handClass': 'Tipo de mano:',
    'analyze.combos': '{n} combos',
    'analyze.step3': '3 · Recomendación',
    'analyze.actionSoFar': 'Acción hasta ahora:',
    'analyze.tipCell': 'Tip: haz clic en cualquier celda para cargar esa mano en tus cartas.',
    'analyze.notModelled': 'AÚN NO MODELADO',
    'analyze.approx': '⚠ Aproximación base — ajusta este spot en “Editar rangos”.',
    'analyze.afterYou': 'Después de que {action}:',

    'action.R': 'SUBIR / 3-BET', 'action.C': 'PAGAR', 'action.F': 'RETIRARSE',
    'legend.R': 'Subir', 'legend.C': 'Pagar', 'legend.F': 'Retirarse',
    'word.fold': 'Foldear', 'word.call': 'Pagar', 'word.raise': 'Subir',
    'verb.fold': 'se retira', 'verb.call': 'paga', 'verb.raise': 'sube',
    'you.fold': 'te retiras', 'you.call': 'pagas', 'you.raise': 'subes',
    'mini.fold': 'F', 'mini.call': 'P', 'mini.raise': 'S',
    'foldsToHero': 'todos se retiran hasta ti',
    'seat.you': 'TÚ', 'seat.setHero': 'Marcar como héroe (tú)', 'seat.toAct': 'por actuar',

    'title.rfi': '{pos} — Abrir (RFI)',
    'title.vsRFI': '{hero} vs apertura de {raiser}',
    'title.vs3bet': '{hero} enfrenta un 3-bet',
    'title.multiway': '{hero} — bote multiway',

    'trainer.drill': 'Práctica',
    'trainer.score': 'Puntaje:',
    'trainer.youAre': 'Eres {hero} en {format}',
    'trainer.yourHand': 'Tu mano:',
    'trainer.notModelled': 'Este spot aleatorio no está modelado —',
    'trainer.skip': 'saltar',
    'trainer.correct': '✓ Correcto',
    'trainer.wrong': '✗ Incorrecto — el solver dice {action}',
    'trainer.next': 'Siguiente mano →',
    'trainer.hidden': 'Rango oculto hasta que respondas.',
    'trainer.approx': '⚠ Aproximación base.',

    'edit.title': 'Editar un rango',
    'edit.hint': 'Pega tu propio output del solver en notación de poker. Se guarda localmente en tu navegador.',
    'edit.hero': 'Héroe', 'edit.situation': 'Situación', 'edit.raiser': 'Quien sube',
    'edit.sit.rfi': 'Abrir (RFI)', 'edit.sit.vsRFI': 'Frente a una subida',
    'edit.raiseRange': 'Rango de subida / 3-bet', 'edit.callRange': 'Rango de pago',
    'edit.save': 'Guardar spot', 'edit.reset': 'Restaurar base',
    'edit.saved': 'Guardado. Este spot ahora usa tu rango personalizado.',
    'edit.preview': 'Vista previa',
    'edit.notation': 'Ejemplos de notación:',

    'note.limpFold': 'Los limps se tratan como fold para la base RFI.',
    'note.bbLimp': 'Bote con limp — BB pasa su opción. No modelado; usa criterio.',
    'note.multiway': 'Multiway: {raiser} subió, {callers} pagó. La base usa el rango heads-up vs apertura — ajústalo más fuerte en la práctica (dinámica de squeeze).',
    'note.vs3bet': 'Frente a un 3-bet+. Aún no modelado (Fase 2). No se muestra un rango confiable.',

    'fu.3bet': '{who} te hizo 3-bet. Enfrentar un 3-bet aún no está modelado (Fase 2) — sin rango.',
    'fu.calledRaise': '{who} pagó tu subida — ves un flop {way}. El postflop es Fase 2.',
    'fu.won': 'Todos se retiran ante tu subida — te llevas el bote preflop.',
    'fu.squeeze': '{who} subió por detrás tras tu pago (squeeze) — aún no modelado.',
    'fu.callFlopMulti': 'Tú y {who} ven un flop multiway. El postflop es Fase 2.',
    'fu.callFlop': 'Pagas y ves un flop. El postflop es Fase 2.',
    'way.headsup': 'heads-up', 'way.multiway': 'multiway',

    'action.R4': '4-BET',
    'title.vs3betPos': '{hero} vs 3-bet de {raiser}',
    'analyze.vs3bet': 'Frente al 3-bet',
    'fu.3betModelled': '{who} te hizo 3-bet — tu decisión de 4-bet / pagar / retirarse está abajo.',
    'trainer.vs3betLine': 'Abres, {who} hace 3-bet — ¿tu jugada?',
    'analyze.vs5bet': 'Si haces 4-bet y te van all-in (5-bet)',
    'title.vs5bet': '{hero} vs 5-bet all-in',
  },
}

export function translate(lang, key, vars) {
  let s = (STRINGS[lang] && STRINGS[lang][key]) ?? STRINGS.en[key] ?? key
  if (vars) for (const k in vars) s = s.split(`{${k}}`).join(vars[k])
  return s
}

export const LangContext = createContext({
  lang: 'en',
  t: (k, v) => translate('en', k, v),
  setLang: () => {},
})
export const useLang = () => useContext(LangContext)
