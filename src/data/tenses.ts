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
