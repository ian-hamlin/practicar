export interface LetterSummary {
  id: string
  letter: string
  count: number
  first: string | null
  last: string | null
  categoryFile: string
}

export interface VerbIndex {
  generatedAt: string
  totalVerbs: number
  letters: LetterSummary[]
}

export interface VerbSummary {
  id: string
  infinitive: string
  desc: string
  tags: string[]
  file: string
}

export interface Category {
  id: string
  letter: string
  count: number
  verbs: VerbSummary[]
}

export interface Conjugation {
  subject: string
  conjugation: string
}

export interface Verb {
  id: string
  infinitive: string
  englishMeaning: string
  desc: string
  tags: string[]
  letter: string
  categoryId: string
  gerundio: string
  participio: string
  tenses: Record<string, Conjugation[]>
  notes: string[]
  sourceFile: string
}
