'use client'

import { useEffect, useMemo, useState } from 'react'
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

function daysAgo(d: string | null): number | null {
  if (!d) return null
  return Math.round((Date.now() - new Date(d + 'T12:00:00').getTime()) / 86_400_000)
}

export default function ManagementDashboardPage() {
  const [projects, setProjects] = useState<ProjectRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/portfolio')
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          setError('This page is for AssetWorks PM and admin accounts only.')
          return
        }
        if (!r.ok) {
          setError('Could not load the dashboard.')
          return
        }
        const data = await r.json()
        setProjects(data.projects)
      })
      .catch(() => setError('Could not load the dashboard.'))
  }, [])

  const totals = useMemo(() => {
    const all = projects || []
    const backlog = all.reduce((n, p) => n + (p.servicesBacklog || 0), 0)
    const revenue = all.reduce((n, p) => n + (p.servicesRevenue || 0), 0)
    const withBacklog = all.filter((p) => (p.servicesBacklog || 0) > 0)
    const byStatus: Record<string, { count: number; backlog: number }> = {}
    STATUS_ORDER.forEach((k) => (byStatus[k] = { count: 0, backlog: 0 }))
    all.forEach((p) => {
      const k = STATUS_ORDER.includes(p.engagementStatus) ? p.engagementStatus : 'OPEN'
      byStatus[k].count += 1
      byStatus[k].backlog += p.servicesBacklog || 0
    })
    const atRisk = byStatus.RED.backlog + byStatus.GREY.backlog
    const atRiskCount = byStatus.RED.count + byStatus.GREY.count
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
      .slice(0, 10)
    return {
      count: all.length,
      backlog,
      revenue,
      withBacklogCount: withBacklog.length,
      byStatus,
      atRisk,
      atRiskCount,
      stale,
      triage,
      clientRank,
      maxClientBacklog: clientRank.length ? clientRank[0][1] : 0,
    }
  }, [projects])

  const attention = useMemo(() => {
    const all = projects || []
    return all
      .filter((p) => (p.servicesBacklog || 0) > 0 && (p.signal.level !== 'green' || p.engagementStatus === 'OPEN'))
      .slice()
      .sort((a, b) => a.signal.score - b.signal.score || (b.servicesBacklog || 0) - (a.servicesBacklog || 0))
      .slice(0, 15)
  }, [projects])

  if (error) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Roboto, sans-serif', color: INK }}>
        <p>{error}</p>
        <Link href="/" style={{ color: '#00538C', fontSize: '13px' }}>← Back to Dashboard</Link>
      </div>
    )
  }

  if (!projects) {
    return <div style={{ padding: '40px', fontFamily: 'Roboto, sans-serif', color: MUTED }}>Loading…</div>
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
        Management center · admin / PM only
      </div>
      <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', fontWeight: 600, color: INK, margin: '0 0 4px' }}>Dashboard</h1>
      <p style={{ fontSize: '12px', color: MUTED, marginTop: 0, marginBottom: '18px' }}>
        {totals.count} projects · row total {money(totals.backlog)}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: '12px', marginBottom: '20px' }}>
        {kpi('Services backlog', money(totals.backlog, true), `${totals.withBacklogCount} of ${totals.count} carry backlog`, 'k1')}
        {kpi('Revenue ITD', money(totals.revenue, true), 'Inception to date on this report', 'k2')}
        {kpi('Stalled or disengaged', money(totals.atRisk, true), `${totals.atRiskCount} projects`, 'k3')}
        {kpi('Gone quiet 90+ days', String(totals.stale.length), money(totals.stale.reduce((n, p) => n + (p.servicesBacklog || 0), 0), true) + ' idle', 'k4')}
        {kpi('Needs triage', String(totals.triage.length), totals.triage.length ? 'No engagement status yet' : 'Every project classified', 'k5')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
        <div>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13.5px', margin: 0 }}>Needs a look today</h2>
              <Link href="/management/portfolio" style={{ fontFamily: 'Oswald, sans-serif', fontSize: '11px', fontWeight: 700, color: RED, textDecoration: 'none' }}>
                Open the portfolio →
              </Link>
            </div>
            {attention.length === 0 ? (
              <p style={{ fontSize: '12px', color: MUTED }}>Nothing is drifting. Enjoy it.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <thead>
                  <tr>
                    {['', 'Project', 'Client', 'Status', 'What the numbers say', 'Backlog', 'Prime'].map((h, i) => (
                      <th key={i} style={{ background: INK, color: '#fff', fontFamily: 'Oswald, sans-serif', fontWeight: 500, textAlign: 'left', padding: '7px 9px', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attention.map((p) => {
                    const meta = STATUS_META[p.engagementStatus] || STATUS_META.OPEN
                    const dotColor = p.signal.level === 'green' ? '#2E7D32' : p.signal.level === 'amber' ? '#8A6100' : RED
                    return (
                      <tr key={p.id} style={{ background: p.signal.level === 'red' ? '#FDF2F4' : undefined }}>
                        <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>
                          <span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%', background: dotColor }} />
                        </td>
                        <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>
                          <div style={{ fontWeight: 700, color: INK }}>{p.name}</div>
                          {p.pid && <div style={{ fontSize: '10.5px', color: MUTED }}>PID {p.pid}</div>}
                        </td>
                        <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>{p.client}</td>
                        <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>
                          <span
                            style={{
                              display: 'inline-block', fontFamily: 'Oswald, sans-serif', fontSize: '10px', textTransform: 'uppercase',
                              padding: '2px 8px', borderRadius: '999px', background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                            }}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}`, color: MUTED }}>{p.signal.reasons[0]}</td>
                        <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>{money(p.servicesBacklog)}</td>
                        <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>{p.primeResource || ''}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px 18px', marginBottom: '14px' }}>
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13.5px', margin: '0 0 10px' }}>Backlog by engagement status</h2>
            <div style={{ display: 'flex', height: '28px', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${BORDER}` }}>
              {STATUS_ORDER.map((k) => {
                const pct = totals.backlog ? (totals.byStatus[k].backlog / totals.backlog) * 100 : 0
                if (pct <= 0) return null
                return <div key={k} title={STATUS_META[k].label} style={{ width: pct + '%', background: STATUS_META[k].color }} />
              })}
            </div>
            <div style={{ display: 'grid', gap: '1px', marginTop: '10px' }}>
              {STATUS_ORDER.filter((k) => totals.byStatus[k].count > 0).map((k) => (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '10px 1fr auto auto', gap: '8px', alignItems: 'center', padding: '3px 2px', fontSize: '11px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: STATUS_META[k].color, display: 'inline-block' }} />
                  <span>{STATUS_META[k].label}</span>
                  <span style={{ color: MUTED }}>{totals.byStatus[k].count}</span>
                  <span style={{ color: MUTED }}>{money(totals.byStatus[k].backlog)}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '10.5px', color: MUTED, marginTop: '8px' }}>
              Status is set by a person. The signal beside each project is calculated from the data — the two are meant to be compared, not merged.
            </p>
          </div>

          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px 18px', marginBottom: '14px' }}>
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13.5px', margin: '0 0 10px' }}>Backlog by client</h2>
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

          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px 18px' }}>
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13.5px', margin: '0 0 10px' }}>Jump to</h2>
            <div style={{ display: 'grid', gap: '6px', fontSize: '12px' }}>
              <Link href="/projects/netsuite-import" style={{ color: '#00538C' }}>
                Import this morning's NetSuite export
              </Link>
              <Link href="/management/portfolio" style={{ color: '#00538C' }}>
                Full portfolio and triage queue
              </Link>
              <Link href="/management/team-load" style={{ color: '#00538C' }}>
                Team &amp; Load capacity view
              </Link>
              <Link href="/projects" style={{ color: '#00538C' }}>
                Project Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
