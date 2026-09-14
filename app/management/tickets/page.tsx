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
  if (Number.isNaN(then)) return null
  return Math.max(0, Math.floor((Date.now() - then) / 86400000))
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function kpi(label: string, value: string | number, caption: string, tone: 'slate' | 'amber' | 'green' | 'blue') {
  const accents: Record<string, string> = { slate: RED, amber: '#C97A0E', green: '#2E7D42', blue: '#2A5C8A' }
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${BORDER}`,
        borderLeft: `4px solid ${accents[tone]}`,
        borderRadius: '10px',
        padding: '16px 18px',
      }}
    >
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: MUTED, fontFamily: 'Oswald, sans-serif' }}>
        {label}
      </div>
      <div style={{ fontSize: '26px', fontWeight: 700, color: INK, margin: '6px 0 2px', fontFamily: 'Oswald, sans-serif' }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: MUTED }}>{caption}</div>
    </div>
  )
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [type, setType] = useState<'all' | 'CC' | 'ME'>('all')
  const [statusFilter, setStatusFilter] = useState<'open' | 'all'>('open')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/tickets')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load tickets')
        return r.json()
      })
      .then((d) => setTickets(d.tickets || []))
      .catch(() => setError('Could not load tickets.'))
      .finally(() => setLoading(false))
  }, [])

  const rows = useMemo(() => {
    let list = tickets
    if (statusFilter === 'open') list = list.filter((t) => !NOT_REALLY_OPEN.has(t.status))
    if (type !== 'all') list = list.filter((t) => t.jiraProject === type)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((t) =>
        [t.key, t.title, t.client, t.assignedTo, t.status].filter(Boolean).join(' ').toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => {
      const wa = PRIORITY_WEIGHT[a.priority] ?? 9
      const wb = PRIORITY_WEIGHT[b.priority] ?? 9
      if (wa !== wb) return wa - wb
      return new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime()
    })
  }, [tickets, type, statusFilter, search])

  const critCount = rows.filter((t) => t.priority === 'Red Alert' || t.priority === 'P1').length
  const agingCount = rows.filter((t) => (daysAgo(t.updatedAt) ?? 0) >= 14).length
  const ccCount = rows.filter((t) => t.jiraProject === 'CC').length
  const clientCount = new Set(rows.map((t) => t.client).filter(Boolean)).size

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: MUTED, fontFamily: 'Oswald, sans-serif' }}>
        Management center · admin only
      </div>
      <h1 style={{ fontSize: '26px', fontWeight: 700, color: INK, fontFamily: 'Oswald, sans-serif', margin: '4px 0 6px' }}>
        Tickets
      </h1>
      <p style={{ fontSize: '13px', color: MUTED,
