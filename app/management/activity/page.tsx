'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

const RED = '#A50021'
const INK = '#323E48'
const MUTED = '#6B7780'
const BORDER = '#D8DCDF'
const GREEN = '#2E7D32'
const GREEN_BG = '#E7F3E8'
const BLUE = '#00538C'
const BLUE_BG = '#E4F0F7'
const RED_BG = '#FBE7EA'
const ZEBRA = '#F4F5F6'

type Entry = {
  id: number
  project_id: string | null
  project_name: string | null
  tenant_name: string | null
  module: string
  entity_type: string
  entity_id: string | null
  action: 'created' | 'updated' | 'deleted'
  actor_name: string | null
  actor_email: string | null
  summary: string
  detail: string | null
  created_at: string
}

type Counts = { today: number; week: number; week_deletes: number }

const MODULE_LABEL: Record<string, string> = {
  project_center: 'Project Center',
  portfolio: 'Portfolio',
  resource_center: 'Resource Center',
  collaboration_hub: 'Collaboration Hub',
  netsuite_import: 'NetSuite Import',
}

const ACTION_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  created: { label: 'added a', icon: '+', color: GREEN, bg: GREEN_BG },
  updated: { label: 'edited a', icon: '✎', color: BLUE, bg: BLUE_BG },
  deleted: { label: 'deleted a', icon: '×', color: RED, bg: RED_BG },
}

function dayLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function ActivityPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [counts, setCounts] = useState<Counts | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [q, setQ] = useState('')
  const [hasMore, setHasMore] = useState(true)

  const load = useCallback(
    (before?: string, replace?: boolean) => {
      const params = new URLSearchParams()
      if (action) params.set('action', action)
      if (moduleFilter) params.set('module', moduleFilter)
      if (q) params.set('q', q)
      if (before) params.set('before', before)
      params.set('limit', '40')

      if (before) setLoadingMore(true)
      else setLoading(true)

      fetch(`/api/admin/activity?${params.toString()}`)
        .then(async (r) => {
          if (r.status === 401 || r.status === 403) {
            setError('This page is for AssetWorks PM and admin accounts only.')
            return
          }
          if (!r.ok) {
            setError('Could not load activity.')
            return
          }
          const data = await r.json()
          const rows: Entry[] = data.entries || []
          setEntries((prev) => (replace ? rows : [...prev, ...rows]))
          setCounts(data.counts)
          setHasMore(rows.length === 40)
        })
        .catch(() => setError('Could not load activity.'))
        .finally(() => {
          setLoading(false)
          setLoadingMore(false)
        })
    },
    [action, moduleFilter, q]
  )

  useEffect(() => {
    setEntries([])
    load(undefined, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, moduleFilter])

  function runSearch() {
    setEntries([])
    load(undefined, true)
  }

  function loadMore() {
    if (entries.length === 0) return
    load(entries[entries.length - 1].created_at)
  }

  if (error) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Roboto, sans-serif', color: INK }}>
        <p>{error}</p>
        <Link href="/" style={{ color: BLUE, fontSize: '13px' }}>
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  const groups: { label: string; items: Entry[] }[] = []
  entries.forEach((e) => {
    const label = dayLabel(e.created_at)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(e)
    else groups.push({ label, items: [e] })
  })

  function chip(active: boolean, label: string, onClick: () => void, activeColor?: string) {
    return (
      <span
        onClick={onClick}
        style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: '10.5px',
          fontWeight: 600,
          letterSpacing: '.3px',
          padding: '5px 12px',
          borderRadius: '999px',
          border: `1px solid ${active ? activeColor || INK : BORDER}`,
          color: active ? '#fff' : MUTED,
          background: active ? activeColor || INK : '#fff',
          cursor: 'pointer',
        }}
      >
        {label}
      </span>
    )
  }

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', padding: '28px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '10.5px', color: RED, marginBottom: '2px' }}>
        Management center · admin / PM only
      </div>
      <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', fontWeight: 600, color: INK, margin: '0 0 4px' }}>Activity</h1>
      <p style={{ fontSize: '12px', color: MUTED, marginTop: 0, marginBottom: '16px' }}>
        Every create, edit, and delete across Project Center, Portfolio, Resource Center, and Collaboration Hub — all customers.
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {[
          ['today', 'today'],
          ['week', 'this week'],
          ['week_deletes', 'deletions this week'],
        ].map(([key, label]) => (
          <div key={key} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '9px 16px', fontSize: '11px', color: MUTED }}>
            <b style={{ fontSize: '16px', color: INK, fontFamily: 'Oswald, sans-serif', marginRight: '6px' }}>
              {counts ? (counts as any)[key] : '…'}
            </b>
            {label}
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSearch()
            }}
            placeholder="Search by person, project, or item…"
            style={{ flex: 1, padding: '7px 11px', border: `1px solid ${BORDER}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'Roboto, sans-serif' }}
          />
          <button
            onClick={runSearch}
            style={{ padding: '7px 14px', background: INK, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Oswald, sans-serif' }}
          >
            Search
          </button>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {chip(action === '', 'All', () => setAction(''))}
            {chip(action === 'created', 'Created', () => setAction('created'), GREEN)}
            {chip(action === 'updated', 'Edited', () => setAction('updated'), BLUE)}
            {chip(action === 'deleted', 'Deleted', () => setAction('deleted'), RED)}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {chip(moduleFilter === '', 'All Modules', () => setModuleFilter(''))}
            {chip(moduleFilter === 'project_center', 'Project Center', () => setModuleFilter('project_center'))}
            {chip(moduleFilter === 'portfolio', 'Portfolio', () => setModuleFilter('portfolio'))}
            {chip(moduleFilter === 'resource_center', 'Resource Center', () => setModuleFilter('resource_center'))}
            {chip(moduleFilter === 'collaboration_hub', 'Collaboration Hub', () => setModuleFilter('collaboration_hub'))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: MUTED, fontSize: '12px' }}>Loading…</div>
      ) : groups.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: MUTED,
            fontSize: '12px',
            background: '#fff',
            border: `1px solid ${BORDER}`,
            borderRadius: '8px',
          }}
        >
          Nothing matches yet.
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.label} style={{ marginBottom: '18px' }}>
            <div
              style={{
                fontFamily: 'Oswald, sans-serif',
                fontSize: '10.5px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: MUTED,
                fontWeight: 700,
                margin: '0 0 8px 2px',
              }}
            >
              {g.label}
            </div>
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
              {g.items.map((e, idx) => {
                const meta = ACTION_META[e.action] || ACTION_META.updated
                return (
                  <div
                    key={e.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px 16px',
                      borderBottom: idx === g.items.length - 1 ? 'none' : '1px solid #EAECEE',
                    }}
                  >
                    <div
                      style={{
                        flex: '0 0 auto',
                        width: '27px',
                        height: '27px',
                        borderRadius: '7px',
                        background: meta.bg,
                        color: meta.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                      }}
                    >
                      {meta.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            letterSpacing: '.3px',
                            textTransform: 'uppercase',
                            color: BLUE,
                            background: BLUE_BG,
                            borderRadius: '4px',
                            padding: '2px 6px',
                          }}
                        >
                          {MODULE_LABEL[e.module] || e.module}
                        </span>
                        <span style={{ fontWeight: 700, color: INK, fontSize: '12.5px' }}>{e.actor_name || 'Someone'}</span>
                        <span style={{ fontSize: '12px', color: MUTED }}>
                          {meta.label} {e.entity_type.replace(/_/g, ' ')}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: '10.5px', color: '#8a9199', whiteSpace: 'nowrap' }}>
                          {timeLabel(e.created_at)}
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', color: INK, marginTop: '2px' }}>{e.summary}</div>
                      {e.detail && (
                        <div
                          style={{
                            marginTop: '6px',
                            fontSize: '11px',
                            background: ZEBRA,
                            borderRadius: '6px',
                            padding: '6px 9px',
                            color: MUTED,
                          }}
                        >
                          {e.detail}
                        </div>
                      )}
                      {e.project_name && (
                        <div
                          style={{
                            display: 'inline-block',
                            marginTop: '5px',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: MUTED,
                            background: ZEBRA,
                            border: '1px solid #EAECEE',
                            borderRadius: '4px',
                            padding: '2px 7px',
                          }}
                        >
                          {e.tenant_name ? `${e.tenant_name} — ` : ''}
                          {e.project_name}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {!loading && hasMore && entries.length > 0 && (
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{ background: 'none', border: 'none', color: BLUE, fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
          >
            {loadingMore ? 'Loading…' : 'Load older activity →'}
          </button>
        </div>
      )}
    </div>
  )
}
