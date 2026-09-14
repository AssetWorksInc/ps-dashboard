'use client'
import { useEffect, useMemo, useState } from 'react'

type Ticket = {
  id: string
  key: string
  jiraProject: 'CC' | 'ME'
  title: string
  status: string
  priority: string
  submittedBy: string | null
  assignedTo: string | null
  createdAt: string | null
  updatedAt: string | null
  url: string
  issueType: string | null
  client: string | null
  hasTenantMatch: boolean
  projectId: string | null
  customerVisible: boolean
}

const RED = '#A50021'
const INK = '#323E48'
const MUTED = '#6B7780'
const BORDER = '#D8DCDF'

// Lower = more severe. Legacy "Red Alert" label still shows up on a handful of
// old tickets alongside the current P1-P4 scheme.
const PRIORITY_WEIGHT: Record<string, number> = {
  'Red Alert': 0,
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
}

// Statuses that mean the ticket isn't really actionable anymore even though
// Jira still calls it "not Done" (cloned into another ticket, transferred to
// another queue). Hidden under "Open only".
const NOT_REALLY_OPEN = new Set(['Cloned', 'Transfer'])

function priorityTone(p: string): 'red' | 'amber' | 'grey' {
  if (p === 'Red Alert' || p === 'P1') return 'red'
  if (p === 'P2') return 'amber'
  return 'grey'
}

function pill(text: string, tone: 'red' | 'amber' | 'grey' | 'blue' | 'green') {
  const tones: Record<string, { bg: string; fg: string }> = {
    red: { bg: '#FCE9EC', fg: '#A50021' },
    amber: { bg: '#FDF3E4', fg: '#96690E' },
    grey: { bg: '#EEF0F1', fg: MUTED },
    blue: { bg: '#E7EEF5', fg: '#2A5C8A' },
    green: { bg: '#E7F3EA', fg: '#2E7D42' },
  }
  const t = tones[tone]
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 9px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 600,
        background: t.bg,
        color: t.fg,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  )
}

function daysAgo(iso: string | null): number | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if
