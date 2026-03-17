// src/pages/Verbs.tsx
import { useState } from 'react'
import {
  Box, Button, Collapse, Divider, IconButton, TextField,
  Typography, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { VerbEntry, TenseKey, PersonKey, TenseForms } from '../types'
import { ALL_TENSES, TENSE_LABELS, ALL_PERSONS, PERSON_LABELS } from '../data/tenses'

const STORAGE_KEY = 'practicar:customVerbs'

function loadCustomVerbs(): VerbEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCustomVerbs(verbs: VerbEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(verbs))
}

export default function Verbs() {
  const [verbs, setVerbs] = useState<VerbEntry[]>(loadCustomVerbs)
  const [showForm, setShowForm] = useState(false)
  const [infinitive, setInfinitive] = useState('')
  const [forms, setForms] = useState<Partial<Record<TenseKey, Partial<Record<PersonKey, string>>>>>({})

  function setForm(tense: TenseKey, person: PersonKey, value: string) {
    setForms(prev => ({
      ...prev,
      [tense]: { ...prev[tense], [person]: value },
    }))
  }

  function handleAdd() {
    if (!infinitive.trim()) return
    const tenses: VerbEntry['tenses'] = {}
    for (const tense of ALL_TENSES) {
      const tenseData = forms[tense]
      if (!tenseData) continue
      const filled: Partial<TenseForms> = {}
      for (const person of ALL_PERSONS) {
        if (tenseData[person]?.trim()) filled[person] = tenseData[person]!.trim()
      }
      if (Object.keys(filled).length > 0) {
        tenses[tense] = filled as unknown as TenseForms
      }
    }
    const entry: VerbEntry = { infinitive: infinitive.trim(), tenses, isCustom: true }
    const updated = [...verbs, entry]
    setVerbs(updated)
    saveCustomVerbs(updated)
    setInfinitive('')
    setForms({})
    setShowForm(false)
  }

  function handleDelete(index: number) {
    const updated = verbs.filter((_, i) => i !== index)
    setVerbs(updated)
    saveCustomVerbs(updated)
  }

  return (
    <Box sx={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={700}>Custom Verbs</Typography>
        <Button variant="contained" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : 'Add Verb'}
        </Button>
      </Box>

      <Collapse in={showForm}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <TextField
            label="Infinitive"
            value={infinitive}
            onChange={e => setInfinitive(e.target.value)}
            placeholder="e.g. trabajar"
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            Fill in only the tenses you want to drill. All fields are optional.
          </Typography>
          {ALL_TENSES.map(tense => (
            <Accordion key={tense} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body2">{TENSE_LABELS[tense]}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  {ALL_PERSONS.map(person => (
                    <TextField
                      key={person}
                      label={PERSON_LABELS[person]}
                      size="small"
                      value={forms[tense]?.[person] ?? ''}
                      onChange={e => setForm(tense, person, e.target.value)}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
          <Button variant="contained" onClick={handleAdd} disabled={!infinitive.trim()}>
            Save Verb
          </Button>
        </Box>
      </Collapse>

      <Divider />

      {verbs.length === 0 ? (
        <Typography color="text.secondary">No custom verbs yet.</Typography>
      ) : (
        verbs.map((verb, i) => (
          <Box key={verb.infinitive} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography fontWeight={600}>{verb.infinitive}</Typography>
              <Typography variant="caption" color="text.secondary">
                {Object.keys(verb.tenses).map(t => TENSE_LABELS[t as TenseKey]).join(', ')}
              </Typography>
            </Box>
            <IconButton onClick={() => handleDelete(i)} color="error" size="small">
              <DeleteIcon />
            </IconButton>
          </Box>
        ))
      )}
    </Box>
  )
}
