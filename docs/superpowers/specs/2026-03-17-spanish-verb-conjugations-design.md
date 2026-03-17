# Spanish Verb Conjugation Practice App — Design Spec

**Date:** 2026-03-17
**Project:** practicar (Vite + React 18 + TypeScript + MUI)

---

## Overview

A browser-based drill app for practicing Spanish verb conjugations. Targets Latin American Spanish (South and Central America). Supports mixed recognition and production exercises with adaptive difficulty, weighted question selection, and cross-session progress persistence.

---

## Goals & Constraints

- Latin American Spanish focus — no vosotros, no Spain-specific vocabulary; exclude verbs that are vulgar in Latin America (e.g. "coger")
- Five subjects only: yo, tú, él/ella/usted, nosotros/nosotras, ellos/ellas/ustedes
- Eight tenses: Presente, Pretérito indefinido, Pretérito imperfecto, Futuro simple, Condicional, Subjuntivo presente, Pretérito perfecto, Pluscuamperfecto
- No backend — all state in localStorage
- Only free MUI components (MIT tier)

---

## Data Layer

### Verb Data Source

Conjugation data is sourced from [ian-hamlin/verb-data](https://github.com/ian-hamlin/verb-data/tree/master/json/spanish). Each verb is stored as a JSON file with a `conjugations` array keyed by `group` (e.g. `indicative/present`) and `form` (s1–s3, p1–p3).

### Bundled Verb List

A curated set of ~150 high-frequency Latin American Spanish verbs is pre-processed and bundled as `src/data/verbs.ts` at build time. No network calls at runtime.

**Tense key mapping** (data group → app tense key):

| App tense key | Data group |
|---|---|
| `presente` | `indicative/present` |
| `indefinido` | `indicative/preterite` |
| `imperfecto` | `indicative/imperfect` |
| `futuro` | `indicative/future` |
| `condicional` | `indicative/conditional` |
| `subjuntivo` | `subjunctive/present` |
| `perfecto` | computed (see below) |
| `pluscuamperfecto` | computed (see below) |

**p2 (vosotros) is omitted** throughout. Only s1, s2, s3, p1, p3 are stored and drilled.

### Compound Tenses

Pretérito perfecto and Pluscuamperfecto are not stored directly in the source data. They are computed at build time by combining haber's conjugations with each verb's past participle:

- **Pretérito perfecto**: haber (presente) + past participle — e.g. "he hablado"
- **Pluscuamperfecto**: haber (imperfecto) + past participle — e.g. "había hablado"

Computed forms are stored in the same `VerbEntry` structure as simple tenses — no runtime computation.

**haber** is included in the bundled verb list for compound-tense computation purposes only. It is **excluded from drills** — users never see haber as a question subject.

### VerbEntry Type

```ts
type TenseForms = {
  s1: string
  s2: string
  s3: string
  p1: string
  p3: string
}

type VerbEntry = {
  infinitive: string
  tenses: Partial<Record<TenseKey, TenseForms>>
  isCustom?: boolean
}

type TenseKey =
  | 'presente' | 'indefinido' | 'imperfecto'
  | 'futuro' | 'condicional' | 'subjuntivo'
  | 'perfecto' | 'pluscuamperfecto'
```

### Custom Verbs

Users can add custom verbs via the `/verbs` page. Custom verbs are stored in localStorage in the same `VerbEntry` shape and merged with the bundled list at runtime.

---

## Drill Engine

### Question Types

**Production** — given verb + tense + person, produce the conjugated form.
Example: "hablar → Pretérito indefinido / él/ella/usted" → answer: "habló"

**Recognition** — given a conjugated form, identify the tense and person.
Example: "vivíamos" → answer: "Pretérito imperfecto · nosotros/nosotras"

Recognition answers are always multiple choice. Each option is a **tense + person pair** (e.g. "Pretérito imperfecto · nosotros/nosotras"). The 4 options always include the correct tense+person pair plus 3 distractors — chosen by varying either the tense or the person (never both at once), drawn from the active tense set.

Within a session, the engine picks the next (verb, tense, person) triple by weighted random draw, then independently assigns the question type: **70% production, 30% recognition**. There are no alternating queues — type assignment is probabilistic per question.

### Multiple Choice → Typed Recall Progression

Each `(verb, tense, person)` triple tracks a `seen` count in localStorage.

- `seen < 3`: production questions are multiple choice (4 options: 1 correct + 3 distractors)
- `seen >= 3`: production questions become typed free-text input

`seen` is incremented on every answer submission, including skips. Skips do not affect `correct` or `incorrect` counts.

### Distractor Generation

| Question type | Correct answer | Distractors |
|---|---|---|
| Production MC | conjugated form for the given verb/tense/person | 3 conjugations of the **same tense + same person** from other verbs in the active list |
| Recognition MC | tense + person pair | 3 tense+person pairs: vary either the tense **or** the person (not both), drawn from the active tense set |

Recognition questions are always multiple choice.

### Weighted Frequency Selection

Each triple has a computed weight:

```
weight = max(1, 1 + (incorrect * 2) - correct)
```

Questions are selected by weighted random draw across all active (verb, tense, person) triples filtered by the session's selected tenses. Unseen triples (no history) receive a starting weight of **3** to ensure gradual introduction alongside familiar material.

### Session Flow

1. User configures tenses and session size on the Dashboard (defaults: all tenses enabled, 20 questions)
2. Drill loop: question rendered → user answers → instant feedback shown → next question
3. Session ends after N questions, or when the user clicks the **"End Session"** button visible throughout the drill
4. Post-session: `SessionSummary` renders inline on the Practice page (score, streak, hardest verb/tense combos) with a "Back to Dashboard" button — no automatic navigation

---

## UI & Pages

### Routing

| Path | Page | Purpose |
|---|---|---|
| `/` | Dashboard | Tense selector, session size, start button, last session summary |
| `/practice` | Practice | Active drill loop |
| `/verbs` | Verbs | Add/remove custom verbs |

The existing `Layout` (AppBar + sidebar drawer) gains nav links for Practice and Verbs.

### Dashboard

- Checkbox list of 8 tenses (persisted in localStorage)
- Session size picker: 10 / 20 / 30 / 50
- Last session stats (score, streak)
- "Start Practice" button → navigates to `/practice`

### Practice Page

- Progress indicator: "Question N of Total · ✓ correct ✗ incorrect"
- Tense + person label (e.g. "Pretérito indefinido · nosotros/nosotras")
- Verb infinitive displayed large
- Answer area: `MultipleChoiceCard`, `TypedCard`, or `RecognitionCard` depending on question type and seen count
- Skip button available at all times
- Post-session: `SessionSummary` component shown inline

### Verbs Page

- List of custom verbs with delete action
- Form to add a new verb: infinitive entry + conjugation inputs per tense/person
  - All 8 tenses × 5 persons = 40 fields; **all are optional** — the user may fill in only the tenses they care about
  - At drill time, if a custom verb has no data for a currently active tense, that (verb, tense) combination is **silently excluded** from the question pool — no error shown
  - If fewer than 4 verbs have data for a given tense+person (needed for MC distractors), the app uses however many are available (minimum 2 options shown)

---

## Component Structure

```
src/
  data/
    verbs.ts              # ~150 bundled VerbEntry objects
    tenses.ts             # TenseKey → display name + data group mapping
  hooks/
    useDrill.ts           # question generation, weighting, session state
    useProgress.ts        # localStorage read/write for progress weights
  pages/
    Dashboard.tsx
    Practice.tsx
    Verbs.tsx
  components/
    QuestionCard.tsx      # dispatches to correct card variant
    MultipleChoiceCard.tsx
    TypedCard.tsx
    RecognitionCard.tsx
    SessionSummary.tsx
```

### Hook Responsibilities

**`useProgress`**
- Reads/writes `localStorage` key `practicar:progress`
- Shape: `Record<"verb|tense|form", { correct: number, incorrect: number, seen: number }>`
- Exposes: `getWeight(verb, tense, form)`, `recordAnswer(verb, tense, form, result: 'correct' | 'incorrect' | 'skip')`
  - `'correct'` / `'incorrect'`: increments `seen` + the respective counter
  - `'skip'`: increments `seen` only

**`useDrill`**
- Takes: active tense list, session size, all verbs (bundled + custom)
- Uses `useProgress` for weighted selection
- Generates question sequence for the session
- Exposes: `currentQuestion`, `submitAnswer(answer)`, `skip()`, `sessionComplete`, `sessionStats`

---

## State & Persistence

| Key | Shape | Purpose |
|---|---|---|
| `practicar:progress` | `Record<string, ProgressEntry>` | Per-triple weights and seen counts |
| `practicar:settings` | `{ tenses: TenseKey[], sessionSize: number }` | Dashboard configuration |
| `practicar:customVerbs` | `VerbEntry[]` | User-added verbs |

---

## Out of Scope

- User accounts / cloud sync
- Audio pronunciation
- Voseo as a separate subject (tú form in the data already includes vos variants where applicable)
- Spain-specific tenses or vocabulary
- Vosotros conjugations
