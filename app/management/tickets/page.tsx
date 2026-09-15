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

const PRIORITY_WEIGHT: Record<string, number> = {
  'Red Alert': 0,
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
}

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
      <p style={{ fontSize: '13px', color: MUTED, maxWidth: '720px', marginBottom: '4px' }}>
        Customer Care and Maintenance Engineering tickets from Jira, most severe and longest-neglected first.
      </p>
      <p style={{ fontSize: '11px', color: MUTED, marginBottom: '20px', fontStyle: 'italic' }}>
        Snapshot pulled from Jira — not a live sync yet. A server-side Atlassian API token is needed before this
        refreshes automatically; see the dev changelog. Client names are matched to your tenant list where confident —
        some show the raw Jira organization name instead, and some show no client at all.
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          style={{ padding: '8px 12px', fontSize: '12px', border: `1px solid ${BORDER}`, borderRadius: '8px', color: INK }}
        >
          <option value="all">All types</option>
          <option value="CC">Customer Care</option>
          <option value="ME">Maintenance Eng.</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{ padding: '8px 12px', fontSize: '12px', border: `1px solid ${BORDER}`, borderRadius: '8px', color: INK }}
        >
          <option value="open">Open only</option>
          <option value="all">All statuses</option>
        </select>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by key, summary, client, or assignee"
          style={{ flex: 1, minWidth: '220px', padding: '8px 12px', fontSize: '12px', border: `1px solid ${BORDER}`, borderRadius: '8px', color: INK }}
        />
      </div>

      {loading && <div style={{ color: MUTED, fontSize: '13px' }}>Loading tickets…</div>}
      {error && <div style={{ color: RED, fontSize: '13px' }}>{error}</div>}

      {!loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
            {kpi('In this view', rows.length, `Across ${clientCount} client${clientCount === 1 ? '' : 's'}`, 'slate')}
            {kpi('Critical', critCount, critCount ? 'Needs a decision today' : 'None open', critCount ? 'amber' : 'green')}
            {kpi('Older than 14 days', agingCount, 'Aging tickets erode customer health', agingCount ? 'amber' : 'green')}
            {kpi('Customer care', ccCount, 'CC queue', 'blue')}
          </div>

          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#FAFBFC', borderBottom: `1px solid ${BORDER}` }}>
                    {['Key', 'Type', 'Summary', 'Status', 'Priority', 'Assignee', 'Age', 'Updated'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '10px 14px',
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          color: MUTED,
                          fontFamily: 'Oswald, sans-serif',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '24px 14px', textAlign: 'center', color: MUTED }}>
                        No tickets match.
                      </td>
                    </tr>
                  )}
                  {rows.map((t) => {
                    const age = daysAgo(t.updatedAt)
                    const isCritical = t.priority === 'Red Alert' || t.priority === 'P1'
                    return (
                      <tr
                        key={t.id}
                        style={{
                          borderBottom: `1px solid ${BORDER}`,
                          background: isCritical ? '#FEF8F8' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <a href={t.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2A5C8A', textDecoration: 'none', fontWeight: 600 }}>
                            {t.key}
                          </a>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {pill(t.jiraProject === 'CC' ? 'CC' : 'ME', t.jiraProject === 'CC' ? 'blue' : 'grey')}
                        </td>
                        <td style={{ padding: '10px 14px', maxWidth: '360px' }}>
                          <div style={{ color: INK }}>{t.title}</div>
                          <div style={{ fontSize: '11px', color: MUTED, marginTop: '2px' }}>
                            {t.client || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', color: INK, whiteSpace: 'nowrap' }}>{t.status}</td>
                        <td style={{ padding: '10px 14px' }}>{pill(t.priority, priorityTone(t.priority))}</td>
                        <td style={{ padding: '10px 14px', color: INK, whiteSpace: 'nowrap' }}>{t.assignedTo || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {age !== null && age >= 14 ? pill(`${age}d`, 'red') : <span style={{ color: MUTED }}>{age ?? '—'}d</span>}
                        </td>
                        <td style={{ padding: '10px 14px', color: MUTED, whiteSpace: 'nowrap' }}>{fmtDate(t.updatedAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
