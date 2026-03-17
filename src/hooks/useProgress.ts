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
