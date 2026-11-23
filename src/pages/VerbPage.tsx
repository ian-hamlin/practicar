import { Button, Group, List, Progress, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { IconCheck, IconEye, IconEyeOff, IconRefresh, IconX } from '@tabler/icons-react'
import { useState, type KeyboardEvent } from 'react'
import { Link, useLoaderData, useParams } from 'react-router'
import { type Mode, useMode } from '../mode.ts'
import { InlineMarkdown } from '../components/Markdown.tsx'
import { VerbTags } from '../components/VerbTags.tsx'
import type { Verb, VerbSummary } from '../types/verbs.ts'
import { moods, neighbours, normalise, verbSlug } from '../verbs.ts'
import classes from './VerbPage.module.css'

type Status = 'correct' | 'accent' | 'wrong'

interface Field {
  key: string
  label: string
  answer: string
}

function clean(text: string) {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

function grade(input: string, answer: string): Status {
  if (clean(input) === clean(answer)) return 'correct'
  if (normalise(clean(input)) === normalise(clean(answer))) return 'accent'
  return 'wrong'
}

/** Enter moves to the next blank on the page, like tabbing through a worksheet. */
function focusNext(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key !== 'Enter') return
  e.preventDefault()
  const inputs = [...document.querySelectorAll<HTMLInputElement>('input[data-drill]')]
  const i = inputs.indexOf(e.currentTarget)
  ;(inputs.slice(i + 1).find((el) => !el.readOnly) ?? e.currentTarget).focus()
  e.currentTarget.blur()
}

interface DrillState {
  answers: Record<string, string>
  checked: Record<string, Status>
  revealed: Set<string>
}

function useDrill() {
  const [state, setState] = useState<DrillState>({ answers: {}, checked: {}, revealed: new Set() })

  return {
    ...state,
    type: (key: string, value: string) =>
      setState((s) => {
        const checked = { ...s.checked }
        delete checked[key]
        return { ...s, answers: { ...s.answers, [key]: value }, checked }
      }),
    check: (fields: Field[]) =>
      setState((s) => {
        const checked = { ...s.checked }
        for (const f of fields) {
          const value = s.answers[f.key] ?? ''
          if (value.trim()) checked[f.key] = grade(value, f.answer)
        }
        return { ...s, checked }
      }),
    reveal: (fields: Field[]) =>
      setState((s) => ({ ...s, revealed: new Set([...s.revealed, ...fields.map((f) => f.key)]) })),
    hide: (fields: Field[]) =>
      setState((s) => {
        const revealed = new Set(s.revealed)
        for (const f of fields) revealed.delete(f.key)
        return { ...s, revealed }
      }),
    reset: () => setState({ answers: {}, checked: {}, revealed: new Set() }),
  }
}

type Drill = ReturnType<typeof useDrill>

function FormRow({ field, mode, drill }: { field: Field; mode: Mode; drill: Drill }) {
  if (mode === 'study') {
    return (
      <div className={classes.row}>
        <span className={classes.subject}>{field.label}</span>
        <span className={classes.answer}>{field.answer}</span>
      </div>
    )
  }

  const status = drill.checked[field.key]
  const revealed = drill.revealed.has(field.key) && status !== 'correct'

  return (
    <div className={classes.row}>
      <label className={classes.subject} htmlFor={field.key}>
        {field.label}
      </label>
      <div>
        <div className={classes.inputWrap} data-status={status}>
          <input
            id={field.key}
            data-drill
            className={classes.input}
            value={drill.answers[field.key] ?? ''}
            onChange={(e) => drill.type(field.key, e.currentTarget.value)}
            onBlur={() => drill.check([field])}
            onKeyDown={focusNext}
            readOnly={status === 'correct'}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {status === 'correct' && <IconCheck size={16} className={classes.statusIcon} />}
          {status === 'wrong' && <IconX size={16} className={classes.statusIcon} />}
        </div>
        {status === 'accent' && <div className={classes.hint}>Check the accents</div>}
        {revealed && <div className={classes.reveal}>{field.answer}</div>}
      </div>
    </div>
  )
}

function FormCard({
  title,
  fields,
  mode,
  drill,
}: {
  title: string
  fields: Field[]
  mode: Mode
  drill: Drill
}) {
  const done = fields.filter((f) => drill.checked[f.key] === 'correct').length
  const shown = fields.some((f) => drill.revealed.has(f.key))
  return (
    <div className={classes.card} data-scroll-anchor={title}>
      <div className={classes.cardHeader}>
        <span>{title}</span>
        {mode === 'practice' && (
          <Group gap={6}>
            <Text size="xs" c={done === fields.length ? 'teal' : 'dimmed'} fw={600}>
              {done}/{fields.length}
            </Text>
            <Button
              size="compact-xs"
              variant="subtle"
              color="gray"
              leftSection={shown ? <IconEyeOff size={12} /> : <IconEye size={12} />}
              onClick={() => (shown ? drill.hide(fields) : drill.reveal(fields))}
            >
              {shown ? 'Hide' : 'Show'}
            </Button>
          </Group>
        )}
      </div>
      <div className={classes.cardBody}>
        {fields.map((f) => (
          <FormRow key={f.key} field={f} mode={mode} drill={drill} />
        ))}
      </div>
    </div>
  )
}

function Pager({ verb, direction }: { verb?: VerbSummary; direction: 'prev' | 'next' }) {
  if (!verb) return null
  return (
    <Link
      to={`/verbs/${verbSlug(verb)}`}
      className={classes.pager}
      data-next={direction === 'next' || undefined}
    >
      <Text size="xs" c="dimmed">
        {direction === 'prev' ? '← Previous' : 'Next →'}
      </Text>
      <Text fw={600} ff="heading">
        {verb.infinitive}
      </Text>
    </Link>
  )
}

function VerbDrill({ verb, slug }: { verb: Verb; slug: string }) {
  const [mode] = useMode()
  const drill = useDrill()
  const { prev, next } = neighbours(slug)

  const knownTenses = new Set(moods.flatMap((m) => m.tenses))
  const otherTenses = Object.keys(verb.tenses).filter((t) => !knownTenses.has(t))
  const groups = [...moods, ...(otherTenses.length ? [{ name: 'Otros', tenses: otherTenses }] : [])]
    .map((m) => ({ ...m, tenses: m.tenses.filter((t) => verb.tenses[t]) }))
    .filter((m) => m.tenses.length > 0)

  const tenseFields = (tense: string): Field[] =>
    verb.tenses[tense].map((c) => ({
      key: `${tense}|${c.subject}`,
      label: c.subject,
      answer: c.conjugation,
    }))
  const nonFinite: Field[] = [
    { key: 'gerundio', label: 'gerundio', answer: verb.gerundio },
    { key: 'participio', label: 'participio', answer: verb.participio },
  ]
  const allFields = [...nonFinite, ...groups.flatMap((m) => m.tenses.flatMap(tenseFields))]
  const correct = allFields.filter((f) => drill.checked[f.key] === 'correct').length

  return (
    <Stack gap={36}>
      <Stack gap="md">
        <Link to={`/letters/${verb.letter}`} className={classes.eyebrow}>
          ← {verb.letter.toUpperCase()}
        </Link>
        <div>
          <Title className={classes.title}>{verb.infinitive}</Title>
          <Text className={classes.meaning} mt={6}>
            {verb.englishMeaning}
          </Text>
        </div>
        <VerbTags tags={verb.tags} />
      </Stack>

      {mode === 'practice' ? (
        <div className={classes.scoreBar}>
          <div className={classes.score}>
            <Text fw={600}>
              {correct} <Text span c="dimmed" fw={400}>of {allFields.length} correct</Text>
            </Text>
            <Progress value={(correct / allFields.length) * 100} size="sm" mt={6} color="teal" />
          </div>
          <Group gap="xs">
            <Button variant="light" leftSection={<IconCheck size={16} />} onClick={() => drill.check(allFields)}>
              Check all
            </Button>
            <Button variant="subtle" color="gray" leftSection={<IconRefresh size={16} />} onClick={drill.reset}>
              Reset
            </Button>
          </Group>
        </div>
      ) : (
        verb.notes.length > 0 && (
          <div className={classes.notes}>
            <List spacing={6} size="sm">
              {verb.notes.map((note, i) => (
                <List.Item key={i}>
                  <InlineMarkdown text={note} />
                </List.Item>
              ))}
            </List>
          </div>
        )
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        <FormCard title="Formas no personales" fields={nonFinite} mode={mode} drill={drill} />
      </SimpleGrid>

      {groups.map((mood) => (
        <Stack key={mood.name} gap="md">
          <div className={classes.mood} data-scroll-anchor={mood.name}>
            <Title order={2}>{mood.name}</Title>
            <Text size="sm" c="dimmed">
              {mood.tenses.length} {mood.tenses.length === 1 ? 'tense' : 'tenses'}
            </Text>
          </div>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {mood.tenses.map((t) => (
              <FormCard key={t} title={t} fields={tenseFields(t)} mode={mode} drill={drill} />
            ))}
          </SimpleGrid>
        </Stack>
      ))}

      <Group justify="space-between">
        <Pager verb={prev} direction="prev" />
        <Pager verb={next} direction="next" />
      </Group>
    </Stack>
  )
}

export function VerbPage() {
  const verb = useLoaderData<Verb>()
  const { slug = '' } = useParams()
  // Keyed by slug so answers reset when moving to another verb.
  return <VerbDrill key={slug} verb={verb} slug={slug} />
}
