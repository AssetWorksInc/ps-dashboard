'use client'

import { useState } from 'react'
import Link from 'next/link'

const RED = '#A50021'
const INK = '#323E48'
const MUTED = '#6B7780'
const BORDER = '#D8DCDF'

type Mapping = {
  consultantName: string | null
  plannedHours: string | null
  capacityHours: string | null
  utilizationPct: string | null
}

type ParsedFile = {
  filename: string
  header: string[]
  rows: Record<string, string>[]
  suggestedMapping: Mapping
}

const FIELD_META: { key: keyof Mapping; label: string; required?: boolean; hint: string }[] = [
  { key: 'consultantName', label: 'Consultant name', required: true, hint: 'Which column identifies the person' },
  { key: 'plannedHours', label: 'Planned / allocated hours', hint: 'Summed if a person appears on multiple rows' },
  { key: 'capacityHours', label: 'Capacity hours', hint: 'Total hours available for the period' },
  { key: 'utilizationPct', label: 'Utilization %', hint: 'Calculated from planned ÷ capacity if left unmapped' },
]

export default function TeamLoadImportPage() {
  const [parsed, setParsed] = useState<ParsedFile | null>(null)
  const [mapping, setMapping] = useState<Mapping>({ consultantName: null, plannedHours: null, capacityHours: null, utilizationPct: null })
  const [periodLabel, setPeriodLabel] = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ consultantCount: number; totalRowsRead: number; periodLabel: string } | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setResult(null)
    setParsing(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const r = await fetch('/api/admin/team-load-import', { method: 'POST', body: form })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || 'Could not parse that file.')
        setParsed(null)
        return
      }
      setParsed(data)
      setMapping(data.suggestedMapping)
    } catch {
      setError('Could not parse that file.')
    } finally {
      setParsing(false)
    }
  }

  async function handleImport() {
    if (!parsed) return
    if (!mapping.consultantName) {
      setError('Pick which column holds the consultant name before importing.')
      return
    }
    setError(null)
    setImporting(true)
    try {
      const r = await fetch('/api/admin/team-load-import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: parsed.filename,
          periodLabel,
          header: parsed.header,
          rows: parsed.rows,
          mapping,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || 'Import failed.')
        return
      }
      setResult({ consultantCount: data.consultantCount, totalRowsRead: data.totalRowsRead, periodLabel: data.periodLabel })
      setParsed(null)
    } catch {
      setError('Import failed.')
    } finally {
      setImporting(false)
    }
  }

  const selectStyle = { fontSize: '12px', padding: '6px 8px', border: `1px solid ${BORDER}`, borderRadius: '6px', width: '100%' } as const

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', padding: '28px', maxWidth: '980px', margin: '0 auto' }}>
      <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '10.5px', color: RED, marginBottom: '2px' }}>
        Management center · admin only
      </div>
      <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', fontWeight: 600, color: INK, margin: '0 0 4px' }}>Import capacity report</h1>
      <p style={{ fontSize: '12px', color: MUTED, marginTop: 0, marginBottom: '18px' }}>
        Upload whatever export OpenAir gave you. The column layout can vary import to import — map it below before it's saved.{' '}
        <Link href="/management/team-load" style={{ color: '#00538C' }}>← Back to Team &amp; Load</Link>
      </p>

      {error && (
        <div style={{ background: '#F7E2E6', color: RED, borderRadius: '6px', padding: '10px 14px', fontSize: '12.5px', marginBottom: '16px' }}>{error}</div>
      )}

      {result && (
        <div style={{ background: '#E4F0E5', color: '#2E7D32', borderRadius: '6px', padding: '10px 14px', fontSize: '12.5px', marginBottom: '16px' }}>
          Imported {result.consultantCount} consultants ({result.totalRowsRead} rows read) as period "{result.periodLabel}".{' '}
          <Link href="/management/team-load" style={{ color: '#2E7D32', fontWeight: 700 }}>View Team &amp; Load →</Link>
        </div>
      )}

      {!parsed && (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '24px' }}>
          <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.5px', color: MUTED, fontFamily: 'Oswald, sans-serif', marginBottom: '8px' }}>
            CSV file
          </label>
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={parsing}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          {parsing && <p style={{ fontSize: '12px', color: MUTED, marginTop: '10px' }}>Parsing…</p>}
        </div>
      )}

      {parsed && (
        <>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '18px 20px', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13px', margin: '0 0 4px' }}>{parsed.filename}</h2>
            <p style={{ fontSize: '11.5px', color: MUTED, marginTop: 0, marginBottom: '14px' }}>
              {parsed.rows.length} rows · {parsed.header.length} columns detected
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              {FIELD_META.map((f) => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: INK, marginBottom: '3px' }}>
                    {f.label}{f.required && <span style={{ color: RED }}> *</span>}
                  </label>
                  <select
                    value={mapping[f.key] || ''}
                    onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value || null }))}
                    style={selectStyle}
                  >
                    <option value="">— not in this file —</option>
                    {parsed.header.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: '10px', color: MUTED, marginTop: '3px', marginBottom: 0 }}>{f.hint}</p>
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: INK, marginBottom: '3px' }}>Period label</label>
                <input
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  placeholder="e.g. Week of 9/15"
                  style={{ ...selectStyle }}
                />
                <p style={{ fontSize: '10px', color: MUTED, marginTop: '3px', marginBottom: 0 }}>How this snapshot is labeled on the trend view</p>
              </div>
            </div>

            <div style={{ overflowX: 'auto', border: `1px solid ${BORDER}`, borderRadius: '6px', marginBottom: '16px' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '11px', minWidth: '100%' }}>
                <thead>
                  <tr>
                    {parsed.header.map((h) => (
                      <th key={h} style={{ background: INK, color: '#fff', fontFamily: 'Oswald, sans-serif', fontWeight: 500, textAlign: 'left', padding: '6px 8px', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 8).map((row, i) => (
                    <tr key={i}>
                      {parsed.header.map((h) => (
                        <td key={h} style={{ padding: '5px 8px', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.rows.length > 8 && (
                <p style={{ fontSize: '10.5px', color: MUTED, padding: '6px 8px' }}>and {parsed.rows.length - 8} more rows</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleImport}
                disabled={importing || !mapping.consultantName}
                style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', fontWeight: 700, background: RED, color: '#fff', border: `1px solid ${RED}`, borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', opacity: importing || !mapping.consultantName ? 0.6 : 1 }}
              >
                {importing ? 'Importing…' : `Import ${parsed.rows.length} rows`}
              </button>
              <button
                onClick={() => { setParsed(null); setError(null) }}
                style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', fontWeight: 700, background: '#fff', color: MUTED, border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}
              >
                Start over
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
