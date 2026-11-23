import { Button, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'

export function NotFound() {
  return (
    <Stack align="flex-start">
      <Title order={1}>Page not found</Title>
      <Text>The page you're looking for doesn't exist.</Text>
      <Button component={Link} to="/">
        Back home
      </Button>
    </Stack>
  )
}
