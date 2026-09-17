'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Cell = { plannedHours: number | null; capacityHours: number | null; utilizationPct: number | null; extra: Record<string, string> }
type Period = { importId: string; label: string; importedBy: string; createdAt: string; rowCount: number }
type Consultant = { name: string; cells: Record<string, Cell> }

const RED = '#A50021'
const INK = '#323E48'
const MUTED = '#6B7780'
const BORDER = '#D8DCDF'

function shortDate(d: string | null): string {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
}

// Same palette used for engagement status elsewhere in the portal, applied
// to a continuous utilization scale instead of a discrete status.
function utilColor(pct: number | null): { bg: string; c: string; label: string } {
  if (pct === null) return { bg: '#ECEEF0', c: MUTED, label: 'no data' }
  if (pct > 110) return { bg: '#F7E2E6', c: RED, label: 'over capacity' }
  if (pct >= 85) return { bg: '#FDF3DC', c: '#8A6100', label: 'at capacity' }
  if (pct >= 50) return { bg: '#E4F0E5', c: '#2E7D32', label: 'healthy' }
  return { bg: '#E2EDF4', c: '#00538C', label: 'under-utilized' }
}

export default function TeamLoadPage() {
  const [periods, setPeriods] = useState<Period[] | null>(null)
  const [consultants, setConsultants] = useState<Consultant[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/team-load')
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          setError('This page is for AssetWorks PM and admin accounts only.')
          return
        }
        if (!r.ok) {
          setError('Could not load Team & Load.')
          return
        }
        const data = await r.json()
        setPeriods(data.periods)
        setConsultants(data.consultants)
      })
      .catch(() => setError('Could not load Team & Load.'))
  }, [])

  const latestPeriod = periods && periods.length > 0 ? periods[periods.length - 1] : null

  const kpis = useMemo(() => {
    if (!consultants || !latestPeriod) return null
    const latestCells = consultants
      .map((c) => c.cells[latestPeriod.importId])
      .filter((c): c is Cell => !!c && c.utilizationPct !== null)
    const tracked = consultants.filter((c) => c.cells[latestPeriod.importId]).length
    const avg = latestCells.length ? latestCells.reduce((n, c) => n + (c.utilizationPct || 0), 0) / latestCells.length : null
    const overCapacity = latestCells.filter((c) => (c.utilizationPct || 0) > 110).length
    const underUtilized = latestCells.filter((c) => (c.utilizationPct || 0) < 50).length
    return { tracked, avg, overCapacity, underUtilized }
  }, [consultants, latestPeriod])

  if (error) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Roboto, sans-serif', color: INK }}>
        <p>{error}</p>
        <Link href="/" style={{ color: '#00538C', fontSize: '13px' }}>← Back to Dashboard</Link>
      </div>
    )
  }

  if (!periods || !consultants) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', fontWeight: 600, color: INK, margin: '0 0 4px' }}>Team &amp; Load</h1>
          <p style={{ fontSize: '12px', color: MUTED, marginTop: 0, marginBottom: '4px' }}>
            {periods.length === 0
              ? 'No capacity reports imported yet.'
              : `${consultants.length} consultants tracked · latest period ${latestPeriod?.label} (${shortDate(latestPeriod?.createdAt || null)})`}
          </p>
        </div>
        <Link
          href="/management/team-load/import"
          style={{ fontFamily: 'Oswald, sans-serif', fontSize: '11px', fontWeight: 700, background: RED, color: '#fff', border: `1px solid ${RED}`, borderRadius: '6px', padding: '8px 14px', textDecoration: 'none' }}
        >
          Import capacity report →
        </Link>
      </div>

      <div style={{ borderLeft: `3px solid ${RED}`, background: '#FBEFF1', padding: '8px 12px', borderRadius: '4px', fontSize: '11.5px', color: '#3a4650', margin: '14px 0 20px' }}>
        This comes from a periodic OpenAir capacity/utilization export an admin imports by hand — not a live feed. Data is only as current as the last import.
      </div>

      {periods.length === 0 ? (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: MUTED, marginBottom: '14px' }}>
            Nothing imported yet. Pull a capacity/utilization report from OpenAir and import it to get started.
          </p>
          <Link href="/management/team-load/import" style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', fontWeight: 700, color: RED }}>
            Import capacity report →
          </Link>
        </div>
      ) : (
        <>
          {kpis && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '20px' }}>
              {kpi('Consultants tracked', String(kpis.tracked), 'in the latest import', 'k1')}
              {kpi('Avg utilization', kpis.avg !== null ? Math.round(kpis.avg) + '%' : 'n/a', 'latest period', 'k2')}
              {kpi('Over capacity', String(kpis.overCapacity), '>110% utilized', 'k3')}
              {kpi('Under-utilized', String(kpis.underUtilized), '<50% utilized', 'k4')}
            </div>
          )}

          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px 18px', marginBottom: '20px', overflowX: 'auto' }}>
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13.5px', margin: '0 0 12px' }}>Utilization by period</h2>
            <table style={{ borderCollapse: 'collapse', fontSize: '11.5px', minWidth: '100%' }}>
              <thead>
                <tr>
                  <th style={{ background: INK, color: '#fff', fontFamily: 'Oswald, sans-serif', fontWeight: 500, textAlign: 'left', padding: '7px 9px', position: 'sticky', left: 0 }}>
                    Consultant
                  </th>
                  {periods.map((p) => (
                    <th key={p.importId} style={{ background: INK, color: '#fff', fontFamily: 'Oswald, sans-serif', fontWeight: 500, textAlign: 'center', padding: '7px 9px', whiteSpace: 'nowrap' }} title={`Imported ${shortDate(p.createdAt)} by ${p.importedBy}`}>
                      {p.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consultants.map((c) => (
                  <tr key={c.name}>
                    <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}`, fontWeight: 700, color: INK, background: '#fff', position: 'sticky', left: 0 }}>
                      {c.name}
                    </td>
                    {periods.map((p) => {
                      const cell = c.cells[p.importId]
                      const pct = cell ? cell.utilizationPct : null
                      const colors = utilColor(pct)
                      return (
                        <td
                          key={p.importId}
                          title={
                            cell
                              ? `Planned ${cell.plannedHours ?? '–'}h / Capacity ${cell.capacityHours ?? '–'}h — ${colors.label}`
                              : 'no data this period'
                          }
                          style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}`, textAlign: 'center' }}
                        >
                          <span style={{ display: 'inline-block', minWidth: '46px', fontFamily: 'Oswald, sans-serif', fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: colors.bg, color: colors.c }}>
                            {pct !== null ? Math.round(pct) + '%' : '–'}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px 18px' }}>
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13.5px', margin: '0 0 10px' }}>
              Latest period detail — {latestPeriod?.label}
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr>
                  {['Consultant', 'Planned hrs', 'Capacity hrs', 'Utilization'].map((h) => (
                    <th key={h} style={{ background: INK, color: '#fff', fontFamily: 'Oswald, sans-serif', fontWeight: 500, textAlign: 'left', padding: '7px 9px' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consultants
                  .filter((c) => latestPeriod && c.cells[latestPeriod.importId])
                  .sort((a, b) => (b.cells[latestPeriod!.importId].utilizationPct || 0) - (a.cells[latestPeriod!.importId].utilizationPct || 0))
                  .map((c) => {
                    const cell = c.cells[latestPeriod!.importId]
                    const colors = utilColor(cell.utilizationPct)
                    return (
                      <tr key={c.name}>
                        <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}`, fontWeight: 700, color: INK }}>{c.name}</td>
                        <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>{cell.plannedHours ?? <span style={{ color: MUTED }}>n/a</span>}</td>
                        <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>{cell.capacityHours ?? <span style={{ color: MUTED }}>n/a</span>}</td>
                        <td style={{ padding: '6px 9px', borderBottom: `1px solid ${BORDER}` }}>
                          <span style={{ display: 'inline-block', fontFamily: 'Oswald, sans-serif', fontSize: '10px', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '999px', background: colors.bg, color: colors.c }}>
                            {cell.utilizationPct !== null ? Math.round(cell.utilizationPct) + '%' : 'n/a'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
