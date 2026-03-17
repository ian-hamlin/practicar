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
