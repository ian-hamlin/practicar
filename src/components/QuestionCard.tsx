// src/components/QuestionCard.tsx
import { Box, Typography } from '@mui/material'
import type { Question, ProductionQuestion, RecognitionQuestion } from '../types'
import { TENSE_LABELS, PERSON_LABELS } from '../data/tenses'
import MultipleChoiceCard from './MultipleChoiceCard'
import TypedCard from './TypedCard'
import RecognitionCard from './RecognitionCard'

interface Props {
  question: Question
  questionNumber: number
  total: number
  correct: number
  incorrect: number
  onAnswer: (answer: string) => void
}

export default function QuestionCard({ question, questionNumber, total, correct, incorrect, onAnswer }: Props) {
  const tenseLabel = TENSE_LABELS[question.tense]
  const personLabel = PERSON_LABELS[question.person]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary' }}>
        <Typography variant="caption">Question {questionNumber} of {total}</Typography>
        <Typography variant="caption">✓ {correct} &nbsp; ✗ {incorrect}</Typography>
      </Box>

      {question.type === 'recognition' ? (
        <>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              Recognition · {(question as RecognitionQuestion).verb.infinitive}
            </Typography>
            <Typography variant="h3" fontWeight={700} mt={0.5}>
              {(question as RecognitionQuestion).conjugatedForm}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              What tense and person is this?
            </Typography>
          </Box>
          <RecognitionCard question={question as RecognitionQuestion} onAnswer={onAnswer} />
        </>
      ) : (
        <>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              {tenseLabel} · {personLabel}
            </Typography>
            <Typography variant="h3" fontWeight={700} mt={0.5}>
              {(question as ProductionQuestion).verb.infinitive}
            </Typography>
          </Box>
          {question.type === 'production-mc' ? (
            <MultipleChoiceCard
              options={(question as ProductionQuestion).options!}
              correctAnswer={(question as ProductionQuestion).correctAnswer}
              onAnswer={onAnswer}
            />
          ) : (
            <TypedCard
              correctAnswer={(question as ProductionQuestion).correctAnswer}
              onAnswer={onAnswer}
            />
          )}
        </>
      )}
    </Box>
  )
}
