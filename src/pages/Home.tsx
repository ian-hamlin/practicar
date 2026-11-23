import { Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'
import { allVerbs, countTag, letters } from '../verbs.ts'
import classes from './Home.module.css'

const stats = [
  { label: 'verbs', value: allVerbs.length },
  { label: 'regular', value: countTag('regular') },
  { label: 'irregular', value: countTag('irregular') },
  { label: 'reflexive', value: countTag('reflexive') },
]

export function Home() {
  return (
    <Stack gap="xl">
      <div className={classes.hero}>
        <Title className={classes.title}>
          Practise every verb, <em>every tense.</em>
        </Title>
        <Text size="lg" c="dimmed" mt="sm" maw={560}>
          Pick a verb and fill in its conjugations. Switch to Study whenever you want to see the
          answers.
        </Text>
        <Group mt="xl" gap="sm">
          {stats.map((s) => (
            <div key={s.label} className={classes.stat}>
              <div className={classes.statValue}>{s.value}</div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.06em">
                {s.label}
              </Text>
            </div>
          ))}
        </Group>
      </div>

      <SimpleGrid cols={{ base: 2, xs: 3, md: 4, lg: 5 }} spacing="md">
        {letters.map((l) => (
          <Link key={l.letter} to={`/letters/${l.letter}`} className={classes.card}>
            <div className={classes.letter}>{l.letter.toUpperCase()}</div>
            <span className={classes.count}>{l.verbs.length}</span>
            <Text size="sm" c="dimmed" mt="sm" truncate>
              {l.first} – {l.last}
            </Text>
          </Link>
        ))}
      </SimpleGrid>
    </Stack>
  )
}
