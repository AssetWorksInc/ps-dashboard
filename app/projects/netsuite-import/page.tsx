'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type DistinctLabel = {
  label: string
  customerCode: string | null
  businessLine: string | null
  rest: string
  suggestedCustomerName: string | null
  suggestedProjectName: string
  taskCount: number
  matched: boolean
  existingProjectId: string | null
  existingProjectName: string | null
  existingTenantId: string | null
  existingTenantName: string | null
}

type ExistingProject = { id: string; name: string; tenant_name: string }
type Tenant = { id: string; name: string }

type Preview = {
  reportType: string
  reportTitle: string | null
  filename: string
  totalRows: number
  skippedRowCount: number
  distinctLabels: DistinctLabel[]
  rows: any[]
  tenants: Tenant[]
  existingProjects: ExistingProject[]
}

type Mode = 'update' | 'create' | 'link' | 'skip'
type RowDecision = {
  mode: Mode
  customerName: string
  projectName: string
  linkedProjectId: string
}

type ImportRecord = {
  id: string
  filename: string
  report_title: string | null
  imported_by: string | null
  imported_at: string
  row_count: number
}

const inputStyle: React.CSSProperties = {
  fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px', width: '100%',
}
const selectStyle: React.CSSProperties = {
  fontSize: '11.5px', padding: '5px 8px', border: '1px solid #dfe3e6', borderRadius: '5px', color: '#323E48', background: '#fff',
}

function matchesCustomerFilter(l: DistinctLabel, filter: string): boolean {
  const f = filter.trim().toLowerCase()
  if (!f) return true
  return (
    (l.customerCode || '').toLowerCase().includes(f) ||
    (l.suggestedCustomerName || '').toLowerCase().includes(f) ||
    (l.existingTenantName || '').toLowerCase().includes(f) ||
    l.label.toLowerCase().includes(f)
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export default function NetsuiteImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [decisions, setDecisions] = useState<Record<string, RowDecision>>({})
  const [customerFilter, setCustomerFilter] = useState('')
  const [committing, setCommitting] = useState(false)
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number; totalRowsWritten: number } | null>(null)

  const [history, setHistory] = useState<ImportRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyNotice, setHistoryNotice] = useState<string | null>(null)

  // Show the Import history section any time the review table (Step 2) isn't the
  // thing on screen - i.e. before uploading, and again once an import completes.
  const showHistory = !preview || !!result

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/admin/netsuite-import/history')
      const data = await res.json()
      if (res.ok) setHistory(data.imports || [])
    } catch {
      // Non-critical - the history list just stays empty/stale.
    } finally {
      setHistoryLoading(false)
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds(prev => (prev.size === history.length ? new Set() : new Set(history.map(h => h.id))))
  }

  function summarizeDeleteCounts(deleted: number, cleared: number, kept: number, failed: number): string {
    const parts: string[] = []
    if (deleted) parts.push(`${deleted} project${deleted !== 1 ? 's' : ''} removed`)
    if (cleared) parts.push(`${cleared} project${cleared !== 1 ? 's' : ''} cleared`)
    if (kept) parts.push(`${kept} project${kept !== 1 ? 's' : ''} kept (already has other Portal data)`)
    if (failed) parts.push(`${failed} import${failed !== 1 ? 's' : ''} failed to delete`)
    return parts.join(', ')
  }

  async function deleteImport(imp: ImportRecord) {
    const label = imp.report_title || imp.filename
    const ok = window.confirm(
      `Delete this import ("${label}", ${formatDate(imp.imported_at)})?\n\n` +
      `Projects this import created will be removed. Projects that already existed will just have this import's NetSuite data cleared, not the project itself.\n\n` +
      `This cannot be undone.`
    )
    if (!ok) return

    setDeletingId(imp.id)
    setHistoryError(null)
    setHistoryNotice(null)
    try {
      const res = await fetch(`/api/admin/netsuite-import/${imp.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setHistoryError(data.error || 'Could not delete this import.')
        return
      }
      setHistory(prev => prev.filter(h => h.id !== imp.id))
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(imp.id)
        return next
      })
      const summary = summarizeDeleteCounts(data.projectsDeleted || 0, data.projectsCleared || 0, data.projectsKept || 0, 0)
      setHistoryNotice(summary ? `Import deleted — ${summary}.` : 'Import deleted.')
    } catch (e) {
      setHistoryError(String(e))
    } finally {
      setDeletingId(null)
    }
  }

  async function deleteSelected() {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    const ok = window.confirm(
      `Delete ${ids.length} selected import${ids.length !== 1 ? 's' : ''}?\n\n` +
      `Projects they created will be removed. Projects that already existed will just have that data cleared, not the projects themselves.\n\n` +
      `This cannot be undone.`
    )
    if (!ok) return

    setBulkDeleting(true)
    setHistoryError(null)
    setHistoryNotice(null)
    let totalDeleted = 0, totalCleared = 0, totalKept = 0, failed = 0
    for (const id of ids) {
      try {
        const res = await fetch(`/api/admin/netsuite-import/${id}`, { method: 'DELETE' })
        const data = await res.json()
        if (!res.ok) {
          failed++
          continue
        }
        totalDeleted += data.projectsDeleted || 0
        totalCleared += data.projectsCleared || 0
        totalKept += data.projectsKept || 0
        setHistory(prev => prev.filter(h => h.id !== id))
      } catch {
        failed++
      }
    }
    setSelectedIds(new Set())
    const doneCount = ids.length - failed
    const summary = summarizeDeleteCounts(totalDeleted, totalCleared, totalKept, failed)
    setHistoryNotice(
      summary
        ? `Deleted ${doneCount} of ${ids.length} import${ids.length !== 1 ? 's' : ''} — ${summary}.`
        : `Deleted ${doneCount} of ${ids.length} import${ids.length !== 1 ? 's' : ''}.`
    )
    setBulkDeleting(false)
  }

  async function analyze() {
    if (!file) return
    setAnalyzing(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/netsuite-import', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not read this file.')
        return
      }
      setPreview(data)
      setCustomerFilter('')
      const initial: Record<string, RowDecision> = {}
      for (const l of data.distinctLabels as DistinctLabel[]) {
        initial[l.label] = {
          mode: l.matched ? 'update' : 'create',
          customerName: l.suggestedCustomerName || '',
          projectName: l.matched ? (l.existingProjectName || '') : l.suggestedProjectName,
          linkedProjectId: l.existingProjectId || '',
        }
      }
      setDecisions(initial)
    } catch (e) {
      setError(String(e))
    } finally {
      setAnalyzing(false)
    }
  }

  function updateDecision(label: string, patch: Partial<RowDecision>) {
    setDecisions(prev => ({ ...prev, [label]: { ...prev[label], ...patch } }))
  }

  function skipEverythingNotShown() {
    if (!preview) return
    setDecisions(prev => {
      const next = { ...prev }
      for (const l of preview.distinctLabels) {
        if (!matchesCustomerFilter(l, customerFilter)) {
          next[l.label] = { ...next[l.label], mode: 'skip' }
        }
      }
      return next
    })
  }

  function setModeForVisible(checked: boolean) {
    if (!preview) return
    setDecisions(prev => {
      const next = { ...prev }
      for (const l of preview.distinctLabels) {
        if (matchesCustomerFilter(l, customerFilter)) {
          next[l.label] = { ...next[l.label], mode: checked ? (l.matched ? 'update' : 'create') : 'skip' }
        }
      }
      return next
    })
  }

  async function confirmImport() {
    if (!preview) return
    setCommitting(true)
    setError(null)
    try {
      const payloadDecisions = preview.distinctLabels.map(l => {
        const d = decisions[l.label]
        if (d.mode === 'skip') return { label: l.label, action: 'skip' as const }
        if (d.mode === 'update') return { label: l.label, action: 'existing' as const, projectId: l.existingProjectId }
        if (d.mode === 'link') return { label: l.label, action: 'existing' as const, projectId: d.linkedProjectId }
        return { label: l.label, action: 'create' as const, newTenantName: d.customerName, newProjectName: d.projectName }
      })
      const res = await fetch('/api/admin/netsuite-import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: preview.filename,
          reportTitle: preview.reportTitle,
          reportType: preview.reportType,
          rows: preview.rows,
          decisions: payloadDecisions,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Import failed.')
        return
      }
      setResult(data)
      loadHistory()
    } catch (e) {
      setError(String(e))
    } finally {
      setCommitting(false)
    }
  }

  const matchedCount = preview?.distinctLabels.filter(l => l.matched).length || 0
  const newCount = preview ? preview.distinctLabels.length - matchedCount : 0
  const visibleLabels = preview ? preview.distinctLabels.filter(l => matchesCustomerFilter(l, customerFilter)) : []
  const hiddenCount = preview ? preview.distinctLabels.length - visibleLabels.length : 0
  const activeCount = preview ? preview.distinctLabels.filter(l => decisions[l.label]?.mode !== 'skip').length : 0

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', padding: '28px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '18px' }}>
        <Link href="/projects" style={{ fontSize: '12px', color: '#00538C', textDecoration: 'none' }}>← Back to Project Center</Link>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', fontWeight: 600, color: '#323E48', margin: 0 }}>
          Import NetSuite Report
        </h1>
        <p style={{ fontSize: '12px', color: '#697077', marginTop: '4px' }}>
          SuiteProjects Pro · Activity detail report (e.g. "Project Tasks with GAP")
        </p>
      </div>

      {error && (
        <div style={{ background: '#FDEEE9', border: '1px solid #f0c3b8', color: '#8E1537', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {!preview && (
        <div style={{ background: '#fff', border: '1px solid #CCCCCC', borderRadius: '8px', padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '15px', fontWeight: 600, color: '#323E48', margin: '0 0 4px' }}>
            Step 1 — Upload the export
          </h2>
          <p style={{ fontSize: '12px', color: '#8a9199', margin: '0 0 16px' }}>
            Export the report from SuiteProjects Pro to CSV, then upload it here. Nothing is saved until you confirm on the next screen.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={e => setFile(e.target.files?.[0] || null)}
            style={{ fontSize: '12px', marginBottom: '16px', display: 'block' }}
          />
          <button
            onClick={analyze}
            disabled={!file || analyzing}
            style={{
              padding: '9px 20px', background: (!file || analyzing) ? '#C9CFD4' : '#A50021', color: '#fff',
              border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 700,
              cursor: (!file || analyzing) ? 'default' : 'pointer', fontFamily: 'Oswald, sans-serif',
            }}
          >
            {analyzing ? 'Analyzing…' : 'Analyze File'}
          </button>
        </div>
      )}

      {preview && !result && (
        <div style={{ background: '#fff', border: '1px solid #CCCCCC', borderRadius: '8px', padding: '24px' }}>
          <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '15px', fontWeight: 600, color: '#323E48', margin: '0 0 4px' }}>
            Step 2 — Review &amp; map ({preview.distinctLabels.length} projects found)
          </h2>
          <p style={{ fontSize: '12px', color: '#8a9199', margin: '0 0 4px' }}>
            {matchedCount} already match a Portal project and will refresh with these numbers. {newCount} are new — choose an action for each.
          </p>
          <p style={{ fontSize: '11px', color: '#aab0b5', margin: '0 0 16px' }}>
            {preview.totalRows} task rows total · {preview.skippedRowCount} row(s) skipped (report totals / footer)
          </p>

          <div style={{
            display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
            background: '#F4F5F6', border: '1px solid #EAECEE', borderRadius: '6px', padding: '10px 12px', marginBottom: '16px',
          }}>
            <input
              type="text"
              placeholder="Filter by customer name or code…"
              value={customerFilter}
              onChange={e => setCustomerFilter(e.target.value)}
              style={{ fontSize: '12px', padding: '7px 10px', border: '1px solid #CCCCCC', borderRadius: '5px', minWidth: '240px' }}
            />
            {customerFilter.trim() !== '' && (
              <button
                type="button"
                onClick={skipEverythingNotShown}
                style={{ padding: '7px 12px', background: '#fff', color: '#8E1537', border: '1px solid #f0c3b8', borderRadius: '5px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                Skip all customers not shown ({hiddenCount})
              </button>
            )}
            <span style={{ fontSize: '11px', color: '#aab0b5' }}>
              Showing {visibleLabels.length} of {preview.distinctLabels.length}
              {customerFilter.trim() !== '' ? ` · matching "${customerFilter.trim()}"` : ''}
            </span>
          </div>

          <datalist id="tenant-options">
            {preview.tenants.map(t => <option key={t.id} value={t.name} />)}
          </datalist>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ background: '#323E48', color: '#fff', padding: '9px 10px', width: '34px' }}>
                    <input
                      type="checkbox"
                      checked={visibleLabels.length > 0 && visibleLabels.every(l => decisions[l.label]?.mode !== 'skip')}
                      onChange={e => setModeForVisible(e.target.checked)}
                      title="Select all shown"
                    />
                  </th>
                  {['NetSuite project', 'Tasks', 'Status', 'Action', 'Customer', 'Project name'].map(h => (
                    <th key={h} style={{
                      background: '#323E48', color: '#fff', fontFamily: 'Oswald, sans-serif', fontWeight: 600,
                      fontSize: '10.5px', letterSpacing: '0.4px', textTransform: 'uppercase', textAlign: 'left', padding: '9px 10px',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleLabels.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '20px 10px', textAlign: 'center', color: '#aab0b5' }}>
                      No projects match "{customerFilter.trim()}".
                    </td>
                  </tr>
                )}
                {visibleLabels.map(l => {
                  const d = decisions[l.label]
                  if (!d) return null
                  return (
                    <tr key={l.label} style={d.mode === 'skip' ? { opacity: 0.5 } : undefined}>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #edeff0' }}>
                        <input
                          type="checkbox"
                          checked={d.mode !== 'skip'}
                          onChange={e => updateDecision(l.label, { mode: e.target.checked ? (l.matched ? 'update' : 'create') : 'skip' })}
                        />
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #edeff0' }}>
                        <div style={{ fontWeight: 700, color: '#323E48' }}>{l.customerCode || l.label}</div>
                        <div style={{ fontSize: '11px', color: '#8a9199' }}>{l.rest}</div>
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #edeff0' }}>{l.taskCount}</td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #edeff0' }}>
                        <span style={{
                          padding: '3px 9px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 600,
                          background: l.matched ? '#e5f3ea' : '#fdeee9', color: l.matched ? '#1e7d46' : '#8E1537',
                        }}>
                          {l.matched ? `Matched → ${l.existingTenantName}` : 'New'}
                        </span>
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #edeff0' }}>
                        <select
                          style={selectStyle}
                          value={d.mode}
                          onChange={e => updateDecision(l.label, { mode: e.target.value as Mode })}
                        >
                          {l.matched && <option value="update">Update existing project</option>}
                          {!l.matched && <option value="create">Create new project</option>}
                          <option value="link">Link to existing project…</option>
                          <option value="skip">Skip this project</option>
                        </select>
                        {d.mode === 'link' && (
                          <select
                            style={{ ...selectStyle, marginTop: '6px', width: '100%' }}
                            value={d.linkedProjectId}
                            onChange={e => updateDecision(l.label, { linkedProjectId: e.target.value })}
                          >
                            <option value="">Choose a project…</option>
                            {preview.existingProjects.map(p => (
                              <option key={p.id} value={p.id}>{p.tenant_name} — {p.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #edeff0' }}>
                        {d.mode === 'create' ? (
                          <input
                            list="tenant-options"
                            style={inputStyle}
                            value={d.customerName}
                            onChange={e => updateDecision(l.label, { customerName: e.target.value })}
                            placeholder="Customer name"
                          />
                        ) : (
                          <span style={{ color: '#aab0b5' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #edeff0' }}>
                        {d.mode === 'create' ? (
                          <input
                            style={inputStyle}
                            value={d.projectName}
                            onChange={e => updateDecision(l.label, { projectName: e.target.value })}
                            placeholder="Project name"
                          />
                        ) : (
                          <span style={{ color: '#aab0b5' }}>{d.mode === 'update' ? l.existingProjectName : '—'}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
            <button
              onClick={() => { setPreview(null); setFile(null) }}
              style={{ padding: '9px 20px', background: '#fff', color: '#323E48', border: '1px solid #dfe3e6', borderRadius: '6px', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer' }}
            >
              Back
            </button>
            <button
              onClick={confirmImport}
              disabled={committing || activeCount === 0}
              style={{
                padding: '9px 20px', background: (committing || activeCount === 0) ? '#C9CFD4' : '#A50021', color: '#fff',
                border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 700,
                cursor: (committing || activeCount === 0) ? 'default' : 'pointer', fontFamily: 'Oswald, sans-serif',
              }}
            >
              {committing ? 'Importing…' : `Confirm & Import ${activeCount} Project${activeCount !== 1 ? 's' : ''} →`}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div style={{ background: '#fff', border: '1px solid #CCCCCC', borderRadius: '8px', padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '15px', fontWeight: 600, color: '#1e7d46', margin: '0 0 12px' }}>
            Import complete
          </h2>
          <p style={{ fontSize: '13px', color: '#323E48', marginBottom: '4px' }}>{result.created} new project{result.created !== 1 ? 's' : ''} created</p>
          <p style={{ fontSize: '13px', color: '#323E48', marginBottom: '4px' }}>{result.updated} existing project{result.updated !== 1 ? 's' : ''} refreshed</p>
          <p style={{ fontSize: '13px', color: '#323E48', marginBottom: '4px' }}>{result.skipped} skipped</p>
          <p style={{ fontSize: '13px', color: '#323E48', marginBottom: '16px' }}>{result.totalRowsWritten} task rows written</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/projects" style={{
              display: 'inline-block', padding: '9px 20px', background: '#A50021', color: '#fff',
              borderRadius: '6px', fontSize: '12.5px', fontWeight: 700, textDecoration: 'none', fontFamily: 'Oswald, sans-serif',
            }}>
              Go to Project Center →
            </Link>
            <button
              onClick={() => { setResult(null); setPreview(null); setFile(null) }}
              style={{ padding: '9px 20px', background: '#fff', color: '#323E48', border: '1px solid #dfe3e6', borderRadius: '6px', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer' }}
            >
              Import another file
            </button>
          </div>
        </div>
      )}

      {showHistory && (
        <div style={{ background: '#fff', border: '1px solid #CCCCCC', borderRadius: '8px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '15px', fontWeight: 600, color: '#323E48', margin: 0 }}>
              Import history
            </h2>
            {selectedIds.size > 0 && (
              <button
                onClick={deleteSelected}
                disabled={bulkDeleting}
                style={{
                  padding: '6px 14px', background: bulkDeleting ? '#C9CFD4' : '#8E1537', color: '#fff', border: 'none', borderRadius: '5px',
                  fontSize: '11.5px', fontWeight: 700, cursor: bulkDeleting ? 'default' : 'pointer', fontFamily: 'Oswald, sans-serif',
                }}
              >
                {bulkDeleting ? 'Deleting…' : `Delete selected (${selectedIds.size})`}
              </button>
            )}
          </div>
          <p style={{ fontSize: '12px', color: '#8a9199', margin: '0 0 16px' }}>
            Imported the wrong file, or don't need it anymore? Select one or more rows and delete them. Projects an import created are removed; projects it only refreshed are just cleared of that data.
          </p>

          {historyError && (
            <div style={{ background: '#FDEEE9', border: '1px solid #f0c3b8', color: '#8E1537', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', marginBottom: '14px' }}>
              {historyError}
            </div>
          )}
          {historyNotice && (
            <div style={{ background: '#e5f3ea', border: '1px solid #cdeadb', color: '#1e7d46', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', marginBottom: '14px' }}>
              {historyNotice}
            </div>
          )}

          {historyLoading ? (
            <p style={{ fontSize: '12px', color: '#aab0b5' }}>Loading…</p>
          ) : history.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#aab0b5' }}>No imports yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{
                      background: '#F4F5F6', padding: '8px 10px', borderBottom: '1px solid #EAECEE', width: '32px',
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === history.length && history.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    {['File', 'Imported', 'By', 'Task rows', ''].map(h => (
                      <th key={h} style={{
                        background: '#F4F5F6', color: '#697077', fontFamily: 'Oswald, sans-serif', fontWeight: 600,
                        fontSize: '10.5px', letterSpacing: '0.4px', textTransform: 'uppercase', textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #EAECEE',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(imp => (
                    <tr key={imp.id} style={selectedIds.has(imp.id) ? { background: '#FBE7EA' } : undefined}>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #edeff0' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(imp.id)}
                          onChange={() => toggleSelect(imp.id)}
                        />
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #edeff0', color: '#323E48' }}>
                        {imp.report_title || imp.filename}
                      </td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #edeff0', color: '#697077' }}>{formatDate(imp.imported_at)}</td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #edeff0', color: '#697077' }}>{imp.imported_by || '—'}</td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #edeff0', color: '#697077' }}>{imp.row_count}</td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #edeff0', textAlign: 'right' }}>
                        <button
                          onClick={() => deleteImport(imp)}
                          disabled={deletingId === imp.id || bulkDeleting}
                          style={{
                            padding: '5px 12px', background: '#fff', color: '#8E1537', border: '1px solid #f0c3b8', borderRadius: '5px',
                            fontSize: '11px', fontWeight: 700, cursor: (deletingId === imp.id || bulkDeleting) ? 'default' : 'pointer',
                            opacity: (deletingId === imp.id || bulkDeleting) ? 0.6 : 1,
                          }}
                        >
                          {deletingId === imp.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
