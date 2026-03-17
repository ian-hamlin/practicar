// src/components/MultipleChoiceCard.tsx
import { useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'

interface Props {
  options: string[]
  correctAnswer: string
  onAnswer: (answer: string) => void
}

export default function MultipleChoiceCard({ options, correctAnswer, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  function handleSelect(option: string) {
    if (selected !== null) return // already answered
    setSelected(option)
    setTimeout(() => onAnswer(option), 800)
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
      {options.map(option => {
        let variant: 'outlined' | 'contained' = 'outlined'
        let color: 'primary' | 'success' | 'error' = 'primary'
        let icon = null

        if (selected !== null) {
          if (option === correctAnswer) {
            variant = 'contained'
            color = 'success'
            icon = <CheckCircleOutlineIcon />
          } else if (option === selected && option !== correctAnswer) {
            variant = 'contained'
            color = 'error'
            icon = <CancelOutlinedIcon />
          }
        }

        return (
          <Button
            key={option}
            variant={variant}
            color={color}
            onClick={() => handleSelect(option)}
            startIcon={icon}
            sx={{ py: 2, fontSize: '1.1rem', textTransform: 'none' }}
          >
            {option}
          </Button>
        )
      })}
      {selected === null && (
        <Typography variant="caption" color="text.secondary" sx={{ gridColumn: '1/-1', textAlign: 'center' }}>
          Select an answer
        </Typography>
      )}
    </Box>
  )
}
