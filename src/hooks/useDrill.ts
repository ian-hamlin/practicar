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

  const [questions] = useState<Question[]>(() => {
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
        const chosen = parseInt(answer, 10)
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
