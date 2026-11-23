import indexJson from './data/index.json'
import type { Category, Verb, VerbIndex, VerbSummary } from './types/verbs.ts'

const verbIndex = indexJson as VerbIndex

// Category files are small, so bundle them up front for the menu.
const categoryModules = import.meta.glob<Category>('./data/category_*.json', {
  eager: true,
  import: 'default',
})

// Verb files are large, so each one is split into its own chunk and loaded on demand.
const verbModules = import.meta.glob<Verb>('./data/verbs/*.json', {
  import: 'default',
})

export interface LetterGroup {
  letter: string
  first: string
  last: string
  verbs: VerbSummary[]
}

/** Letters that have at least one verb, in index order. */
export const letters: LetterGroup[] = verbIndex.letters
  .filter((l) => l.count > 0)
  .map((l) => ({
    letter: l.letter,
    first: l.first ?? '',
    last: l.last ?? '',
    verbs: categoryModules[`./data/${l.categoryFile}`]?.verbs ?? [],
  }))

export const allVerbs: VerbSummary[] = letters.flatMap((l) => l.verbs)

export function getLetter(letter: string): LetterGroup | undefined {
  return letters.find((l) => l.letter === letter)
}

/** URL slug for a verb, taken from its file name, e.g. "verbs/Abrir.json" -> "Abrir". */
export function verbSlug(verb: VerbSummary): string {
  return verb.file.replace(/^verbs\//, '').replace(/\.json$/, '')
}

const letterBySlug = new Map(
  letters.flatMap((l) => l.verbs.map((v) => [verbSlug(v), l.letter] as const)),
)

export function letterForSlug(slug: string): string | undefined {
  return letterBySlug.get(slug)
}

/** The verbs either side of `slug` in A–Z order. */
export function neighbours(slug: string) {
  const i = allVerbs.findIndex((v) => verbSlug(v) === slug)
  return { prev: allVerbs[i - 1], next: i >= 0 ? allVerbs[i + 1] : undefined }
}

export function countTag(tag: string): number {
  return allVerbs.filter((v) => v.tags.includes(tag)).length
}

export async function loadVerb(slug: string): Promise<Verb> {
  const load = verbModules[`./data/verbs/${slug}.json`]
  if (!load) throw new Response('Verb not found', { status: 404 })
  return load()
}

/** Accent- and case-insensitive form for searching, e.g. "Añadir" -> "anadir". */
export function normalise(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

const tagLabels: Record<string, string> = {
  stem_o_ue: 'o → ue',
  stem_e_ie: 'e → ie',
  stem_e_i: 'e → i',
  stem_u_ue: 'u → ue',
}

/** Display tags, minus the "verb" tag every entry carries. */
export function displayTags(tags: string[]): string[] {
  return tags.filter((t) => t !== 'verb').map((t) => tagLabels[t] ?? t)
}

export const moods: { name: string; tenses: string[] }[] = [
  {
    name: 'Indicativo',
    tenses: [
      'Presente',
      'Pretérito Indefinido',
      'Pretérito Imperfecto',
      'Pretérito Perfecto',
      'Pluscuamperfecto',
      'Futuro Simple',
      'Futuro Compuesto',
      'Condicional',
    ],
  },
  {
    name: 'Subjuntivo',
    tenses: ['Subjuntivo Presente', 'Imperfecto de Subjuntivo', 'Pluscuamperfecto de Subjuntivo'],
  },
  { name: 'Imperativo', tenses: ['Imperativo Afirmativo', 'Imperativo Negativo'] },
]
