import { useLocalStorage } from '@mantine/hooks'
import { flushSync } from 'react-dom'

export type Mode = 'practice' | 'study'

/** Practice (fill in the forms) or Study (show the answers), shared across the app. */
export function useMode() {
  return useLocalStorage<Mode>({ key: 'practicar-mode', defaultValue: 'practice' })
}

/**
 * Applies `update` while keeping the section you're looking at in the same place on screen.
 * Switching mode changes the height of content above (notes, score bar), which would
 * otherwise push the current section out of view.
 */
export function keepScrollPosition(update: () => void) {
  const headerHeight =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-shell-header-height')) ||
    0
  const anchor = [...document.querySelectorAll<HTMLElement>('[data-scroll-anchor]')].find(
    (el) => el.getBoundingClientRect().bottom > headerHeight,
  )
  const id = anchor?.dataset.scrollAnchor
  const before = anchor?.getBoundingClientRect().top

  flushSync(update)

  if (id === undefined || before === undefined) return
  const after = document.querySelector(`[data-scroll-anchor="${CSS.escape(id)}"]`)
  if (after) window.scrollBy(0, after.getBoundingClientRect().top - before)
}
