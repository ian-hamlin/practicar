// src/components/RecognitionCard.tsx
import { useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import type { RecognitionQuestion } from '../types'

interface Props {
  question: RecognitionQuestion
  onAnswer: (answer: string) => void
}

export default function RecognitionCard({ question, onAnswer }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  function handleSelect(index: number) {
    if (selectedIndex !== null) return
    setSelectedIndex(index)
    setTimeout(() => onAnswer(String(index)), 800)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {question.options.map((option, i) => {
        let variant: 'outlined' | 'contained' = 'outlined'
        let color: 'primary' | 'success' | 'error' = 'primary'
        let icon = null

        if (selectedIndex !== null) {
          if (i === question.correctOptionIndex) {
            variant = 'contained'; color = 'success'; icon = <CheckCircleOutlineIcon />
          } else if (i === selectedIndex && i !== question.correctOptionIndex) {
            variant = 'contained'; color = 'error'; icon = <CancelOutlinedIcon />
          }
        }

        return (
          <Button
            key={option.label}
            variant={variant}
            color={color}
            onClick={() => handleSelect(i)}
            startIcon={icon}
            sx={{ justifyContent: 'flex-start', textTransform: 'none', fontSize: '0.95rem', py: 1.5 }}
          >
            {option.label}
          </Button>
        )
      })}
      {selectedIndex === null && (
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          Identify the tense and person
        </Typography>
      )}
    </Box>
  )
}
