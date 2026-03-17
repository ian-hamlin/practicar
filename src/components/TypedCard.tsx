// src/components/TypedCard.tsx
import { useState, useRef, useEffect } from 'react'
import { Box, TextField, Button, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'

interface Props {
  correctAnswer: string
  onAnswer: (answer: string) => void
}

export default function TypedCard({ correctAnswer, onAnswer }: Props) {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit() {
    if (!value.trim() || submitted) return
    const correct = value.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
    setIsCorrect(correct)
    setSubmitted(true)
    setTimeout(() => onAnswer(value.trim()), 900)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        inputRef={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
        placeholder="Type the conjugation…"
        disabled={submitted}
        fullWidth
        inputProps={{ style: { textAlign: 'center', fontSize: '1.4rem' } }}
        color={submitted ? (isCorrect ? 'success' : 'error') : 'primary'}
        focused={submitted}
      />

      {submitted && !isCorrect && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
          <CheckCircleOutlineIcon fontSize="small" />
          <Typography variant="body2">Correct: <strong>{correctAnswer}</strong></Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitted || !value.trim()}
          startIcon={submitted ? (isCorrect ? <CheckCircleOutlineIcon /> : <CancelOutlinedIcon />) : undefined}
          color={submitted ? (isCorrect ? 'success' : 'error') : 'primary'}
          sx={{ flex: 1 }}
        >
          {submitted ? (isCorrect ? 'Correct!' : 'Incorrect') : 'Check'}
        </Button>
      </Box>
    </Box>
  )
}
