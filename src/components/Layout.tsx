import { AppShell, Burger, Group, ScrollArea, SegmentedControl } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Link, Outlet, useLocation } from 'react-router'
import { keepScrollPosition, type Mode, useMode } from '../mode.ts'
import classes from './Layout.module.css'
import { VerbMenu } from './VerbMenu.tsx'

export function Layout() {
  const [opened, { toggle, close }] = useDisclosure()
  const { pathname } = useLocation()
  const [mode, setMode] = useMode()

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="xl"
    >
      <AppShell.Header className={classes.header}>
        <Group h="100%" px="lg" justify="space-between">
          <Group gap="sm">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label="Toggle navigation"
            />
            <Link to="/" className={classes.brand} onClick={close}>
              <span className={classes.logo}>P</span>
              <span className={classes.wordmark}>Practicar</span>
            </Link>
          </Group>
          <SegmentedControl
            value={mode}
            onChange={(v) => keepScrollPosition(() => setMode(v as Mode))}
            data={[
              { label: 'Practice', value: 'practice' },
              { label: 'Study', value: 'study' },
            ]}
          />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className={classes.navbar} p="sm">
        <AppShell.Section grow component={ScrollArea} type="scroll">
          <VerbMenu onNavigate={close} />
        </AppShell.Section>
        <AppShell.Section pt="xs">
          <Link
            to="/about"
            className={classes.footerLink}
            data-active={pathname === '/about' || undefined}
            onClick={close}
          >
            About
          </Link>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <div className={classes.main}>
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
  )
}
