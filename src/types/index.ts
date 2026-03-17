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

export type TenseForms = Partial<Record<PersonKey, string>>

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
