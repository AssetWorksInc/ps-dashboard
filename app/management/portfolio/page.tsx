'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type ProjectRow = {
  id: string
  name: string
  tenantId: string
  client: string
  pid: string | null
  engagementStatus: string
  epic: string | null
  confluenceUrl: string | null
  pmComment: string | null
  nextMilestone: string | null
  nextMilestoneDate: string | null
  primeResource: string | null
  secondaryPrimeResource: string | null
  pctComplete: number | null
  contractSignedDate: string | null
  lastTimeEntryDate: string | null
  servicesBacklog: number | null
  servicesRevenue: number | null
  openairUrl: string | null
  signal: { level: 'green' | 'amber' | 'red'; score: number; label: string; reasons: string[] }
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; desc: string }> = {
  GREEN: { label: 'Full throttle', color: '#2E7D32', bg: '#E4F0E5', border: '#BFDCC1', desc: 'Actively billing, engaged, moving at pace' },
  YELLOW: { label: 'Slow burn', color: '#8A6100', bg: '#FDF3DC', border: '#F0D89B', desc: 'Engaged and billing, slower than we want' },
  RED: { label: 'Stalled', color: '#A50021', bg: '#F7E2E6', border: '#E6BCC5', desc: 'Activities defined but on hold' },
  BLUE: { label: 'Go-get', color: '#00538C', bg: '#E2EDF4', border: '#B9D3E4', desc: 'Needs customer approval to proceed' },
  GREY: { label: 'Disengaged', color: '#6B7780', bg: '#ECEEF0', border: '#D3D8DC', desc: 'Being ghosted, no recent communication' },
  OPEN: { label: 'Unclassified', color: '#7B3FA0', bg: '#F3E8F8', border: '#DFC3EC', desc: 'New, not triaged yet' },
}
const STATUS_ORDER = ['GREEN', 'YELLOW', 'RED', 'BLUE', 'GREY', 'OPEN']

const RED = '#A50021'
const INK = '#323E48'
const MUTED = '#6B7780'
const BORDER = '#D8DCDF'

function money(n: number | null | undefined, compact?: boolean): string {
  const v = n || 0
  if (compact) {
    if (Math.abs(v) >= 1_000_000) return '$' + (v / 1_000_000).toFixed(2) + 'M'
    if (Math.abs(v) >= 1_000) return '$' + (v / 1_000).toFixed(0) + 'K'
  }
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function shortDate(d: string | null): string {
  if (!d) return ''
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
}

function daysAgo(d: string | null): number | null {
  if (!d) return null
  return Math.round((Date.now() - new Date(d + 'T12:00:00').getTime()) / 86_400_000)
}

export default function PortfolioPage() {
  const [projects, setProjects] = useState<ProjectRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [prime, setPrime] = useState('')
  const [statusFilter, setStatusFilter] = useState<Record<string, boolean>>({})
  const [backlogOnly, setBacklogOnly] = useState(true)
  const [staleOnly, setStaleOnly] = useState(false)
  const [noEpicOnly, setNoEpicOnly] = useState(false)
  const [sortKey, setSortKey] = useState<'name' | 'backlog' | 'signal' | 'signed' | 'lastEntry' | 'pct'>('backlog')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/admin/portfolio')
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          setError('This page is for AssetWorks PM and admin accounts only.')
          return
        }
        if (!r.ok) {
          setError('Could not load the portfolio.')
          return
        }
        const data = await r.json()
        setProjects(data.projects)
      })
      .catch(() => setError('Could not load the portfolio.'))
  }, [])

  async function saveField(id: string, field: string, value: string) {
    setSaving((s) => ({ ...s, [id]: true }))
    setProjects((prev) => prev && prev.map((p) => (p.id === id ? { ...p, [fieldToKey(field)]: value } as ProjectRow : p)))
    try {
      await fetch('/api/admin/portfolio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field, value }),
      })
    } finally {
      setSaving((s) => ({ ...s, [id]: false }))
    }
  }

  function fieldToKey(field: string): keyof ProjectRow {
    const map: Record<string, keyof ProjectRow> = {
      engagement_status: 'engagementStatus',
      epic: 'epic',
      confluence_url: 'confluenceUrl',
      pm_comment: 'pmComment',
      next_milestone: 'nextMilestone',
      next_milestone_date: 'nextMilestoneDate',
    }
    return map[field]
  }

  const totals = useMemo(() => {
    const all = projects || []
    const sum = (list: ProjectRow[]) => list.reduce((n, p) => n + (p.servicesBacklog || 0), 0)
    const backlog = sum(all)
    const withBacklog = all.filter((p) => (p.servicesBacklog || 0) > 0)
    const byStatus: Record<string, { count: number; backlog: number }> = {}
    STATUS_ORDER.forEach((k) => (byStatus[k] = { count: 0, backlog: 0 }))
    all.forEach((p) => {
      const k = STATUS_ORDER.includes(p.engagementStatus) ? p.engagementStatus : 'OPEN'
      byStatus[k].count += 1
      byStatus[k].backlog += p.servicesBacklog || 0
    })
    const stale = all.filter((p) => {
      const d = daysAgo(p.lastTimeEntryDate)
      return (p.servicesBacklog || 0) > 0 && (d === null || d > 90)
    })
    const triage = all.filter((p) => p.engagementStatus === 'OPEN')
    const byClient: Record<string, number> = {}
    all.forEach((p) => {
      byClient[p.client] = (byClient[p.client] || 0) + (p.servicesBacklog || 0)
    })
    const clientRank = Object.entries(byClient)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
    return {
      count: all.length,
      backlog,
      withBacklogCount: withBacklog.length,
      byStatus,
      stale,
      triage: triage.sort((a, b) => (b.servicesBacklog || 0) - (a.servicesBacklog || 0)),
      clientRank,
      maxClientBacklog: clientRank.length ? clientRank[0][1] : 0,
    }
  }, [projects])

  const primes = useMemo(() => {
    const set = new Set<string>()
    ;(projects || []).forEach((p) => p.primeResource && set.add(p.primeResource))
    return Array.from(set).sort()
  }, [projects])

  const filteredSorted = useMemo(() => {
    const anyStatus = Object.keys(statusFilter).some((k) => statusFilter[k])
    let list = (projects || []).filter((p) => {
      if (anyStatus && !statusFilter[p.engagementStatus]) return false
      if (prime && p.primeResource !== prime) return false
      if (backlogOnly && !((p.servicesBacklog || 0) > 0)) return false
      if (staleOnly) {
        const d = daysAgo(p.lastTimeEntryDate)
        const isStale = (p.servicesBacklog || 0) > 0 && (d === null || d > 90)
        if (!isStale) return false
      }
      if (noEpicOnly && p.epic) return false
      if (q.trim()) {
        const hay = [p.name, p.client, p.pid, p.epic, p.pmComment, p.primeResource, p.secondaryPrimeResource]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q.trim().toLowerCase())) return false
      }
      return true
    })
    const dir = sortDir === 'asc' ? 1 : -1
    function compare(av: string | number, bv: string | number): number {
      if (typeof av === 'number' && typeof bv === 'number') return av - bv
      return String(av).localeCompare(String(bv))
    }
    list = list.slice().sort((a, b) => {
      let av: string | number = 0
      let bv: string | number = 0
      if (sortKey === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase() }
      else if (sortKey === 'backlog') { av = a.servicesBacklog || 0; bv = b.servicesBacklog || 0 }
      else if (sortKey === 'signal') { av = a.signal.score; bv = b.signal.score }
      else if (sortKey === 'signed') { av = a.contractSignedDate || ''; bv = b.contractSignedDate || '' }
      else if (sortKey === 'lastEntry') { av = a.lastTimeEntryDate || ''; bv = b.lastTimeEntryDate || '' }
      else if (sortKey === 'pct') { av = a.pctComplete ?? -1; bv = b.pctComplete ?? -1 }
      return compare(av, bv) * dir
    })
    return list
  }, [projects, q, prime, statusFilter, backlogOnly, staleOnly, noEpicOnly, sortKey, sortDir])

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function exportCsv() {
    const head = ['PID', 'Project', 'Client', 'Engagement status', 'Signal', 'Signal score', 'Epic',
      'Percent complete', 'Services backlog', 'Revenue ITD', 'Signed', 'Last entry', 'Prime', 'PM comment']
    const q2 = (s: any) => '"' + String(s ?? '').replace(/"/g, '""') + '"'
    const lines = [head.join(',')].concat(
      filteredSorted.map((p) =>
        [p.pid, q2(p.name), q2(p.client), STATUS_META[p.engagementStatus]?.label || p.engagementStatus,
          p.signal.label, p.signal.score, p.epic, p.pctComplete ?? '', p.servicesBacklog ?? '',
          p.servicesRevenue ?? '', p.contractSignedDate, p.lastTimeEntryDate, q2(p.primeResource), q2(p.pmComment)].join(',')
      )
    )
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'ps-portfolio-' + new Date().toISOString().slice(0, 10) + '.csv'
    a.click()
  }

  if (error) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Roboto, sans-serif', color: INK }}>
        <p>{error}</p>
        <Link href="/" style={{ color: '#00538C', fontSize: '13px' }}>← Back to Dashboard</Link>
      </div>
    )
  }

  if (!projects) {
    return <div style={{ padding: '40px', fontFamily: 'Roboto, sans-serif', color: MUTED }}>Loading portfolio…</div>
  }

  const kpi = (label: string, value: string, note: string, key: string) => (
    <div key={key} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderLeft: `4px solid ${RED}`, borderRadius: '8px', padding: '14px 16px' }}>
      <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '.6px', fontSize: '10px', color: MUTED }}>{label}</div>
      <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '22px', color: INK }}>{value}</div>
      <div style={{ fontSize: '11px', color: MUTED }}>{note}</div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', padding: '28px', maxWidth: '1500px', margin: '0 auto' }}>
      <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '10.5px', color: RED, marginBottom: '2px' }}>
        Replaces the Confluence EDU dashboard · admin / PM only
      </div>
      <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', fontWeight: 600, color: INK, margin: '0 0 4px' }}>Portfolio</h1>
      <p style={{ fontSize: '12px', color: MUTED, marginTop: 0, marginBottom: '16px' }}>
        {totals.count} projects · row total {money(totals.backlog)}
      </p>
      <div style={{ borderLeft: `3px solid ${RED}`, background: '#FBEFF1', padding: '8px 12px', borderRadius: '4px', fontSize: '11.5px', color: '#3a4650', marginBottom: '18px' }}>
        Engagement status is set by a person and stays with the project through every NetSuite import. Delivery signal is calculated from the data and shown beside it — the two are never merged.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: '12px', marginBottom: '20px' }}>
        {kpi('Services backlog', money(totals.backlog, true), `${totals.count} projects, ${totals.withBacklogCount} with backlog remaining`, 'k1')}
        {kpi('Full throttle', money(totals.byStatus.GREEN.backlog, true), totals.backlog ? Math.round((totals.byStatus.GREEN.backlog / totals.backlog) * 100) + '% of backlog' : '0%', 'k2')}
        {kpi('Stalled or disengaged', money(totals.byStatus.RED.backlog + totals.byStatus.GREY.backlog, true), totals.backlog ? Math.round(((totals.byStatus.RED.backlog + totals.byStatus.GREY.backlog) / totals.backlog) * 100) + '% needs a push' : '0%', 'k3')}
        {kpi('Gone quiet 90+ days', String(totals.stale.length), money(totals.stale.reduce((n, p) => n + (p.servicesBacklog || 0), 0), true) + ' with no recent entry', 'k4')}
        {kpi('Needs triage', String(totals.triage.length), totals.triage.length ? money(totals.byStatus.OPEN.backlog, true) + ' unclassified' : 'Every project has a status', 'k5')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '18px' }}>
        <div>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px 18px', marginBottom: '14px' }}>
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13.5px', margin: '0 0 10px' }}>Backlog by engagement status</h2>
            <div style={{ display: 'flex', height: '32px', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${BORDER}` }}>
              {STATUS_ORDER.map((k) => {
                const pct = totals.backlog ? (totals.byStatus[k].backlog / totals.backlog) * 100 : 0
                if (pct <= 0) return null
                return (
                  <div
                    key={k}
                    onClick={() => setStatusFilter((s) => ({ ...s, [k]: !s[k] }))}
                    title={STATUS_META[k].label}
                    style={{
                      width: pct + '%', background: STATUS_META[k].color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontFamily: 'Oswald, sans-serif', fontSize: '10.5px', cursor: 'pointer',
                      outline: statusFilter[k] ? `2px solid ${INK}` : 'none', outlineOffset: '-2px',
                    }}
                  >
                    {pct > 6 ? Math.round(pct) + '%' : ''}
                  </div>
                )
              })}
                          </div>
            <div style={{ display: 'grid', gap: '1px', marginTop: '10px' }}>
              {STATUS_ORDER.map((k) => (
                <div
                  key={k}
                  onClick={() => setStatusFilter((s) => ({ ...s, [k]: !s[k] }))}
                  style={{ display: 'grid', gridTemplateColumns: '12px 1fr auto auto', gap: '10px', alignItems: 'center', padding: '5px 6px', borderRadius: '6px', cursor: 'pointer', background: statusFilter[k] ? '#EAECEE' : 'transparent' }}
                >
                  <span style={{ width: '11px', height: '11px', borderRadius: '3px', background: STATUS_META[k].color, display: 'inline-block' }} />
                  <span>
                    <b style={{ display: 'block', fontSize: '12px' }}>{STATUS_META[k].label}</b>
                    <i style={{ fontSize: '10.5px', color: MUTED, fontStyle: 'normal' }}>{STATUS_META[k].desc}</i>
                  </span>
                  <span style={{ fontSize: '11px', color: MUTED }}>{totals.byStatus[k].count} projects</span>
                  <span style={{ fontSize: '11px', color: MUTED }}>{money(totals.byStatus[k].backlog)}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: MUTED, marginTop: '8px' }}>Click a status to filter the grid below.</p>
          </div>

          {totals.triage.length > 0 && (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px 18px' }}>
              <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13.5px', margin: '0 0 10px' }}>Needs triage: {totals.triage.length} projects</h2>
              <p style={{ fontSize: '11px', color: MUTED, marginTop: '-6px', marginBottom: '10px' }}>Came in from NetSuite without an engagement status. Set one so the rollup is complete.</p>
              {totals.triage.slice(0, 12).map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setExpanded((e) => ({ ...e, [p.id]: true })); setStatusFilter({}); document.getElementById('row-' + p.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}
                  style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', border: '1px solid #DFC3EC', background: '#F9F3FC', borderRadius: '999px', padding: '4px 11px', margin: '0 5px 5px 0', fontSize: '11px', cursor: 'pointer' }}
                >
                  <b style={{ fontFamily: 'Oswald, sans-serif' }}>{p.name.split(' ')[0]}</b>
                  <span style={{ color: MUTED }}>{money(p.servicesBacklog)}</span>
                </button>
              ))}
              {totals.triage.length > 12 && <span style={{ fontSize: '11px', color: MUTED }}>and {totals.triage.length - 12} more</span>}
            </div>
          )}
        </div>
        <div>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px 18px' }}>
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13.5px', margin: '0 0 10px' }}>Backlog concentration by client</h2>
            {totals.clientRank.map(([name, val]) => (
              <div key={name} style={{ marginBottom: '8px', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                  <span style={{ color: MUTED }}>{money(val)}</span>
                </div>
                <div style={{ height: '5px', background: '#EAECEE', borderRadius: '3px', overflow: 'hidden', marginTop: '3px' }}>
                  <div style={{ height: '100%', background: RED, width: (totals.maxClientBacklog ? (val / totals.maxClientBacklog) * 100 : 0) + '%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
        <input
          type="search"
          placeholder="Filter by project, client, PID, epic or comment"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ fontSize: '12px', padding: '6px 9px', border: `1px solid ${BORDER}`, borderRadius: '6px', minWidth: '280px' }}
        />
        <select value={prime} onChange={(e) => setPrime(e.target.value)} style={{ fontSize: '12px', padding: '6px 9px', border: `1px solid ${BORDER}`, borderRadius: '6px' }}>
          <option value="">All prime resources</option>
          {primes.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <label style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input type="checkbox" checked={backlogOnly} onChange={(e) => setBacklogOnly(e.target.checked)} /> Backlog remaining
        </label>
        <label style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input type="checkbox" checked={staleOnly} onChange={(e) => setStaleOnly(e.target.checked)} /> Quiet 90+ days
        </label>
        <label style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input type="checkbox" checked={noEpicOnly} onChange={(e) => setNoEpicOnly(e.target.checked)} /> No epic linked
        </label>
        <button onClick={exportCsv} style={{ fontFamily: 'Oswald, sans-serif', fontSize: '11px', fontWeight: 700, background: '#fff', color: RED, border: `1px solid ${RED}`, borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}>
          Export CSV
        </button>
        <span style={{ fontSize: '11px', color: MUTED }}>{filteredSorted.length} of {totals.count}</span>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '8px 0 16px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
          <thead>
            <tr>
              {[
                { key: 'name', label: 'Project' },
                { key: null, label: 'PID' },
                { key: null, label: 'Client' },
                { key: null, label: 'Status' },
                { key: 'signal', label: 'Signal' },
                { key: null, label: 'Epic' },
                { key: 'pct', label: '% cmpl' },
                { key: 'backlog', label: 'Backlog' },
                { key: null, label: 'Revenue ITD' },
                { key: 'signed', label: 'Signed' },
                { key: 'lastEntry', label: 'Last entry' },
                { key: null, label: 'Prime' },
                { key: null, label: '' },
              ].map((c, i) => (
                <th
                  key={i}
                  onClick={c.key ? () => toggleSort(c.key as any) : undefined}
                  style={{ background: INK, color: '#fff', fontFamily: 'Oswald, sans-serif', fontWeight: 500, textAlign: 'left', padding: '7px 9px', whiteSpace: 'nowrap', cursor: c.key ? 'pointer' : 'default' }}
                >
                  {c.label}{sortKey === c.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredSorted.length === 0 && (
              <tr><td colSpan={13} style={{ padding: '26px', textAlign: 'center', color: MUTED }}>Nothing matches those filters.</td></tr>
            )}
            {filteredSorted.map((p) => {
              const meta = STATUS_META[p.engagementStatus] || STATUS_META.OPEN
              const sigColor = p.signal.level === 'green' ? { bg: '#E4F0E5', c: '#2E7D32' } : p.signal.level === 'amber' ? { bg: '#FDF3DC', c: '#8A6100' } : { bg: '#F7E2E6', c: RED }
              const d = daysAgo(p.lastTimeEntryDate)
              const isRed = p.signal.level === 'red'
              const isExpanded = !!expanded[p.id]
              return (
                <Fragment key={p.id}>
                  <tr id={'row-' + p.id} style={{ background: isRed ? '#FDF2F4' : undefined }}>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700, color: INK }}>{p.name}</div>
                      {p.pmComment && <div style={{ fontSize: '10.5px', color: '#3a4650' }}><b>PM</b> {p.pmComment.slice(0, 100)}{p.pmComment.length > 100 ? '…' : ''}</div>}
                      {p.nextMilestone && <div style={{ fontSize: '10.5px', color: MUTED }}><b>NEXT</b> {p.nextMilestone}{p.nextMilestoneDate ? ' · ' + shortDate(p.nextMilestoneDate) : ''}</div>}
                    </td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>{p.pid || ''}</td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>{p.client}</td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>
                      <select
                        value={p.engagementStatus}
                        onChange={(e) => saveField(p.id, 'engagement_status', e.target.value)}
                        style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', textTransform: 'uppercase', borderRadius: '999px', padding: '2px 7px', border: `1px solid ${meta.border}`, background: meta.bg, color: meta.color, cursor: 'pointer' }}
                      >
                        {STATUS_ORDER.map((k) => <option key={k} value={k}>{STATUS_META[k].label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>
                      <span style={{ display: 'inline-block', fontFamily: 'Oswald, sans-serif', fontSize: '10px', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '999px', background: sigColor.bg, color: sigColor.c }}>
                        {p.signal.label} {p.signal.score}
                      </span>
                    </td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>
                      {p.epic
                        ? <a href={`https://goassetworks.atlassian.net/browse/${p.epic}`} target="_blank" rel="noopener noreferrer" style={{ color: '#00538C' }}>{p.epic}</a>
                        : <span style={{ color: MUTED, fontSize: '11px' }}>not linked</span>}
                    </td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>{p.pctComplete === null ? <span style={{ color: MUTED }}>n/a</span> : p.pctComplete.toFixed(2)}</td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right', color: (p.servicesBacklog || 0) < 0 ? RED : undefined }}>{money(p.servicesBacklog)}</td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right', color: MUTED }}>{money(p.servicesRevenue)}</td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>{p.contractSignedDate ? shortDate(p.contractSignedDate) : <span style={{ color: MUTED }}>not set</span>}</td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>
                      {p.lastTimeEntryDate
                        ? <>{shortDate(p.lastTimeEntryDate)}<div style={{ fontSize: '10px', color: MUTED }}>{d}d ago</div></>
                        : <span style={{ background: '#F7E2E6', color: RED, padding: '1px 6px', borderRadius: '8px', fontSize: '10px' }}>never</span>}
                    </td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>{p.primeResource || ''}</td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>
                      <button
                        onClick={() => setExpanded((e) => ({ ...e, [p.id]: !e[p.id] }))}
                        style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10.5px', fontWeight: 700, border: `1px solid ${RED}`, background: isExpanded ? RED : '#fff', color: isExpanded ? '#fff' : RED, borderRadius: '6px', padding: '3px 10px', cursor: 'pointer' }}
                      >
                        {isExpanded ? 'Hide' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr style={{ background: '#FAFBFC' }}>
                      <td colSpan={13} style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                          <EditField label="Jira epic" value={p.epic} onSave={(v) => saveField(p.id, 'epic', v)} placeholder="PS-1180" />
                          <EditField label="Confluence link" value={p.confluenceUrl} onSave={(v) => saveField(p.id, 'confluence_url', v)} placeholder="https://goassetworks.atlassian.net/wiki/..." />
                          <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.6px', color: MUTED, fontFamily: 'Oswald, sans-serif', marginBottom: '3px' }}>OpenAir project</label>
                            {p.openairUrl
                              ? <a href={p.openairUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#00538C' }}>{p.openairUrl}</a>
                              : <span style={{ fontSize: '12px', color: MUTED }}>No OpenAir PID on file</span>}
                          </div>
                          <EditField label="Next milestone" value={p.nextMilestone} onSave={(v) => saveField(p.id, 'next_milestone', v)} placeholder="UAT sign off" />
                          <EditField label="Milestone date" value={p.nextMilestoneDate} onSave={(v) => saveField(p.id, 'next_milestone_date', v)} type="date" />
                          <div style={{ gridColumn: '1/-1' }}>
                            <EditField label="PM comment" value={p.pmComment} onSave={(v) => saveField(p.id, 'pm_comment', v)} textarea placeholder="What is holding this up, what we are doing about it, and who owns the next step" />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '10px', fontSize: '10.5px', color: MUTED }}>
                          <span>Signal {p.signal.score}: {p.signal.reasons.join('. ')}</span>
                          {saving[p.id] && <span>Saving…</span>}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EditField({ label, value, onSave, placeholder, type, textarea }: { label: string; value: string | null; onSave: (v: string) => void; placeholder?: string; type?: string; textarea?: boolean }) {
  const [v, setV] = useState(value || '')
  useEffect(() => setV(value || ''), [value])
  const style = { width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #D8DCDF', borderRadius: '6px', fontFamily: 'inherit' } as const
  return (
    <div>
      <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.6px', color: '#6B7780', fontFamily: 'Oswald, sans-serif', marginBottom: '3px' }}>{label}</label>
      {textarea ? (
        <textarea value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onBlur={() => onSave(v)} style={{ ...style, minHeight: '56px', resize: 'vertical' }} />
      ) : (
        <input value={v} placeholder={placeholder} type={type || 'text'} onChange={(e) => setV(e.target.value)} onBlur={() => onSave(v)} style={style} />
      )}
    </div>
  )
}
