'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

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
  liveWork: string[]
  totalProjectCount: number
  backlog: number
  revenue: number
}

const RED = '#A50021'
const INK = '#323E48'
const MUTED = '#6B7780'
const BORDER = '#D8DCDF'
const LINK = '#00538C'

const HEALTH_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  GREEN: { label: 'Healthy', color: '#2E7D32', bg: '#E4F0E5', border: '#BFDCC1' },
  AMBER: { label: 'At risk', color: '#8A6100', bg: '#FDF3DC', border: '#F0D89B' },
  RED: { label: 'Critical', color: '#A50021', bg: '#F7E2E6', border: '#E6BCC5' },
}
const HEALTH_ORDER = ['GREEN', 'AMBER', 'RED']

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
  const [tenants, setTenants] = useState<TenantRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [csm, setCsm] = useState('')
  const [scope, setScope] = useState<'live' | 'all' | 'scored'>('live')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/admin/accounts')
      .then((r) => {
        if (r.status === 401 || r.status === 403) throw new Error('auth')
        if (!r.ok) throw new Error('load')
        return r.json()
      })
      .then((data) => setTenants(data.tenants))
      .catch((e) => {
        setError(e.message === 'auth' ? 'This page is for AssetWorks PM and admin accounts only.' : 'Could not load accounts.')
      })
  }, [])

  async function saveField(id: string, field: string, value: string, patch: Partial<TenantRow>) {
    setSaving((s) => ({ ...s, [id]: true }))
    setTenants((prev) => prev && prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
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

  const filteredSorted = useMemo(() => {
    let list = (tenants || []).filter((t) => {
      if (scope === 'live' && t.liveWork.length === 0) return false
      if (scope === 'scored' && !t.csHealth) return false
      if (csm && t.csmName !== csm) return false
      if (q.trim()) {
        const hay = [t.name, t.csmName, t.csHealthNote, ...t.liveWork].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q.trim().toLowerCase())) return false
      }
      return true
    })
    list = list.slice().sort((a, b) => b.backlog - a.backlog)
    return list
  }, [tenants, q, csm, scope])

  if (error) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Roboto, sans-serif', color: INK }}>
        <p>{error}</p>
        <Link href="/" style={{ color: LINK, fontSize: '13px' }}>← Back to Dashboard</Link>
      </div>
    )
  }

  if (!tenants) {
    return <div style={{ padding: '40px', fontFamily: 'Roboto, sans-serif', color: MUTED }}>Loading accounts…</div>
  }

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', padding: '28px', maxWidth: '1500px', margin: '0 auto' }}>
      <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '10.5px', color: RED, marginBottom: '2px' }}>
        Book of business
      </div>
      <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', fontWeight: 600, color: INK, margin: '0 0 4px' }}>Accounts</h1>
      <p style={{ fontSize: '12.5px', color: MUTED, marginTop: 0, marginBottom: '18px' }}>
        Every client the export names, largest backlog first, with whatever the customer success team has recorded so far.
      </p>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
        <select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)} style={{ fontSize: '12px', padding: '6px 9px', border: `1px solid ${BORDER}`, borderRadius: '6px' }}>
          <option value="live">Clients with live work</option>
          <option value="all">All accounts</option>
          <option value="scored">Scored only</option>
        </select>
        <select value={csm} onChange={(e) => setCsm(e.target.value)} style={{ fontSize: '12px', padding: '6px 9px', border: `1px solid ${BORDER}`, borderRadius: '6px' }}>
          <option value="">All customer success managers</option>
          {csms.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Filter accounts"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ fontSize: '12px', padding: '6px 9px', border: `1px solid ${BORDER}`, borderRadius: '6px', minWidth: '220px' }}
        />
        <span style={{ fontSize: '11.5px', color: MUTED, marginLeft: 'auto' }}>{filteredSorted.length} accounts</span>
      </div>

      {filteredSorted.length === 0 && (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '26px', textAlign: 'center', color: MUTED, fontSize: '12.5px' }}>
          Nothing matches those filters.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
        {filteredSorted.map((t) => {
          const meta = t.csHealth ? HEALTH_META[t.csHealth] : null
          const isExpanded = !!expanded[t.id]
          const daysToEnd = daysUntil(t.renewal?.contractEnd || null)
          return (
            <div key={t.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: meta ? meta.color : '#B7BEC4', flexShrink: 0 }} />
                  <button
                    onClick={() => setExpanded((e) => ({ ...e, [t.id]: !e[t.id] }))}
                    style={{ fontSize: '14px', fontWeight: 700, color: LINK, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {t.name}
                  </button>
                </div>
                <select
                  value={t.csHealth || ''}
                  onChange={(e) => saveField(t.id, 'cs_health', e.target.value, { csHealth: e.target.value || null })}
                  style={{
                    fontFamily: 'Oswald, sans-serif',
                    fontSize: '9.5px',
                    textTransform: 'uppercase',
                    borderRadius: '999px',
                    padding: '2px 7px',
                    border: `1px solid ${meta ? meta.border : BORDER}`,
                    background: meta ? meta.bg : '#F4F5F6',
                    color: meta ? meta.color : MUTED,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <option value="">Not scored</option>
                  {HEALTH_ORDER.map((k) => (
                    <option key={k} value={k}>{HEALTH_META[k].label}</option>
                  ))}
                </select>
              </div>
              {t.tier && <div style={{ fontSize: '11px', color: MUTED, marginTop: '2px', marginLeft: '17px' }}>{t.tier}</div>}

              <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: '10px', paddingTop: '10px', display: 'grid', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px' }}>
                  <span style={{ color: MUTED }}>CSM</span>
                  <span>{t.csmName || <span style={{ color: MUTED }}>unassigned</span>}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px' }}>
                  <span style={{ color: MUTED }}>Live work</span>
                  <span style={{ color: t.liveWork.length ? LINK : MUTED }}>{t.liveWork.length ? t.liveWork.join(', ') : 'none'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px' }}>
                  <span style={{ color: MUTED }}>Backlog</span>
                  <span style={{ fontWeight: 700 }}>{money(t.backlog)}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px' }}>
                  <span style={{ color: MUTED }}>Revenue ITD</span>
                  <span>{money(t.revenue)}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px' }}>
                  <span style={{ color: MUTED }}>Renewal</span>
                  <span>
                    {t.renewal?.contractEnd ? (
                      <>
                        {shortDate(t.renewal.contractEnd)}{' '}
                        <span style={{ color: daysToEnd !== null && daysToEnd <= 90 && daysToEnd >= 0 ? RED : MUTED }}>
                          {t.renewal.stage || 'Not started'}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: MUTED }}>not tracked</span>
                    )}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${BORDER}`, display: 'grid', gap: '10px' }}>
                  <EditField label="CSM" value={t.csmName} onSave={(v) => saveField(t.id, 'csm_name', v, { csmName: v || null })} placeholder="Who owns this relationship" />
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.6px', color: MUTED, fontFamily: 'Oswald, sans-serif', marginBottom: '3px' }}>Renewal stage</label>
                    <select
                      value={t.renewal?.stage || 'Not started'}
                      onChange={(e) => saveField(t.id, 'renewal_stage', e.target.value, { renewal: { contractEnd: t.renewal?.contractEnd || null, stage: e.target.value, notes: t.renewal?.notes || null } })}
                      style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: `1px solid ${BORDER}`, borderRadius: '6px' }}
                    >
                      {STAGE_ORDER.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <EditField
                    label="Contract end date"
                    value={t.renewal?.contractEnd || null}
                    type="date"
                    onSave={(v) => saveField(t.id, 'renewal_contract_end', v, { renewal: { contractEnd: v || null, stage: t.renewal?.stage || null, notes: t.renewal?.notes || null } })}
                  />
                  <EditField
                    label="CS health note"
                    value={t.csHealthNote}
                    onSave={(v) => saveField(t.id, 'cs_health_note', v, { csHealthNote: v || null })}
                    textarea
                    placeholder="Why this account is scored the way it is, and what would move it"
                  />
                  <EditField
                    label="Renewal notes"
                    value={t.renewal?.notes || null}
                    onSave={(v) => saveField(t.id, 'renewal_notes', v, { renewal: { contractEnd: t.renewal?.contractEnd || null, stage: t.renewal?.stage || null, notes: v || null } })}
                    textarea
                    placeholder="Where the renewal conversation stands"
                  />
                  {t.totalProjectCount > 0 && (
                    <p style={{ fontSize: '10.5px', color: MUTED, margin: 0 }}>
                      {t.totalProjectCount} total project{t.totalProjectCount === 1 ? '' : 's'} on file, {t.liveWork.length} with open backlog.
                    </p>
                  )}
                  {saving[t.id] && <span style={{ fontSize: '10.5px', color: MUTED }}>Saving…</span>}
                </div>
              )}
            </div>
          )
        })}
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
