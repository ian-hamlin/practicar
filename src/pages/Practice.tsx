// src/pages/Practice.tsx
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, LinearProgress, Typography } from '@mui/material'
import type { TenseKey, Settings } from '../types'
import { ALL_TENSES, TENSE_LABELS, PERSON_LABELS } from '../data/tenses'
import { BUNDLED_VERBS } from '../data/verbs'
import { useDrill } from '../hooks/useDrill'
import QuestionCard from '../components/QuestionCard'
import SessionSummary from '../components/SessionSummary'

const SETTINGS_KEY = 'practicar:settings'
const CUSTOM_VERBS_KEY = 'practicar:customVerbs'
const LAST_SESSION_KEY = 'practicar:lastSession'

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { tenses: [...ALL_TENSES], sessionSize: 20, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { tenses: [...ALL_TENSES], sessionSize: 20 }
}

export default function Practice() {
  const navigate = useNavigate()

  const settings = useMemo(loadSettings, [])
  const customVerbs = useMemo(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_VERBS_KEY)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }, [])

  const allVerbs = useMemo(
    () => [...BUNDLED_VERBS, ...customVerbs],
    [customVerbs]
  )

  const { currentQuestion, questionNumber, submitAnswer, skip, endSession, sessionComplete, sessionStats } =
    useDrill(
      settings.tenses as TenseKey[],
      settings.sessionSize,
      allVerbs,
      (t: TenseKey) => TENSE_LABELS[t],
      (p) => PERSON_LABELS[p]
    )

  function handleBack() {
    if (sessionComplete) {
      localStorage.setItem(
        LAST_SESSION_KEY,
        JSON.stringify({ correct: sessionStats.correct, total: sessionStats.total, streak: sessionStats.bestStreak, date: new Date().toISOString() })
      )
    }
    navigate('/')
  }

  if (sessionComplete) {
    return (
      <Box sx={{ maxWidth: 600, py: 2 }}>
        <SessionSummary stats={sessionStats} onBack={handleBack} />
      </Box>
    )
  }

  if (!currentQuestion) {
    return (
      <Box>
        <Typography>No questions available. Check your tense selection on the Dashboard.</Typography>
        <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
      </Box>
    )
  }

  const progress = ((questionNumber - 1) / settings.sessionSize) * 100

  return (
    <Box sx={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <LinearProgress variant="determinate" value={progress} sx={{ flex: 1, mr: 2, height: 6, borderRadius: 3 }} />
        <Button size="small" color="inherit" onClick={endSession}>End Session</Button>
      </Box>

      <QuestionCard
        question={currentQuestion}
        questionNumber={questionNumber}
        total={settings.sessionSize}
        correct={sessionStats.correct}
        incorrect={sessionStats.incorrect}
        onAnswer={submitAnswer}
      />

      <Button variant="text" color="inherit" onClick={skip} sx={{ alignSelf: 'flex-end' }}>
        Skip
      </Button>
    </Box>
  )
}
