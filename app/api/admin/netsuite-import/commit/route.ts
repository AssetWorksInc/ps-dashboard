import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { findOrCreateTenant } from '@/lib/tenants'
import type { NetsuiteReportType, NetsuiteTaskRow, NetsuiteDashboardRow } from '@/lib/netsuiteReport'

interface Decision {
  label: string
  action: 'existing' | 'create' | 'skip'
  projectId?: string
  tenantId?: string
  newTenantName?: string
  newProjectName?: string
}

// Step 2 of the NetSuite import: takes the rows from the preview step plus the
// admin's per-label decisions, and actually writes to the database. Each import
// replaces the prior NetSuite snapshot for whichever projects it touches (the
// report is a point-in-time export, not incremental data). An Activity Detail
// import also refreshes the project's Budget tab hours from the NetSuite
// rollup; a Dashboard import refreshes the project's Overall Progress % instead.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const body = await req.json()
  const filename: string = body.filename || 'netsuite-report.csv'
  const reportTitle: string | null = body.reportTitle || null
  const reportType: NetsuiteReportType = body.reportType === 'dashboard' ? 'dashboard' : 'activity_detail'
  const rows: (NetsuiteTaskRow | NetsuiteDashboardRow)[] = body.rows || []
  const decisions: Decision[] = body.decisions || []

  if (rows.length === 0 || decisions.length === 0) {
    return NextResponse.json({ error: 'No rows or decisions provided' }, { status: 400 })
  }

  for (const d of decisions) {
    if (d.action === 'create' && !d.tenantId && !d.newTenantName?.trim()) {
      return NextResponse.json(
        { error: `"${d.label}" is set to create a new project but has no customer selected or typed in.` },
        { status: 400 }
      )
    }
    if (d.action === 'existing' && !d.projectId) {
      return NextResponse.json(
        { error: `"${d.label}" is set to link to an existing project but none was chosen.` },
        { status: 400 }
      )
    }
  }

  const rowsByLabel = new Map<string, (NetsuiteTaskRow | NetsuiteDashboardRow)[]>()
  for (const row of rows) {
    const list = rowsByLabel.get(row.label) || []
    list.push(row)
    rowsByLabel.set(row.label, list)
  }

  const client = await pool.connect()
  let created = 0
  let updated = 0
  let skipped = 0
  let totalRowsWritten = 0
  let duplicatesPrevented = 0

  try {
    await client.query('BEGIN')

    const importResult = await client.query(
      `INSERT INTO netsuite_report_imports (filename, report_title, imported_by, row_count)
       VALUES ($1, $2, $3, 0) RETURNING id`,
      [filename, reportTitle, user.name || user.email || 'admin']
    )
    const importId = importResult.rows[0].id

    for (const decision of decisions) {
      if (decision.action === 'skip') {
        skipped++
        continue
      }

      let projectId: string
      let createdThisProject = false

      if (decision.action === 'existing') {
        projectId = decision.projectId!
        updated++
      } else {
        const tenantId = decision.tenantId || (await findOrCreateTenant(decision.newTenantName!.trim()))
        const projectName = decision.newProjectName?.trim() || decision.label

        // Last-line duplicate guard: regardless of how the "create" decision was
        // reached (a stale label match, a re-worded NetSuite export, an admin not
        // recognizing a renamed project), never create a second project with the
        // same name under the same customer -- that is exactly how the
        // Byu — P001 IWMS Implementation Services duplicate happened.
        const dupe = await client.query(
          `SELECT id FROM projects WHERE tenant_id = $1 AND lower(name) = lower($2) LIMIT 1`,
          [tenantId, projectName]
        )
        if (dupe.rows.length > 0) {
          projectId = dupe.rows[0].id
          updated++
          duplicatesPrevented++
        } else {
          const insertResult = await client.query(
            `INSERT INTO projects
              (tenant_id, name, health, status, pct_complete)
             VALUES ($1, $2, 'green', 'active', 0)
             RETURNING id`,
            [tenantId, projectName]
          )
          projectId = insertResult.rows[0].id
          created++
          createdThisProject = true
        }
      }

      await client.query(
        `INSERT INTO netsuite_project_map (netsuite_project_label, project_id, created_by_import_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (netsuite_project_label) DO UPDATE SET project_id = EXCLUDED.project_id`,
        [decision.label, projectId, createdThisProject ? importId : null]
      )

      const labelRows = rowsByLabel.get(decision.label) || []

      if (reportType === 'dashboard') {
        await client.query(`DELETE FROM netsuite_dashboard_rows WHERE project_id = $1`, [projectId])

        for (const row of labelRows as NetsuiteDashboardRow[]) {
          await client.query(
            `INSERT INTO netsuite_dashboard_rows
              (import_id, project_id, netsuite_project_label, prime_resource, secondary_prime_resource,
               internal_id, client_name, pct_complete, contract_signed_date, last_time_entry_date,
               services_backlog, services_revenue)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [
              importId, projectId, decision.label, row.primeResource, row.secondaryPrimeResource,
              row.internalId, row.client, row.pctComplete, row.contractSignedDate, row.lastTimeEntryDate,
              row.servicesBacklog, row.servicesRevenue,
            ]
          )
          totalRowsWritten++
        }

        const rollup = labelRows[0] as NetsuiteDashboardRow | undefined
        if (rollup) {
          // Auto-fill Start Date from the report's Contract Signed Date, but only
          // when the project doesn't already have one set (never overwrite a
          // manually-entered or previously-imported date).
          await client.query(
            `UPDATE projects SET
               pct_complete = COALESCE($1, pct_complete),
               start_date = COALESCE(start_date, $2)
             WHERE id = $3`,
            [rollup.pctComplete != null ? Math.round(rollup.pctComplete) : null, rollup.contractSignedDate, projectId]
          )
        }
      } else {
        await client.query(`DELETE FROM netsuite_task_rows WHERE project_id = $1`, [projectId])

        for (const row of labelRows as NetsuiteTaskRow[]) {
          await client.query(
            `INSERT INTO netsuite_task_rows
              (import_id, project_id, netsuite_project_label, id_number, task_name, task_type,
               planned_hours, gap_hours, activity_budget_amount, activity_budget_currency,
               project_planned_hours, project_worked_hours, project_gap_hours,
               project_billed_hours, project_approved_hours)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
            [
              importId, projectId, decision.label, row.idNumber, row.taskName, row.taskType,
              row.plannedHours, row.gapHours, row.activityBudgetAmount, row.activityBudgetCurrency,
              row.projectPlannedHours, row.projectWorkedHours, row.projectGapHours,
              row.projectBilledHours, row.projectApprovedHours,
            ]
          )
          totalRowsWritten++
        }

        const rollup = labelRows[0] as NetsuiteTaskRow | undefined
        if (rollup) {
          // Only auto-fill Budgeted/Used Hours from NetSuite's own rollup when
          // nobody has manually set Budget Settings for this project -- once a
          // PM saves Budget Settings by hand, budget_manual_override flips true
          // and future imports stop touching these two columns, so a manual
          // entry can never be silently clobbered by the next import.
          await client.query(
            `UPDATE projects SET budget_hours_total = $1, budget_hours_used = $2
             WHERE id = $3 AND budget_manual_override IS NOT TRUE`,
            [rollup.projectPlannedHours, rollup.projectWorkedHours, projectId]
          )
        }

        // Mirror each task with its own NetSuite ID onto a Hours-by-Activity
        // line item, so that table can stay in sync with NetSuite instead of
        // being entirely hand-typed. A task with no NetSuite ID is skipped --
        // there's no safe way to recognize it again on the next import, so it
        // stays visible only in the read-only Delivery Detail task table. A
        // line item already flagged manual_override is left untouched (same
        // override pattern as the rollup above); Worked Hours is never
        // touched here, since NetSuite's Activity Detail Report has no
        // per-task worked-hours figure to draw from -- it's PM-entered
        // either way, imported row or not.
        const projectTenant = await client.query(`SELECT tenant_id FROM projects WHERE id = $1`, [projectId])
        const projectTenantId = projectTenant.rows[0]?.tenant_id
        if (projectTenantId) {
          for (const row of labelRows as NetsuiteTaskRow[]) {
            if (!row.idNumber) continue
            const upd = await client.query(
              `UPDATE budget_line_items
               SET activity_name = COALESCE($1, activity_name), hours_planned = COALESCE($2, hours_planned)
               WHERE project_id = $3 AND netsuite_id_number = $4 AND manual_override IS NOT TRUE`,
              [row.taskName, row.plannedHours, projectId, row.idNumber]
            )
            if (upd.rowCount === 0) {
              const existing = await client.query(
                `SELECT id FROM budget_line_items WHERE project_id = $1 AND netsuite_id_number = $2`,
                [projectId, row.idNumber]
              )
              if (existing.rows.length === 0) {
                await client.query(
                  `INSERT INTO budget_line_items
                    (tenant_id, project_id, activity_name, hours_planned, hours_worked, source, netsuite_id_number, manual_override)
                   VALUES ($1, $2, $3, $4, 0, 'netsuite', $5, false)`,
                  [projectTenantId, projectId, row.taskName || row.label, row.plannedHours, row.idNumber]
                )
              }
            }
          }
        }
      }
    }

    await client.query(`UPDATE netsuite_report_imports SET row_count = $1 WHERE id = $2`, [totalRowsWritten, importId])
    await client.query('COMMIT')

    return NextResponse.json({ success: true, importId, created, updated, skipped, totalRowsWritten, duplicatesPrevented })
  } catch (error) {
    await client.query('ROLLBACK')
    return NextResponse.json({ error: String(error) }, { status: 500 })
  } finally {
    client.release()
  }
}
