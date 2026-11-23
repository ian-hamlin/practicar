import { Badge, Group } from '@mantine/core'
import { displayTags } from '../verbs.ts'

const colors: Record<string, string> = {
  regular: 'teal',
  irregular: 'terracotta',
  reflexive: 'grape',
}

export function VerbTags({ tags, size = 'sm' }: { tags: string[]; size?: 'xs' | 'sm' | 'md' }) {
  return (
    <Group gap={6}>
      {displayTags(tags).map((tag) => (
        <Badge key={tag} size={size} variant="light" color={colors[tag] ?? 'indigo'} radius="sm">
          {tag}
        </Badge>
      ))}
    </Group>
  )
}
