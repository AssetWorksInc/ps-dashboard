import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { aggregateTeamLoadRows } from '@/lib/teamLoadReport'
import type { TeamLoadMapping } from '@/lib/teamLoadReport'

// Step 2 of the Team & Load import: takes the rows from the preview step
// plus the admin's confirmed column mapping and period label, aggregates
// rows by consultant (an OpenAir export can list one row per project per
// person), and writes one snapshot row per consultant for this import.
// Each import is a new dated/labeled snapshot appended to history -- not a
// replacement of the prior one -- so the Team & Load page can show a
// multi-period trend rather than only the latest pull.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const body = await req.json()
  const filename: string = body.filename || 'team-load-report.csv'
  const periodLabel: string = (body.periodLabel || '').trim() || new Date().toISOString().slice(0, 10)
  const header: string[] = Array.isArray(body.header) ? body.header : []
  const rows: Record<string, string>[] = Array.isArray(body.rows) ? body.rows : []
  const mapping: TeamLoadMapping = body.mapping || {}

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
  }
  if (!mapping.consultantName) {
    return NextResponse.json({ error: 'Pick which column holds the consultant name before importing.' }, { status: 400 })
  }

  const aggregated = aggregateTeamLoadRows(rows, header, mapping)
  if (aggregated.length === 0) {
    return NextResponse.json({ error: 'No rows had a value in the consultant name column.' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const importResult = await client.query(
      `INSERT INTO team_load_imports (filename, period_label, imported_by, row_count)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [filename, periodLabel, user.name || user.email || 'admin', aggregated.length]
    )
    const importId = importResult.rows[0].id

    for (const row of aggregated) {
      await client.query(
        `INSERT INTO team_load_rows
          (import_id, consultant_name, planned_hours, capacity_hours, utilization_pct, extra)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          importId,
          row.consultantName,
          row.plannedHours,
          row.capacityHours,
          row.utilizationPct,
          JSON.stringify(row.extra || {}),
        ]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      importId,
      periodLabel,
      consultantCount: aggregated.length,
      totalRowsRead: rows.length,
    })
  } catch (error) {
    await client.query('ROLLBACK')
    return NextResponse.json({ error: String(error) }, { status: 500 })
  } finally {
    client.release()
  }
}
