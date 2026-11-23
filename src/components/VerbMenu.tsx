import { IconHome2 } from '@tabler/icons-react'
import { Link, useLocation, useMatch } from 'react-router'
import { letterForSlug, letters } from '../verbs.ts'
import classes from './VerbMenu.module.css'

export function VerbMenu({ onNavigate }: { onNavigate: () => void }) {
  const { pathname } = useLocation()
  // The menu lives in the layout, so read child route params via useMatch rather than useParams.
  const currentSlug = useMatch('/verbs/:slug')?.params.slug
  const currentLetter =
    useMatch('/letters/:letter')?.params.letter ?? (currentSlug && letterForSlug(currentSlug))

  return (
    <nav>
      <Link
        to="/"
        className={classes.item}
        data-active={pathname === '/' || undefined}
        onClick={onNavigate}
      >
        <IconHome2 size={18} stroke={1.6} />
        Home
      </Link>

      <div className={classes.letters}>
        {letters.map(({ letter, first, last, verbs }) => (
          <Link
            key={letter}
            to={`/letters/${letter}`}
            className={classes.letter}
            data-active={currentLetter === letter || undefined}
            onClick={onNavigate}
          >
            <span className={classes.letterTile}>{letter.toUpperCase()}</span>
            <span className={classes.letterMeta}>
              <span className={classes.range}>
                {first} – {last}
              </span>
              <span className={classes.count}>{verbs.length} verbs</span>
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
