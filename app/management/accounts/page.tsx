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
  servicesBacklog: number | null
  servicesRevenue: number | null
}

type Renewal = { contractEnd: string | null; stage: string | null; notes: string | null } | null

type TenantRow = {
  id: string
  name: string
  slug: string
  tier: string | null
  csmName: string | null
  csHealth: string | null
  csHealthNote: string | null
  renewal: Renewal
}

type AccountRow = TenantRow & {
  liveProjects: ProjectRow[]
  allProjects: ProjectRow[]
  backlog: number
  revenue: number
}

const RED = '#A50021'
const INK = '#323E48'
const MUTED = '#6B7780'
const BORDER = '#D8DCDF'

const HEALTH_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  GREEN: { label: 'Healthy', color: '#2E7D32', bg: '#E4F0E5', border: '#BFDCC1' },
  AMBER: { label: 'At risk', color: '#8A6100', bg: '#FDF3DC', border: '#F0D89B' },
  RED: { label: 'Critical', color: '#A50021', bg: '#F7E2E6', border: '#E6BCC5' },
}
const HEALTH_ORDER = ['GREEN', 'AMBER', 'RED']

const STAGE_META: Record<string, { color: string; bg: string }> = {
  'Not started': { color: MUTED, bg: '#ECEEF0' },
  'In progress': { color: '#00538C', bg: '#E2EDF4' },
  'At risk': { color: RED, bg: '#F7E2E6' },
  Renewed: { color: '#2E7D32', bg: '#E4F0E5' },
  Lost: { color: MUTED, bg: '#ECEEF0' },
}
const STAGE_ORDER = ['Not started', 'In progress', 'At risk', 'Renewed', 'Lost']

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

function daysUntil(d: string | null): number | null {
  if (!d) return null
  return Math.round((new Date(d + 'T12:00:00').getTime() - Date.now()) / 86_400_000)
}

export default function AccountsPage() {
  const [projects, setProjects] = useState<ProjectRow[] | null>(null)
  const [tenants, setTenants] = useState<TenantRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [csm, setCsm] = useState('')
  const [scope, setScope] = useState<'live' | 'all' | 'scored'>('live')
  const [sortKey, setSortKey] = useState<'name' | 'backlog' | 'renewal'>('backlog')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/portfolio').then((r) => {
        if (r.status === 401 || r.status === 403) throw new Error('auth')
        if (!r.ok) throw new Error('load')
        return r.json()
      }),
      fetch('/api/admin/accounts').then((r) => {
        if (r.status === 401 || r.status === 403) throw new Error('auth')
        if (!r.ok) throw new Error('load')
        return r.json()
      }),
    ])
      .then(([portfolioData, accountsData]) => {
        setProjects(portfolioData.projects)
        setTenants(accountsData.tenants)
      })
      .catch((e) => {
        setError(e.message === 'auth' ? 'This page is for AssetWorks PM and admin accounts only.' : 'Could not load accounts.')
      })
  }, [])

  async function saveField(id: string, field: string, value: string, patch: Partial<AccountRow>) {
    setSaving((s) => ({ ...s, [id]: true }))
    setTenants((prev) =>
      prev &&
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...(patch as Partial<TenantRow>),
            }
          : t
      )
    )
    try {
      await fetch('/api/admin/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field, value }),
      })
    } finally {
      setSaving((s) => ({ ...s, [id]: false }))
    }
  }

  const csms = useMemo(() => {
    const set = new Set<string>()
    ;(tenants || []).forEach((t) => t.csmName && set.add(t.csmName))
    return Array.from(set).sort()
  }, [tenants])

  const accounts: AccountRow[] = useMemo(() => {
    const projectList = projects || []
    return (tenants || []).map((t) => {
      const allProjects = projectList.filter((p) => p.tenantId === t.id)
      const liveProjects = allProjects.filter((p) => (p.servicesBacklog || 0) > 0)
      return {
        ...t,
        allProjects,
        liveProjects,
        backlog: liveProjects.reduce((n, p) => n + (p.servicesBacklog || 0), 0),
        revenue: allProjects.reduce((n, p) => n + (p.servicesRevenue || 0), 0),
      }
    })
  }, [tenants, projects])

  const totals = useMemo(() => {
    const live = accounts.filter((a) => a.liveProjects.length > 0)
    const byHealth: Record<string, { count: number; backlog: number }> = {}
    HEALTH_ORDER.forEach((k) => (byHealth[k] = { count: 0, backlog: 0 }))
    live.forEach((a) => {
      if (a.csHealth && byHealth[a.csHealth]) {
        byHealth[a.csHealth].count += 1
        byHealth[a.csHealth].backlog += a.backlog
      }
    })
    const unassigned = accounts.filter((a) => a.liveProjects.length > 0 && !a.csmName)
    const dueSoon = accounts
      .filter((a) => {
        const d = daysUntil(a.renewal?.contractEnd || null)
        return d !== null && d >= 0 && d <= 90 && a.renewal?.stage !== 'Renewed' && a.renewal?.stage !== 'Lost'
      })
      .sort((a, b) => (daysUntil(a.renewal?.contractEnd || null) || 0) - (daysUntil(b.renewal?.contractEnd || null) || 0))
    return {
      liveCount: live.length,
      liveBacklog: live.reduce((n, a) => n + a.backlog, 0),
      byHealth,
      unassigned,
      dueSoon,
    }
  }, [accounts])

  const filteredSorted = useMemo(() => {
    let list = accounts.filter((a) => {
      if (scope === 'live' && a.liveProjects.length === 0) return false
      if (scope === 'scored' && !a.csHealth) return false
      if (csm && a.csmName !== csm) return false
      if (q.trim()) {
        const hay = [a.name, a.csmName, a.csHealthNote, ...a.allProjects.map((p) => p.name)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q.trim().toLowerCase())) return false
      }
      return true
    })
    const dir = sortDir === 'asc' ? 1 : -1
    list = list.slice().sort((a, b) => {
      let av: string | number = 0
      let bv: string | number = 0
      if (sortKey === 'name') {
        av = a.name.toLowerCase()
        bv = b.name.toLowerCase()
      } else if (sortKey === 'backlog') {
        av = a.backlog
        bv = b.backlog
      } else if (sortKey === 'renewal') {
        av = daysUntil(a.renewal?.contractEnd || null) ?? 999999
        bv = daysUntil(b.renewal?.contractEnd || null) ?? 999999
      }
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
    return list
  }, [accounts, q, csm, scope, sortKey, sortDir])

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : key === 'renewal' ? 'asc' : 'desc')
    }
  }

  if (error) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Roboto, sans-serif', color: INK }}>
        <p>{error}</p>
        <Link href="/" style={{ color: '#00538C', fontSize: '13px' }}>← Back to Dashboard</Link>
      </div>
    )
  }

  if (!tenants || !projects) {
    return <div style={{ padding: '40px', fontFamily: 'Roboto, sans-serif', color: MUTED }}>Loading accounts…</div>
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
        Book of business · admin / PM only
      </div>
      <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', fontWeight: 600, color: INK, margin: '0 0 4px' }}>Accounts</h1>
      <p style={{ fontSize: '12px', color: MUTED, marginTop: 0, marginBottom: '16px' }}>
        {totals.liveCount} accounts with live backlog · {money(totals.liveBacklog)} total
      </p>
      <div style={{ borderLeft: `3px solid ${RED}`, background: '#FBEFF1', padding: '8px 12px', borderRadius: '4px', fontSize: '11.5px', color: '#3a4650', marginBottom: '18px' }}>
        CSM and CS Health are set by a person, the same way Engagement Status works on Portfolio. Backlog and Revenue are pulled from the same project data as Portfolio.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: '12px', marginBottom: '20px' }}>
        {kpi('Live backlog', money(totals.liveBacklog, true), `${totals.liveCount} accounts with open backlog`, 'k1')}
        {kpi('Healthy', String(totals.byHealth.GREEN.count), money(totals.byHealth.GREEN.backlog, true) + ' backlog', 'k2')}
        {kpi('At risk / critical', String(totals.byHealth.AMBER.count + totals.byHealth.RED.count), money(totals.byHealth.AMBER.backlog + totals.byHealth.RED.backlog, true) + ' backlog', 'k3')}
        {kpi('No CSM assigned', String(totals.unassigned.length), totals.unassigned.length ? 'needs an owner' : 'every live account is covered', 'k4')}
        {kpi('Renewals due 90 days', String(totals.dueSoon.length), totals.dueSoon.length ? totals.dueSoon[0].name + ' next' : 'nothing coming due', 'k5')}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
        <input
          type="search"
          placeholder="Filter by account, CSM or project"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ fontSize: '12px', padding: '6px 9px', border: `1px solid ${BORDER}`, borderRadius: '6px', minWidth: '260px' }}
        />
        <select value={csm} onChange={(e) => setCsm(e.target.value)} style={{ fontSize: '12px', padding: '6px 9px', border: `1px solid ${BORDER}`, borderRadius: '6px' }}>
          <option value="">All CSMs</option>
          {csms.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)} style={{ fontSize: '12px', padding: '6px 9px', border: `1px solid ${BORDER}`, borderRadius: '6px' }}>
          <option value="live">Live accounts only</option>
          <option value="all">All accounts</option>
          <option value="scored">Health scored only</option>
        </select>
        <span style={{ fontSize: '11px', color: MUTED }}>{filteredSorted.length} of {accounts.length}</span>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '8px 0 16px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
          <thead>
            <tr>
              {[
                { key: null, label: 'Health' },
                { key: 'name', label: 'Account' },
                { key: null, label: 'CSM' },
                { key: null, label: 'Live work' },
                { key: 'backlog', label: 'Backlog' },
                { key: null, label: 'Revenue ITD' },
                { key: 'renewal', label: 'Renewal' },
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
              <tr><td colSpan={8} style={{ padding: '26px', textAlign: 'center', color: MUTED }}>Nothing matches those filters.</td></tr>
            )}
            {filteredSorted.map((a) => {
              const meta = a.csHealth ? HEALTH_META[a.csHealth] : null
              const isExpanded = !!expanded[a.id]
              const daysToEnd = daysUntil(a.renewal?.contractEnd || null)
              const shownProjects = a.liveProjects.slice(0, 3)
              const moreCount = a.liveProjects.length - shownProjects.length
              return (
                <Fragment key={a.id}>
                  <tr id={'row-' + a.id}>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>
                      <select
                        value={a.csHealth || ''}
                        onChange={(e) => saveField(a.id, 'cs_health', e.target.value, { csHealth: e.target.value || null })}
                        style={{
                          fontFamily: 'Oswald, sans-serif',
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          borderRadius: '999px',
                          padding: '2px 7px',
                          border: `1px solid ${meta ? meta.border : BORDER}`,
                          background: meta ? meta.bg : '#F4F5F6',
                          color: meta ? meta.color : MUTED,
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">Not scored</option>
                        {HEALTH_ORDER.map((k) => (
                          <option key={k} value={k}>{HEALTH_META[k].label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700, color: INK }}>{a.name}</div>
                      {a.tier && <div style={{ fontSize: '10.5px', color: MUTED }}>{a.tier}</div>}
                    </td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>
                      {a.csmName || <span style={{ color: MUTED }}>unassigned</span>}
                    </td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>
                      {a.liveProjects.length === 0 ? (
                        <span style={{ color: MUTED, fontSize: '11px' }}>none</span>
                      ) : (
                        <>
                          {shownProjects.map((p) => (
                            <span key={p.id} style={{ display: 'inline-block', fontSize: '10.5px', background: '#ECEEF0', color: INK, borderRadius: '999px', padding: '2px 8px', margin: '0 4px 4px 0' }}>
                              {p.name}
                            </span>
                          ))}
                          {moreCount > 0 && <span style={{ fontSize: '10.5px', color: MUTED }}>+{moreCount} more</span>}
                        </>
                      )}
                    </td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>{money(a.backlog)}</td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right', color: MUTED }}>{money(a.revenue)}</td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>
                      {a.renewal?.contractEnd ? (
                        <>
                          {shortDate(a.renewal.contractEnd)}
                          <div style={{ fontSize: '10px', color: daysToEnd !== null && daysToEnd <= 90 && daysToEnd >= 0 ? RED : MUTED }}>
                            {a.renewal.stage || 'Not started'}{daysToEnd !== null ? ' · ' + (daysToEnd >= 0 ? daysToEnd + 'd' : Math.abs(daysToEnd) + 'd ago') : ''}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: MUTED }}>not tracked</span>
                      )}
                    </td>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>
                      <button
                        onClick={() => setExpanded((e) => ({ ...e, [a.id]: !e[a.id] }))}
                        style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10.5px', fontWeight: 700, border: `1px solid ${RED}`, background: isExpanded ? RED : '#fff', color: isExpanded ? '#fff' : RED, borderRadius: '6px', padding: '3px 10px', cursor: 'pointer' }}
                      >
                        {isExpanded ? 'Hide' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr style={{ background: '#FAFBFC' }}>
                      <td colSpan={8} style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                          <EditField label="CSM" value={a.csmName} onSave={(v) => saveField(a.id, 'csm_name', v, { csmName: v || null })} placeholder="Who owns this relationship" />
                          <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.6px', color: MUTED, fontFamily: 'Oswald, sans-serif', marginBottom: '3px' }}>Renewal stage</label>
                            <select
                              value={a.renewal?.stage || 'Not started'}
                              onChange={(e) => saveField(a.id, 'renewal_stage', e.target.value, { renewal: { contractEnd: a.renewal?.contractEnd || null, stage: e.target.value, notes: a.renewal?.notes || null } })}
                              style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: `1px solid ${BORDER}`, borderRadius: '6px' }}
                            >
                              {STAGE_ORDER.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <EditField
                            label="Contract end date"
                            value={a.renewal?.contractEnd || null}
                            type="date"
                            onSave={(v) => saveField(a.id, 'renewal_contract_end', v, { renewal: { contractEnd: v || null, stage: a.renewal?.stage || null, notes: a.renewal?.notes || null } })}
                          />
                          <div style={{ gridColumn: '1/-1' }}>
                            <EditField
                              label="CS health note"
                              value={a.csHealthNote}
                              onSave={(v) => saveField(a.id, 'cs_health_note', v, { csHealthNote: v || null })}
                              textarea
                              placeholder="Why this account is scored the way it is, and what would move it"
                            />
                          </div>
                          <div style={{ gridColumn: '1/-1' }}>
                            <EditField
                              label="Renewal notes"
                              value={a.renewal?.notes || null}
                              onSave={(v) => saveField(a.id, 'renewal_notes', v, { renewal: { contractEnd: a.renewal?.contractEnd || null, stage: a.renewal?.stage || null, notes: v || null } })}
                              textarea
                              placeholder="Where the renewal conversation stands"
                            />
                          </div>
                        </div>
                        {a.allProjects.length > 0 && (
                          <p style={{ fontSize: '10.5px', color: MUTED, marginTop: '10px' }}>
                            {a.allProjects.length} total project{a.allProjects.length === 1 ? '' : 's'} on file, {a.liveProjects.length} with open backlog.
                          </p>
                        )}
                        {saving[a.id] && <span style={{ fontSize: '10.5px', color: MUTED }}>Saving…</span>}
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
