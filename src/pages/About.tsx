import { Anchor, Group, Stack, Text, Title } from '@mantine/core'
import { IconBrandGithub } from '@tabler/icons-react'

export function About() {
  return (
    <Stack>
      <Title order={1}>About</Title>
      <Text>Built with React, Vite, TypeScript and Mantine.</Text>
      <Text c="dimmed">Vibe coded.</Text>
      <Anchor href="https://github.com/ian-hamlin/practicar/" target="_blank" rel="noreferrer">
        <Group gap={6} component="span">
          <IconBrandGithub size={18} />
          github.com/ian-hamlin/practicar
        </Group>
      </Anchor>
    </Stack>
  )
}
