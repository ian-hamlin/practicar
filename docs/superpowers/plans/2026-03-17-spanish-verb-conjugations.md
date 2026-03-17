# Spanish Verb Conjugation Practice App — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based Latin American Spanish verb conjugation drill app with mixed production/recognition exercises, adaptive difficulty, and cross-session progress persistence.

**Architecture:** All state in localStorage (no backend). A one-time build script fetches ~150 curated verbs from the ian-hamlin/verb-data GitHub dataset and writes a bundled `src/data/verbs.ts`. Two hooks (`useProgress`, `useDrill`) own all logic; pages and components are kept dumb.

**Tech Stack:** Vite + React 18 + TypeScript, MUI v7 (free tier only), react-router-dom v7, localStorage for persistence.

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `src/types/index.ts` | Create | All shared types: TenseKey, TenseForms, VerbEntry, ProgressEntry, Question types |
| `src/data/tenses.ts` | Create | TenseKey → display label + person label mappings |
| `scripts/build-verbs.mjs` | Create | One-time script: fetch verbs from GitHub, compute compound tenses, write `src/data/verbs.ts` |
| `src/data/verbs.ts` | Generated | ~150 bundled VerbEntry objects (output of build script) |
| `src/hooks/useProgress.ts` | Create | localStorage read/write for `practicar:progress`; exposes `getWeight`, `recordAnswer` |
| `src/hooks/useDrill.ts` | Create | Weighted question selection, session state; exposes `currentQuestion`, `submitAnswer`, `skip`, `sessionComplete`, `sessionStats` |
| `src/components/MultipleChoiceCard.tsx` | Create | Production multiple-choice answer UI |
| `src/components/TypedCard.tsx` | Create | Production free-text answer UI |
| `src/components/RecognitionCard.tsx` | Create | Recognition multiple-choice UI |
| `src/components/QuestionCard.tsx` | Create | Dispatches to correct card variant based on question type |
| `src/components/SessionSummary.tsx` | Create | Post-session score, streak, hardest verb/tense list |
| `src/pages/Dashboard.tsx` | Replace stub | Tense checkboxes, session size picker, last session stats, Start button |
| `src/pages/Practice.tsx` | Create | Drill loop page: wires up useDrill + QuestionCard + SessionSummary |
| `src/pages/Verbs.tsx` | Create | Custom verb list + add form |
| `src/App.tsx` | Modify | Add `/practice` and `/verbs` routes |
| `src/components/Layout.tsx` | Modify | Add Practice and Verbs nav links |

---

## Task 1: Shared Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create the types file**

```ts
// src/types/index.ts

export type TenseKey =
  | 'presente'
  | 'indefinido'
  | 'imperfecto'
  | 'futuro'
  | 'condicional'
  | 'subjuntivo'
  | 'perfecto'
  | 'pluscuamperfecto'

export type PersonKey = 's1' | 's2' | 's3' | 'p1' | 'p3'

export type TenseForms = Record<PersonKey, string>

export interface VerbEntry {
  infinitive: string
  tenses: Partial<Record<TenseKey, TenseForms>>
  isCustom?: boolean
}

export interface ProgressEntry {
  correct: number
  incorrect: number
  seen: number
}

// key format: "infinitive|tenseKey|personKey"
export type ProgressStore = Record<string, ProgressEntry>

export type QuestionType = 'production-mc' | 'production-typed' | 'recognition'

export interface ProductionQuestion {
  type: 'production-mc' | 'production-typed'
  verb: VerbEntry
  tense: TenseKey
  person: PersonKey
  correctAnswer: string
  options?: string[] // present when type === 'production-mc'
}

export interface RecognitionQuestion {
  type: 'recognition'
  verb: VerbEntry
  tense: TenseKey
  person: PersonKey
  conjugatedForm: string
  options: Array<{ tense: TenseKey; person: PersonKey; label: string }>
  correctOptionIndex: number
}

export type Question = ProductionQuestion | RecognitionQuestion

export interface SessionStats {
  total: number
  correct: number
  incorrect: number
  skipped: number
  streak: number      // current running streak of consecutive correct answers
  bestStreak: number  // high-water mark for streak within this session
  hardest: Array<{ verb: string; tense: TenseKey; person: PersonKey; incorrect: number }>
}

export interface Settings {
  tenses: TenseKey[]
  sessionSize: number
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npm run build 2>&1 | grep -E "error|Error" || echo "No errors"
```

Expected: `No errors` (or only pre-existing errors, none in new file)

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add shared types"
```

---

## Task 2: Tenses Metadata

**Files:**
- Create: `src/data/tenses.ts`

- [ ] **Step 1: Create the tenses metadata file**

```ts
// src/data/tenses.ts
import type { TenseKey, PersonKey } from '../types'

export const TENSE_LABELS: Record<TenseKey, string> = {
  presente:        'Presente',
  indefinido:      'Pretérito indefinido',
  imperfecto:      'Pretérito imperfecto',
  futuro:          'Futuro simple',
  condicional:     'Condicional',
  subjuntivo:      'Subjuntivo presente',
  perfecto:        'Pretérito perfecto',
  pluscuamperfecto: 'Pluscuamperfecto',
}

export const ALL_TENSES: TenseKey[] = [
  'presente', 'indefinido', 'imperfecto', 'futuro',
  'condicional', 'subjuntivo', 'perfecto', 'pluscuamperfecto',
]

export const PERSON_LABELS: Record<PersonKey, string> = {
  s1: 'yo',
  s2: 'tú',
  s3: 'él/ella/usted',
  p1: 'nosotros/nosotras',
  p3: 'ellos/ellas/ustedes',
}

export const ALL_PERSONS: PersonKey[] = ['s1', 's2', 's3', 'p1', 'p3']
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npm run build 2>&1 | grep -E "error TS" || echo "No TS errors"
```

- [ ] **Step 3: Commit**

```bash
git add src/data/tenses.ts
git commit -m "feat: add tenses metadata"
```

---

## Task 3: Verb Data Build Script

> This task produces `src/data/verbs.ts`. Run the script once (or whenever you want to refresh the verb list). The output file is committed to the repo so the app needs no network access at runtime.

**Files:**
- Create: `scripts/build-verbs.mjs`
- Generated: `src/data/verbs.ts`

- [ ] **Step 1: Create the build script**

```js
// scripts/build-verbs.mjs
// Run: node scripts/build-verbs.mjs
// Requires Node 20+ (built-in fetch). Writes src/data/verbs.ts.

import { writeFileSync } from 'fs'

const BASE = 'https://raw.githubusercontent.com/ian-hamlin/verb-data/master/json/spanish/content'

// ~150 high-frequency Latin American Spanish verbs + haber (for compound tenses).
// Excludes verbs vulgar in Latin America (e.g. coger).
const VERB_LIST = [
  'haber', // must be first — used to compute compound tenses
  'ser', 'estar', 'tener', 'hacer', 'poder', 'decir', 'ir', 'ver', 'dar',
  'saber', 'querer', 'llegar', 'pasar', 'deber', 'poner', 'parecer', 'quedar',
  'creer', 'hablar', 'llevar', 'dejar', 'seguir', 'encontrar', 'llamar', 'venir',
  'pensar', 'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar', 'mirar',
  'contar', 'empezar', 'esperar', 'buscar', 'existir', 'entrar', 'trabajar',
  'escribir', 'perder', 'producir', 'ocurrir', 'entender', 'pedir', 'recibir',
  'recordar', 'terminar', 'permitir', 'aparecer', 'conseguir', 'comenzar',
  'servir', 'sacar', 'necesitar', 'mantener', 'resultar', 'leer', 'caer',
  'cambiar', 'presentar', 'crear', 'abrir', 'considerar', 'acabar', 'convertir',
  'ganar', 'formar', 'traer', 'partir', 'morir', 'aceptar', 'realizar',
  'suponer', 'comprender', 'lograr', 'explicar', 'preguntar', 'tocar',
  'reconocer', 'estudiar', 'alcanzar', 'nacer', 'dirigir', 'correr',
  'utilizar', 'pagar', 'ayudar', 'gustar', 'jugar', 'escuchar', 'cumplir',
  'ofrecer', 'descubrir', 'levantar', 'intentar', 'usar', 'comprar', 'salir',
  'aprender', 'continuar', 'decidir', 'mostrar', 'mover', 'subir', 'bajar',
  'dormir', 'despertar', 'sentar', 'cerrar', 'lavar', 'limpiar', 'cocinar',
  'comer', 'beber', 'caminar', 'nadar', 'conducir', 'construir', 'resolver',
  'elegir', 'repetir', 'preferir', 'divertir', 'reir', 'llorar', 'gritar',
  'cantar', 'bailar', 'tocar', 'pintar', 'viajar', 'descansar', 'enviar',
  'responder', 'enseñar', 'meter', 'sacar', 'romper',
  'suponer', 'comprender', 'sostener', 'obtener', 'detener', 'contener', 'proponer',
  'imponer', 'disponer', 'componer', 'exponer', 'oponerse',
  'ponerse', 'hacerse', 'volverse', 'quedarse', 'irse',
]

// Deduplicate
const VERBS = [...new Set(VERB_LIST)]

const GROUP_MAP = {
  'indicative/present':    'presente',
  'indicative/preterite':  'indefinido',
  'indicative/imperfect':  'imperfecto',
  'indicative/future':     'futuro',
  'indicative/conditional':'condicional',
  'subjunctive/present':   'subjuntivo',
}

const PERSONS = ['s1', 's2', 's3', 'p1', 'p3']

function cleanForm(value) {
  if (!value) return ''
  // s2 sometimes has "hablas (tú) - hablás (vos)" — take tuteo only
  const withoutParens = value.replace(/\s*\([^)]*\)/g, '').trim()
  if (withoutParens.includes(' - ')) {
    return withoutParens.split(' - ')[0].trim()
  }
  return withoutParens
}

async function fetchVerb(infinitive) {
  const letter = [...infinitive][0] // handle ñ etc.
  const url = `${BASE}/${letter}/${infinitive}.json`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`  SKIP ${infinitive}: HTTP ${res.status}`)
      return null
    }
    return await res.json()
  } catch (e) {
    console.warn(`  SKIP ${infinitive}: ${e.message}`)
    return null
  }
}

function extractTenses(data) {
  const tenses = {}
  for (const conjugation of data.conjugations) {
    const tenseKey = GROUP_MAP[conjugation.group]
    if (!tenseKey) continue
    if (!PERSONS.includes(conjugation.form)) continue
    if (!tenses[tenseKey]) tenses[tenseKey] = {}
    tenses[tenseKey][conjugation.form] = cleanForm(conjugation.value)
  }
  return tenses
}

function extractPastParticiple(data) {
  // masculine singular past participle
  const pp = data.conjugations.find(
    c => c.group === 'pastparticiple/singular' && c.form === 'masculine'
  )
  return pp ? cleanForm(pp.value) : null
}

function computeCompoundTenses(haberData, pastParticiple) {
  if (!pastParticiple) return {}

  const haberPresent = {}
  const haberImperfect = {}

  for (const conjugation of haberData.conjugations) {
    if (conjugation.group === 'indicative/present' && PERSONS.includes(conjugation.form)) {
      haberPresent[conjugation.form] = cleanForm(conjugation.value)
    }
    if (conjugation.group === 'indicative/imperfect' && PERSONS.includes(conjugation.form)) {
      haberImperfect[conjugation.form] = cleanForm(conjugation.value)
    }
  }

  const perfecto = {}
  const pluscuamperfecto = {}

  for (const person of PERSONS) {
    if (haberPresent[person]) {
      perfecto[person] = `${haberPresent[person]} ${pastParticiple}`
    }
    if (haberImperfect[person]) {
      pluscuamperfecto[person] = `${haberImperfect[person]} ${pastParticiple}`
    }
  }

  const result = {}
  if (Object.keys(perfecto).length === PERSONS.length) result.perfecto = perfecto
  if (Object.keys(pluscuamperfecto).length === PERSONS.length) result.pluscuamperfecto = pluscuamperfecto
  return result
}

async function main() {
  console.log('Fetching verb data from ian-hamlin/verb-data...')

  // Fetch haber first
  console.log('Fetching haber (for compound tenses)...')
  const haberData = await fetchVerb('haber')
  if (!haberData) throw new Error('Failed to fetch haber — cannot compute compound tenses')

  const entries = []

  for (const infinitive of VERBS) {
    if (infinitive === 'haber') continue // exclude from drills
    process.stdout.write(`  ${infinitive}... `)
    const data = await fetchVerb(infinitive)
    if (!data) continue

    const tenses = extractTenses(data)
    const pastParticiple = extractPastParticiple(data)
    const compound = computeCompoundTenses(haberData, pastParticiple)
    Object.assign(tenses, compound)

    if (Object.keys(tenses).length === 0) {
      console.log('(no usable tenses, skipped)')
      continue
    }

    entries.push({ infinitive, tenses })
    console.log(`OK (${Object.keys(tenses).length} tenses)`)
  }

  const ts = `// AUTO-GENERATED by scripts/build-verbs.mjs — do not edit by hand
// Run \`node scripts/build-verbs.mjs\` to regenerate.
import type { VerbEntry } from '../types'

export const BUNDLED_VERBS: VerbEntry[] = ${JSON.stringify(entries, null, 2)} as const
`

  writeFileSync('src/data/verbs.ts', ts, 'utf8')
  console.log(`\nWrote ${entries.length} verbs to src/data/verbs.ts`)
}

main().catch(err => { console.error(err); process.exit(1) })
```

- [ ] **Step 2: Run the script**

```bash
node scripts/build-verbs.mjs
```

Expected: output like `Wrote 148 verbs to src/data/verbs.ts`. The script will warn about any verbs it couldn't fetch (network errors, typos in list) — these are safe to ignore.

- [ ] **Step 3: Verify the output looks sane**

```bash
node -e "const v = require('./src/data/verbs.ts'); console.log('ok')" 2>/dev/null || \
  grep -c '"infinitive"' src/data/verbs.ts
```

Expected: a number >= 100 (one `"infinitive"` per verb entry).

- [ ] **Step 4: Commit**

```bash
git add scripts/build-verbs.mjs src/data/verbs.ts
git commit -m "feat: add verb data build script and bundled verb dataset"
```

---

## Task 4: useProgress Hook

**Files:**
- Create: `src/hooks/useProgress.ts`

- [ ] **Step 1: Create the hook**

```ts
// src/hooks/useProgress.ts
import { useCallback } from 'react'
import type { TenseKey, PersonKey, ProgressEntry, ProgressStore } from '../types'

const STORAGE_KEY = 'practicar:progress'

function loadProgress(): ProgressStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ProgressStore) : {}
  } catch {
    return {}
  }
}

function saveProgress(store: ProgressStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function makeKey(verb: string, tense: TenseKey, person: PersonKey): string {
  return `${verb}|${tense}|${person}`
}

export function useProgress() {
  const getEntry = useCallback(
    (verb: string, tense: TenseKey, person: PersonKey): ProgressEntry => {
      const store = loadProgress()
      return store[makeKey(verb, tense, person)] ?? { correct: 0, incorrect: 0, seen: 0 }
    },
    []
  )

  const getWeight = useCallback(
    (verb: string, tense: TenseKey, person: PersonKey): number => {
      const store = loadProgress()
      const key = makeKey(verb, tense, person)
      const entry = store[key]
      if (!entry || entry.seen === 0) return 3 // unseen triples start at weight 3
      return Math.max(1, 1 + entry.incorrect * 2 - entry.correct)
    },
    []
  )

  const recordAnswer = useCallback(
    (
      verb: string,
      tense: TenseKey,
      person: PersonKey,
      result: 'correct' | 'incorrect' | 'skip'
    ): void => {
      const store = loadProgress()
      const key = makeKey(verb, tense, person)
      const entry = store[key] ?? { correct: 0, incorrect: 0, seen: 0 }
      entry.seen += 1
      if (result === 'correct') entry.correct += 1
      if (result === 'incorrect') entry.incorrect += 1
      store[key] = entry
      saveProgress(store)
    },
    []
  )

  const clearProgress = useCallback((): void => {
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { getWeight, getEntry, recordAnswer, clearProgress }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep -E "error TS" || echo "No TS errors"
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useProgress.ts
git commit -m "feat: add useProgress hook with localStorage persistence"
```

---

## Task 5: useDrill Hook

**Files:**
- Create: `src/hooks/useDrill.ts`

- [ ] **Step 1: Create the hook**

```ts
// src/hooks/useDrill.ts
import { useState, useCallback, useMemo } from 'react'
import type {
  TenseKey, PersonKey, VerbEntry, Question,
  ProductionQuestion, RecognitionQuestion, SessionStats,
} from '../types'
import { ALL_PERSONS } from '../data/tenses'
import { useProgress } from './useProgress'

// ─── Weighted random selection ──────────────────────────────────────────────

interface Triple { verb: VerbEntry; tense: TenseKey; person: PersonKey }

function weightedPick(triples: Triple[], getWeight: (v: string, t: TenseKey, p: PersonKey) => number): Triple {
  const weights = triples.map(t => getWeight(t.verb.infinitive, t.tense, t.person))
  const total = weights.reduce((a, b) => a + b, 0)
  let rand = Math.random() * total
  for (let i = 0; i < triples.length; i++) {
    rand -= weights[i]
    if (rand <= 0) return triples[i]
  }
  return triples[triples.length - 1]
}

// ─── Distractor generation ──────────────────────────────────────────────────

function pickDistractors<T>(pool: T[], correct: T, count: number): T[] {
  const candidates = pool.filter(x => x !== correct)
  const shuffled = candidates.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function buildProductionOptions(
  correct: string,
  tense: TenseKey,
  person: PersonKey,
  allVerbs: VerbEntry[]
): string[] {
  const pool = allVerbs
    .filter(v => v.tenses[tense]?.[person] && v.tenses[tense]![person] !== correct)
    .map(v => v.tenses[tense]![person])
  const distractors = pickDistractors(pool, correct, 3)
  const options = [correct, ...distractors].sort(() => Math.random() - 0.5)
  return options
}

function buildRecognitionOptions(
  correctTense: TenseKey,
  correctPerson: PersonKey,
  activeTenses: TenseKey[],
  tenseLabel: (t: TenseKey) => string,
  personLabel: (p: PersonKey) => string
): RecognitionQuestion['options'] {
  const correctLabel = `${tenseLabel(correctTense)} · ${personLabel(correctPerson)}`

  // Generate 3 distractors by varying tense OR person (not both)
  const distractorCandidates: RecognitionQuestion['options'] = []

  for (const t of activeTenses) {
    if (t !== correctTense) {
      distractorCandidates.push({ tense: t, person: correctPerson, label: `${tenseLabel(t)} · ${personLabel(correctPerson)}` })
    }
  }
  for (const p of ALL_PERSONS) {
    if (p !== correctPerson) {
      distractorCandidates.push({ tense: correctTense, person: p, label: `${tenseLabel(correctTense)} · ${personLabel(p)}` })
    }
  }

  const distractors = pickDistractors(distractorCandidates, null as never, 3).slice(0, 3)
  const all = [
    { tense: correctTense, person: correctPerson, label: correctLabel },
    ...distractors,
  ].sort(() => Math.random() - 0.5)

  return all
}

// ─── Question builder ───────────────────────────────────────────────────────

function buildQuestion(
  triple: Triple,
  seen: number,
  allVerbs: VerbEntry[],
  activeTenses: TenseKey[],
  tenseLabel: (t: TenseKey) => string,
  personLabel: (p: PersonKey) => string
): Question {
  const { verb, tense, person } = triple
  const correctAnswer = verb.tenses[tense]![person]
  const isProduction = Math.random() < 0.7

  if (isProduction) {
    const useMultipleChoice = seen < 3
    if (useMultipleChoice) {
      const options = buildProductionOptions(correctAnswer, tense, person, allVerbs)
      const q: ProductionQuestion = { type: 'production-mc', verb, tense, person, correctAnswer, options }
      return q
    } else {
      return { type: 'production-typed', verb, tense, person, correctAnswer } as ProductionQuestion
    }
  } else {
    const options = buildRecognitionOptions(tense, person, activeTenses, tenseLabel, personLabel)
    const correctOptionIndex = options.findIndex(o => o.tense === tense && o.person === person)
    const conjugatedForm = correctAnswer
    return { type: 'recognition', verb, tense, person, conjugatedForm, options, correctOptionIndex } as RecognitionQuestion
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useDrill(
  activeTenses: TenseKey[],
  sessionSize: number,
  allVerbs: VerbEntry[],
  tenseLabel: (t: TenseKey) => string,
  personLabel: (p: PersonKey) => string
) {
  const { getWeight, getEntry, recordAnswer } = useProgress()

  // All drillable (verb, tense, person) triples
  const triples: Triple[] = useMemo(() => {
    const result: Triple[] = []
    for (const verb of allVerbs) {
      for (const tense of activeTenses) {
        if (!verb.tenses[tense]) continue
        for (const person of ALL_PERSONS) {
          if (verb.tenses[tense]![person]) {
            result.push({ verb, tense, person })
          }
        }
      }
    }
    return result
  }, [allVerbs, activeTenses])

  const [questions, setQuestions] = useState<Question[]>(() => {
    if (triples.length === 0) return []
    return Array.from({ length: sessionSize }, () => {
      const triple = weightedPick(triples, getWeight)
      const entry = getEntry(triple.verb.infinitive, triple.tense, triple.person)
      return buildQuestion(triple, entry.seen, allVerbs, activeTenses, tenseLabel, personLabel)
    })
  })
  const [index, setIndex] = useState(0)
  const [stats, setStats] = useState<SessionStats>({
    total: sessionSize, correct: 0, incorrect: 0, skipped: 0, streak: 0, bestStreak: 0, hardest: [],
  })
  const [sessionComplete, setSessionComplete] = useState(false)

  const advance = useCallback(
    (result: 'correct' | 'incorrect' | 'skip', q: Question) => {
      recordAnswer(q.verb.infinitive, q.tense, q.person, result)

      setStats(prev => {
        const next = { ...prev }
        if (result === 'correct') { next.correct += 1; next.streak += 1; next.bestStreak = Math.max(next.bestStreak, next.streak) }
        if (result === 'incorrect') { next.incorrect += 1; next.streak = 0 }
        if (result === 'skip') { next.skipped += 1; next.streak = 0 }
        // Track hardest: top 5 by incorrect count
        const entry = getEntry(q.verb.infinitive, q.tense, q.person)
        const existing = next.hardest.findIndex(
          h => h.verb === q.verb.infinitive && h.tense === q.tense && h.person === q.person
        )
        if (existing >= 0) {
          next.hardest[existing].incorrect = entry.incorrect
        } else {
          next.hardest.push({ verb: q.verb.infinitive, tense: q.tense, person: q.person, incorrect: entry.incorrect })
        }
        next.hardest = next.hardest
          .filter(h => h.incorrect > 0)
          .sort((a, b) => b.incorrect - a.incorrect)
          .slice(0, 5)
        return next
      })

      const nextIndex = index + 1
      if (nextIndex >= sessionSize) {
        setSessionComplete(true)
      } else {
        setIndex(nextIndex)
      }
    },
    [index, sessionSize, recordAnswer, getEntry]
  )

  const submitAnswer = useCallback(
    (answer: string) => {
      const q = questions[index]
      let result: 'correct' | 'incorrect'
      if (q.type === 'recognition') {
        const rq = q as RecognitionQuestion
        const chosen = rq.options.findIndex(o => o.label === answer)
        result = chosen === rq.correctOptionIndex ? 'correct' : 'incorrect'
      } else {
        const pq = q as ProductionQuestion
        result = answer.trim().toLowerCase() === pq.correctAnswer.trim().toLowerCase()
          ? 'correct'
          : 'incorrect'
      }
      advance(result, q)
    },
    [questions, index, advance]
  )

  const skip = useCallback(() => {
    advance('skip', questions[index])
  }, [questions, index, advance])

  const endSession = useCallback(() => {
    setSessionComplete(true)
  }, [])

  return {
    currentQuestion: questions[index] ?? null,
    questionNumber: index + 1,
    submitAnswer,
    skip,
    endSession,
    sessionComplete,
    sessionStats: stats,
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep -E "error TS" || echo "No TS errors"
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDrill.ts
git commit -m "feat: add useDrill hook with weighted question selection"
```

---

## Task 6: Answer Card Components

**Files:**
- Create: `src/components/MultipleChoiceCard.tsx`
- Create: `src/components/TypedCard.tsx`
- Create: `src/components/RecognitionCard.tsx`
- Create: `src/components/QuestionCard.tsx`

- [ ] **Step 1: Create MultipleChoiceCard**

```tsx
// src/components/MultipleChoiceCard.tsx
import { useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'

interface Props {
  options: string[]
  correctAnswer: string
  onAnswer: (answer: string) => void
}

export default function MultipleChoiceCard({ options, correctAnswer, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  function handleSelect(option: string) {
    if (selected !== null) return // already answered
    setSelected(option)
    setTimeout(() => onAnswer(option), 800)
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
      {options.map(option => {
        let variant: 'outlined' | 'contained' = 'outlined'
        let color: 'primary' | 'success' | 'error' = 'primary'
        let icon = null

        if (selected !== null) {
          if (option === correctAnswer) {
            variant = 'contained'
            color = 'success'
            icon = <CheckCircleOutlineIcon />
          } else if (option === selected && option !== correctAnswer) {
            variant = 'contained'
            color = 'error'
            icon = <CancelOutlinedIcon />
          }
        }

        return (
          <Button
            key={option}
            variant={variant}
            color={color}
            onClick={() => handleSelect(option)}
            startIcon={icon}
            sx={{ py: 2, fontSize: '1.1rem', textTransform: 'none' }}
          >
            {option}
          </Button>
        )
      })}
      {selected === null && (
        <Typography variant="caption" color="text.secondary" sx={{ gridColumn: '1/-1', textAlign: 'center' }}>
          Select an answer
        </Typography>
      )}
    </Box>
  )
}
```

- [ ] **Step 2: Create TypedCard**

```tsx
// src/components/TypedCard.tsx
import { useState, useRef, useEffect } from 'react'
import { Box, TextField, Button, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'

interface Props {
  correctAnswer: string
  onAnswer: (answer: string) => void
}

export default function TypedCard({ correctAnswer, onAnswer }: Props) {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit() {
    if (!value.trim() || submitted) return
    const correct = value.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
    setIsCorrect(correct)
    setSubmitted(true)
    setTimeout(() => onAnswer(value.trim()), 900)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        inputRef={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
        placeholder="Type the conjugation…"
        disabled={submitted}
        fullWidth
        inputProps={{ style: { textAlign: 'center', fontSize: '1.4rem' } }}
        color={submitted ? (isCorrect ? 'success' : 'error') : 'primary'}
        focused={submitted}
      />

      {submitted && !isCorrect && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
          <CheckCircleOutlineIcon fontSize="small" />
          <Typography variant="body2">Correct: <strong>{correctAnswer}</strong></Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitted || !value.trim()}
          startIcon={submitted ? (isCorrect ? <CheckCircleOutlineIcon /> : <CancelOutlinedIcon />) : undefined}
          color={submitted ? (isCorrect ? 'success' : 'error') : 'primary'}
          sx={{ flex: 1 }}
        >
          {submitted ? (isCorrect ? 'Correct!' : 'Incorrect') : 'Check'}
        </Button>
      </Box>
    </Box>
  )
}
```

- [ ] **Step 3: Create RecognitionCard**

```tsx
// src/components/RecognitionCard.tsx
import { useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import type { RecognitionQuestion } from '../types'

interface Props {
  question: RecognitionQuestion
  onAnswer: (answer: string) => void
}

export default function RecognitionCard({ question, onAnswer }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  function handleSelect(index: number) {
    if (selectedIndex !== null) return
    setSelectedIndex(index)
    setTimeout(() => onAnswer(question.options[index].label), 800)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {question.options.map((option, i) => {
        let variant: 'outlined' | 'contained' = 'outlined'
        let color: 'primary' | 'success' | 'error' = 'primary'
        let icon = null

        if (selectedIndex !== null) {
          if (i === question.correctOptionIndex) {
            variant = 'contained'; color = 'success'; icon = <CheckCircleOutlineIcon />
          } else if (i === selectedIndex && i !== question.correctOptionIndex) {
            variant = 'contained'; color = 'error'; icon = <CancelOutlinedIcon />
          }
        }

        return (
          <Button
            key={option.label}
            variant={variant}
            color={color}
            onClick={() => handleSelect(i)}
            startIcon={icon}
            sx={{ justifyContent: 'flex-start', textTransform: 'none', fontSize: '0.95rem', py: 1.5 }}
          >
            {option.label}
          </Button>
        )
      })}
      {selectedIndex === null && (
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          Identify the tense and person
        </Typography>
      )}
    </Box>
  )
}
```

- [ ] **Step 4: Create QuestionCard dispatcher**

```tsx
// src/components/QuestionCard.tsx
import { Box, Typography } from '@mui/material'
import type { Question, ProductionQuestion, RecognitionQuestion } from '../types'
import { TENSE_LABELS, PERSON_LABELS } from '../data/tenses'
import MultipleChoiceCard from './MultipleChoiceCard'
import TypedCard from './TypedCard'
import RecognitionCard from './RecognitionCard'

interface Props {
  question: Question
  questionNumber: number
  total: number
  correct: number
  incorrect: number
  onAnswer: (answer: string) => void
}

export default function QuestionCard({ question, questionNumber, total, correct, incorrect, onAnswer }: Props) {
  const tenseLabel = TENSE_LABELS[question.tense]
  const personLabel = PERSON_LABELS[question.person]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary' }}>
        <Typography variant="caption">Question {questionNumber} of {total}</Typography>
        <Typography variant="caption">✓ {correct} &nbsp; ✗ {incorrect}</Typography>
      </Box>

      {question.type === 'recognition' ? (
        <>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              Recognition · {(question as RecognitionQuestion).verb.infinitive}
            </Typography>
            <Typography variant="h3" fontWeight={700} mt={0.5}>
              {(question as RecognitionQuestion).conjugatedForm}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              What tense and person is this?
            </Typography>
          </Box>
          <RecognitionCard question={question as RecognitionQuestion} onAnswer={onAnswer} />
        </>
      ) : (
        <>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              {tenseLabel} · {personLabel}
            </Typography>
            <Typography variant="h3" fontWeight={700} mt={0.5}>
              {(question as ProductionQuestion).verb.infinitive}
            </Typography>
          </Box>
          {question.type === 'production-mc' ? (
            <MultipleChoiceCard
              options={(question as ProductionQuestion).options!}
              correctAnswer={(question as ProductionQuestion).correctAnswer}
              onAnswer={onAnswer}
            />
          ) : (
            <TypedCard
              correctAnswer={(question as ProductionQuestion).correctAnswer}
              onAnswer={onAnswer}
            />
          )}
        </>
      )}
    </Box>
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep -E "error TS" || echo "No TS errors"
```

- [ ] **Step 6: Commit**

```bash
git add src/components/
git commit -m "feat: add answer card components (MC, typed, recognition, dispatcher)"
```

---

## Task 7: SessionSummary Component

**Files:**
- Create: `src/components/SessionSummary.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/SessionSummary.tsx
import { Box, Button, Typography, Divider, Chip } from '@mui/material'
import type { SessionStats } from '../types'
import { TENSE_LABELS, PERSON_LABELS } from '../data/tenses'

interface Props {
  stats: SessionStats
  onBack: () => void
}

export default function SessionSummary({ stats, onBack }: Props) {
  const answered = stats.correct + stats.incorrect
  const pct = answered > 0 ? Math.round((stats.correct / answered) * 100) : 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 520, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700}>Session Complete</Typography>

      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" color="success.main" fontWeight={700}>{stats.correct}</Typography>
          <Typography variant="caption" color="text.secondary">Correct</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" color="error.main" fontWeight={700}>{stats.incorrect}</Typography>
          <Typography variant="caption" color="text.secondary">Incorrect</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" fontWeight={700}>{pct}%</Typography>
          <Typography variant="caption" color="text.secondary">Accuracy</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" color="primary.main" fontWeight={700}>{stats.bestStreak}</Typography>
          <Typography variant="caption" color="text.secondary">Best streak</Typography>
        </Box>
        {stats.skipped > 0 && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color="text.secondary" fontWeight={700}>{stats.skipped}</Typography>
            <Typography variant="caption" color="text.secondary">Skipped</Typography>
          </Box>
        )}
      </Box>

      {stats.hardest.length > 0 && (
        <>
          <Divider />
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Needs work
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {stats.hardest.map(h => (
                <Chip
                  key={`${h.verb}|${h.tense}|${h.person}`}
                  label={`${h.verb} · ${TENSE_LABELS[h.tense]} · ${PERSON_LABELS[h.person]}`}
                  variant="outlined"
                  color="error"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        </>
      )}

      <Button variant="contained" size="large" onClick={onBack}>
        Back to Dashboard
      </Button>
    </Box>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep -E "error TS" || echo "No TS errors"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SessionSummary.tsx
git commit -m "feat: add SessionSummary component"
```

---

## Task 8: Dashboard Page

**Files:**
- Replace: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Replace the stub Dashboard**

```tsx
// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Checkbox, Divider, FormControlLabel,
  FormGroup, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material'
import type { TenseKey, Settings } from '../types'
import { ALL_TENSES, TENSE_LABELS } from '../data/tenses'

const SETTINGS_KEY = 'practicar:settings'
const LAST_SESSION_KEY = 'practicar:lastSession'

const DEFAULT_SETTINGS: Settings = { tenses: [...ALL_TENSES], sessionSize: 20 }

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch { return DEFAULT_SETTINGS }
}

function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

interface LastSession { correct: number; total: number; streak: number; date: string }

function loadLastSession(): LastSession | null {
  try {
    const raw = localStorage.getItem(LAST_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const lastSession = loadLastSession()

  useEffect(() => { saveSettings(settings) }, [settings])

  function toggleTense(tense: TenseKey) {
    setSettings(prev => ({
      ...prev,
      tenses: prev.tenses.includes(tense)
        ? prev.tenses.filter(t => t !== tense)
        : [...prev.tenses, tense],
    }))
  }

  const canStart = settings.tenses.length > 0

  return (
    <Box sx={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h4" fontWeight={700}>Practice</Typography>

      <Box>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Tenses</Typography>
        <FormGroup>
          {ALL_TENSES.map(tense => (
            <FormControlLabel
              key={tense}
              control={
                <Checkbox
                  checked={settings.tenses.includes(tense)}
                  onChange={() => toggleTense(tense)}
                />
              }
              label={TENSE_LABELS[tense]}
            />
          ))}
        </FormGroup>
      </Box>

      <Box>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Questions per session</Typography>
        <ToggleButtonGroup
          value={settings.sessionSize}
          exclusive
          onChange={(_, v) => { if (v !== null) setSettings(prev => ({ ...prev, sessionSize: v })) }}
        >
          {[10, 20, 30, 50].map(n => (
            <ToggleButton key={n} value={n}>{n}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {lastSession && (
        <>
          <Divider />
          <Typography variant="body2" color="text.secondary">
            Last session: {lastSession.correct}/{lastSession.total} correct · {lastSession.streak} streak
          </Typography>
        </>
      )}

      <Button
        variant="contained"
        size="large"
        disabled={!canStart}
        onClick={() => navigate('/practice')}
        sx={{ alignSelf: 'flex-start' }}
      >
        Start Practice
      </Button>
    </Box>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep -E "error TS" || echo "No TS errors"
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: implement Dashboard page with tense selector and session size picker"
```

---

## Task 9: Practice Page

**Files:**
- Create: `src/pages/Practice.tsx`

- [ ] **Step 1: Create the Practice page**

```tsx
// src/pages/Practice.tsx
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, LinearProgress, Typography } from '@mui/material'
import type { TenseKey, Settings } from '../types'
import { ALL_TENSES, TENSE_LABELS, PERSON_LABELS } from '../data/tenses'
import { BUNDLED_VERBS } from '../data/verbs'
import { useDrill } from '../hooks/useDrill'
import QuestionCard from '../components/QuestionCard'
import SessionSummary from '../components/SessionSummary'

const SETTINGS_KEY = 'practicar:settings'
const CUSTOM_VERBS_KEY = 'practicar:customVerbs'
const LAST_SESSION_KEY = 'practicar:lastSession'

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { tenses: [...ALL_TENSES], sessionSize: 20, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { tenses: [...ALL_TENSES], sessionSize: 20 }
}

export default function Practice() {
  const navigate = useNavigate()

  const settings = useMemo(loadSettings, [])
  const customVerbs = useMemo(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_VERBS_KEY)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }, [])

  const allVerbs = useMemo(
    () => [...BUNDLED_VERBS, ...customVerbs],
    [customVerbs]
  )

  const { currentQuestion, questionNumber, submitAnswer, skip, endSession, sessionComplete, sessionStats } =
    useDrill(
      settings.tenses as TenseKey[],
      settings.sessionSize,
      allVerbs,
      (t: TenseKey) => TENSE_LABELS[t],
      (p) => PERSON_LABELS[p]
    )

  function handleBack() {
    if (sessionComplete) {
      localStorage.setItem(
        LAST_SESSION_KEY,
        JSON.stringify({ correct: sessionStats.correct, total: sessionStats.total, streak: sessionStats.bestStreak, date: new Date().toISOString() })
      )
    }
    navigate('/')
  }

  if (sessionComplete) {
    return (
      <Box sx={{ maxWidth: 600, py: 2 }}>
        <SessionSummary stats={sessionStats} onBack={handleBack} />
      </Box>
    )
  }

  if (!currentQuestion) {
    return (
      <Box>
        <Typography>No questions available. Check your tense selection on the Dashboard.</Typography>
        <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
      </Box>
    )
  }

  const progress = ((questionNumber - 1) / settings.sessionSize) * 100

  return (
    <Box sx={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <LinearProgress variant="determinate" value={progress} sx={{ flex: 1, mr: 2, height: 6, borderRadius: 3 }} />
        <Button size="small" color="inherit" onClick={endSession}>End Session</Button>
      </Box>

      <QuestionCard
        question={currentQuestion}
        questionNumber={questionNumber}
        total={settings.sessionSize}
        correct={sessionStats.correct}
        incorrect={sessionStats.incorrect}
        onAnswer={submitAnswer}
      />

      <Button variant="text" color="inherit" onClick={skip} sx={{ alignSelf: 'flex-end' }}>
        Skip
      </Button>
    </Box>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep -E "error TS" || echo "No TS errors"
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Practice.tsx
git commit -m "feat: implement Practice page drill loop"
```

---

## Task 10: Verbs Page

**Files:**
- Create: `src/pages/Verbs.tsx`

- [ ] **Step 1: Create the Verbs page**

```tsx
// src/pages/Verbs.tsx
import { useState } from 'react'
import {
  Box, Button, Collapse, Divider, IconButton, TextField,
  Typography, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { VerbEntry, TenseKey } from '../types'
import { ALL_TENSES, TENSE_LABELS, ALL_PERSONS, PERSON_LABELS } from '../data/tenses'

const STORAGE_KEY = 'practicar:customVerbs'

function loadCustomVerbs(): VerbEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCustomVerbs(verbs: VerbEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(verbs))
}

export default function Verbs() {
  const [verbs, setVerbs] = useState<VerbEntry[]>(loadCustomVerbs)
  const [showForm, setShowForm] = useState(false)
  const [infinitive, setInfinitive] = useState('')
  const [forms, setForms] = useState<Partial<Record<TenseKey, Partial<Record<string, string>>>>>({})

  function setForm(tense: TenseKey, person: string, value: string) {
    setForms(prev => ({
      ...prev,
      [tense]: { ...prev[tense], [person]: value },
    }))
  }

  function handleAdd() {
    if (!infinitive.trim()) return
    const tenses: VerbEntry['tenses'] = {}
    for (const tense of ALL_TENSES) {
      const tenseData = forms[tense]
      if (!tenseData) continue
      const filled: Record<string, string> = {}
      for (const person of ALL_PERSONS) {
        if (tenseData[person]?.trim()) filled[person] = tenseData[person]!.trim()
      }
      if (Object.keys(filled).length > 0) {
        tenses[tense] = filled as VerbEntry['tenses'][TenseKey]
      }
    }
    const entry: VerbEntry = { infinitive: infinitive.trim(), tenses, isCustom: true }
    const updated = [...verbs, entry]
    setVerbs(updated)
    saveCustomVerbs(updated)
    setInfinitive('')
    setForms({})
    setShowForm(false)
  }

  function handleDelete(index: number) {
    const updated = verbs.filter((_, i) => i !== index)
    setVerbs(updated)
    saveCustomVerbs(updated)
  }

  return (
    <Box sx={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={700}>Custom Verbs</Typography>
        <Button variant="contained" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : 'Add Verb'}
        </Button>
      </Box>

      <Collapse in={showForm}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <TextField
            label="Infinitive"
            value={infinitive}
            onChange={e => setInfinitive(e.target.value)}
            placeholder="e.g. trabajar"
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            Fill in only the tenses you want to drill. All fields are optional.
          </Typography>
          {ALL_TENSES.map(tense => (
            <Accordion key={tense} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body2">{TENSE_LABELS[tense]}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  {ALL_PERSONS.map(person => (
                    <TextField
                      key={person}
                      label={PERSON_LABELS[person]}
                      size="small"
                      value={forms[tense]?.[person] ?? ''}
                      onChange={e => setForm(tense, person, e.target.value)}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
          <Button variant="contained" onClick={handleAdd} disabled={!infinitive.trim()}>
            Save Verb
          </Button>
        </Box>
      </Collapse>

      <Divider />

      {verbs.length === 0 ? (
        <Typography color="text.secondary">No custom verbs yet.</Typography>
      ) : (
        verbs.map((verb, i) => (
          <Box key={verb.infinitive} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography fontWeight={600}>{verb.infinitive}</Typography>
              <Typography variant="caption" color="text.secondary">
                {Object.keys(verb.tenses).map(t => TENSE_LABELS[t as TenseKey]).join(', ')}
              </Typography>
            </Box>
            <IconButton onClick={() => handleDelete(i)} color="error" size="small">
              <DeleteIcon />
            </IconButton>
          </Box>
        ))
      )}
    </Box>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep -E "error TS" || echo "No TS errors"
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Verbs.tsx
git commit -m "feat: implement Verbs page for custom verb management"
```

---

## Task 11: Routing & Navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1: Update App.tsx with new routes**

Replace the contents of `src/App.tsx`:

```tsx
// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Practice from './pages/Practice'
import Verbs from './pages/Verbs'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="practice" element={<Practice />} />
        <Route path="verbs" element={<Verbs />} />
      </Route>
    </Routes>
  )
}

export default App
```

- [ ] **Step 2: Update Layout.tsx nav items**

In `src/components/Layout.tsx`, replace the `navItems` array:

```ts
const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Practice', to: '/practice' },
  { label: 'Verbs', to: '/verbs' },
]
```

- [ ] **Step 3: Verify the full build succeeds**

```bash
npm run build
```

Expected: Build completes with no TypeScript errors. Ignore any size warnings.

- [ ] **Step 4: Smoke test in the browser**

```bash
npm run dev
```

Open http://localhost:5173 and verify:
- Dashboard loads with tense checkboxes and session size picker
- "Start Practice" navigates to `/practice` and shows a question
- Answering a question advances to the next
- "End Session" shows the summary with a "Back to Dashboard" button
- Verbs nav link opens the Verbs page; adding a custom verb saves it
- Refreshing the page preserves settings and progress (localStorage)

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/Layout.tsx
git commit -m "feat: wire up routing and nav links — app complete"
```
