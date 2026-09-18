import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { parseNetsuiteReportCsv, parseNetsuiteLabel, guessCustomerName } from '@/lib/netsuiteReport'
import type { NetsuiteTaskRow, NetsuiteDashboardRow } from '@/lib/netsuiteReport'

// Step 1 of the NetSuite import: parse the uploaded file and return a preview —
// no database writes happen here. The admin reviews/edits mappings in the UI,
// then POSTs the same rows plus their decisions to /api/admin/netsuite-import/commit.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const form = await req.formData()
    const file = form.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    const text = await file.text()
    const parsed = parseNetsuiteReportCsv(text)
    const parsedRows: (NetsuiteTaskRow | NetsuiteDashboardRow)[] = parsed.reportType === 'dashboard' ? parsed.dashboardRows : parsed.activityRows

    if (parsedRows.length === 0) {
      return NextResponse.json({ error: 'No project rows found in this file' }, { status: 400 })
    }

    // Group rows by their raw NetSuite project label
    const byLabel = new Map<string, typeof parsedRows>()
    for (const row of parsedRows) {
      const list = byLabel.get(row.label) || []
      list.push(row)
      byLabel.set(row.label, list)
    }

    const labels = Array.from(byLabel.keys())

    // Look up any labels already mapped from a previous import
    const existingMaps = await pool.query(
      `SELECT m.netsuite_project_label, m.project_id, p.name AS project_name, p.tenant_id, t.name AS tenant_name
       FROM netsuite_project_map m
       JOIN projects p ON p.id = m.project_id
       JOIN tenants t ON t.id = p.tenant_id
       WHERE m.netsuite_project_label = ANY($1::text[])`,
      [labels]
    )
    const mappedByLabel = new Map(existingMaps.rows.map(r => [r.netsuite_project_label, r]))

    // Fallback match for labels NetSuite has re-worded since the last import: the
    // label text is what netsuite_project_map keys on, but NetSuite's own internal
    // project id (only present on dashboard-format rows) is far more stable than
    // the label text, which can drift (punctuation, re-typed description, etc.)
    // between exports of the very same project. Without this, a re-worded label
    // silently defaults to "create," producing a duplicate project that shares
    // the same internal id as one already on file.
    const internalIdByLabel = new Map<string, string>()
    if (parsed.reportType === 'dashboard') {
      for (const row of parsed.dashboardRows) {
        if (row.internalId && !mappedByLabel.has(row.label) && !internalIdByLabel.has(row.label)) {
          internalIdByLabel.set(row.label, row.internalId)
        }
      }
    }
    const mappedByInternalId = new Map<string, (typeof existingMaps.rows)[number]>()
    if (internalIdByLabel.size > 0) {
      const internalIds = Array.from(new Set(internalIdByLabel.values()))
      const byInternalId = await pool.query(
        `SELECT DISTINCT ON (ndr.internal_id) ndr.internal_id AS netsuite_project_label,
                p.id AS project_id, p.name AS project_name, p.tenant_id, t.name AS tenant_name
         FROM netsuite_dashboard_rows ndr
         JOIN projects p ON p.id = ndr.project_id
         JOIN tenants t ON t.id = p.tenant_id
         WHERE ndr.internal_id = ANY($1::text[])
         ORDER BY ndr.internal_id, ndr.created_at DESC`,
        [internalIds]
      )
      for (const row of byInternalId.rows) mappedByInternalId.set(row.netsuite_project_label, row)
    }

    const tenants = await pool.query(`SELECT id, name FROM tenants ORDER BY name ASC`)
    const existingProjects = await pool.query(
      `SELECT p.id, p.name, t.name AS tenant_name
       FROM projects p JOIN tenants t ON t.id = p.tenant_id
       ORDER BY t.name ASC, p.name ASC`
    )

    const distinctLabels = labels.map(label => {
      const rows = byLabel.get(label)!
      const parsedLabel = rows[0] ? parseNetsuiteLabel(label) : null
      const existing = mappedByLabel.get(label)
      const internalId = internalIdByLabel.get(label)
      const fallback = !existing && internalId ? mappedByInternalId.get(internalId) : undefined
      const resolved = existing || fallback
      return {
        label,
        customerCode: parsedLabel?.customerCode ?? null,
        businessLine: parsedLabel?.businessLine ?? null,
        rest: parsedLabel?.rest ?? label,
        suggestedCustomerName: parsedLabel ? guessCustomerName(parsedLabel.customerCode) : null,
        suggestedProjectName: parsedLabel ? `${guessCustomerName(parsedLabel.customerCode)} — ${parsedLabel.rest}` : label,
        taskCount: rows.length,
        matched: !!resolved,
        matchedByInternalId: !existing && !!fallback,
        existingProjectId: resolved?.project_id ?? null,
        existingProjectName: resolved?.project_name ?? null,
        existingTenantId: resolved?.tenant_id ?? null,
        existingTenantName: resolved?.tenant_name ?? null,
      }
    })

    return NextResponse.json({
      reportType: parsed.reportType,
      reportTitle: parsed.reportTitle,
      filename: (file as File).name || 'netsuite-report.csv',
      totalRows: parsedRows.length,
      skippedRowCount: parsed.skippedRowCount,
      distinctLabels,
      rows: parsedRows,
      tenants: tenants.rows,
      existingProjects: existingProjects.rows,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
