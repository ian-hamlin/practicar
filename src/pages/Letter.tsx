import { Group, Stack, Text } from '@mantine/core'
import { Link, useParams } from 'react-router'
import { VerbTags } from '../components/VerbTags.tsx'
import { getLetter, verbSlug } from '../verbs.ts'
import classes from './Letter.module.css'
import { NotFound } from './NotFound.tsx'

export function Letter() {
  const { letter = '' } = useParams()
  const group = getLetter(letter)
  if (!group) return <NotFound />

  return (
    <Stack gap="xl">
      <Group align="flex-end" gap="lg">
        <div className={classes.bigLetter}>{letter.toUpperCase()}</div>
        <Text c="dimmed" pb={6}>
          {group.verbs.length} {group.verbs.length === 1 ? 'verb' : 'verbs'} · {group.first} –{' '}
          {group.last}
        </Text>
      </Group>

      <div className={classes.list}>
        {group.verbs.map((verb) => (
          <Link key={verb.id} to={`/verbs/${verbSlug(verb)}`} className={classes.row}>
            <span className={classes.infinitive}>{verb.infinitive}</span>
            <Text size="sm" c="dimmed">
              {verb.desc}
            </Text>
            <VerbTags tags={verb.tags} size="xs" />
          </Link>
        ))}
      </div>
    </Stack>
  )
}
