import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Checkbox, Divider, FormControlLabel,
  FormGroup, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material'
import type { TenseKey, Settings } from '../types'
import { ALL_TENSES, TENSE_LABELS } from '../data/tenses'

const SETTINGS_KEY = 'practicar:settings'
const LAST_SESSION_KEY = 'practicar:lastSession'

const DEFAULT_SETTINGS: Settings = { tenses: [...ALL_TENSES], sessionSize: 20 }

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch { return DEFAULT_SETTINGS }
}

function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

interface LastSession { correct: number; total: number; streak: number; date: string }

function loadLastSession(): LastSession | null {
  try {
    const raw = localStorage.getItem(LAST_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [lastSession] = useState<LastSession | null>(loadLastSession)

  useEffect(() => { saveSettings(settings) }, [settings])

  function toggleTense(tense: TenseKey) {
    setSettings(prev => ({
      ...prev,
      tenses: prev.tenses.includes(tense)
        ? prev.tenses.filter(t => t !== tense)
        : [...prev.tenses, tense],
    }))
  }

  const canStart = settings.tenses.length > 0

  return (
    <Box sx={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h4" fontWeight={700}>Practice</Typography>

      <Box>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Tenses</Typography>
        <FormGroup>
          {ALL_TENSES.map(tense => (
            <FormControlLabel
              key={tense}
              control={
                <Checkbox
                  checked={settings.tenses.includes(tense)}
                  onChange={() => toggleTense(tense)}
                />
              }
              label={TENSE_LABELS[tense]}
            />
          ))}
        </FormGroup>
      </Box>

      <Box>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Questions per session</Typography>
        <ToggleButtonGroup
          value={settings.sessionSize}
          exclusive
          onChange={(_, v) => { if (v !== null) setSettings(prev => ({ ...prev, sessionSize: v })) }}
        >
          {[10, 20, 30, 50].map(n => (
            <ToggleButton key={n} value={n}>{n}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {lastSession && (
        <>
          <Divider />
          <Typography variant="body2" color="text.secondary">
            Last session: {lastSession.correct}/{lastSession.total} correct · {lastSession.streak} streak
          </Typography>
        </>
      )}

      <Button
        variant="contained"
        size="large"
        disabled={!canStart}
        onClick={() => navigate('/practice')}
        sx={{ alignSelf: 'flex-start' }}
      >
        Start Practice
      </Button>
    </Box>
  )
}
