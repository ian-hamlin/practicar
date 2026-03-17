import { Box, Button, Typography, Divider, Chip } from '@mui/material'
import type { SessionStats } from '../types'
import { TENSE_LABELS, PERSON_LABELS } from '../data/tenses'

interface Props {
  stats: SessionStats
  onBack: () => void
}

export default function SessionSummary({ stats, onBack }: Props) {
  const answered = stats.correct + stats.incorrect
  const pct = answered > 0 ? Math.round((stats.correct / answered) * 100) : 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 520, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700}>Session Complete</Typography>

      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" color="success.main" fontWeight={700}>{stats.correct}</Typography>
          <Typography variant="caption" color="text.secondary">Correct</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" color="error.main" fontWeight={700}>{stats.incorrect}</Typography>
          <Typography variant="caption" color="text.secondary">Incorrect</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" fontWeight={700}>{pct}%</Typography>
          <Typography variant="caption" color="text.secondary">Accuracy</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" color="primary.main" fontWeight={700}>{stats.bestStreak}</Typography>
          <Typography variant="caption" color="text.secondary">Best streak</Typography>
        </Box>
        {stats.skipped > 0 && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color="text.secondary" fontWeight={700}>{stats.skipped}</Typography>
            <Typography variant="caption" color="text.secondary">Skipped</Typography>
          </Box>
        )}
      </Box>

      {stats.hardest.length > 0 && (
        <>
          <Divider />
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Needs work
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {stats.hardest.map(h => (
                <Chip
                  key={`${h.verb}|${h.tense}|${h.person}`}
                  label={`${h.verb} · ${TENSE_LABELS[h.tense]} · ${PERSON_LABELS[h.person]}`}
                  variant="outlined"
                  color="error"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        </>
      )}

      <Button variant="contained" size="large" onClick={onBack}>
        Back to Dashboard
      </Button>
    </Box>
  )
}
