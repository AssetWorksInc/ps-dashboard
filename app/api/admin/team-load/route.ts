import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const PERIODS_SHOWN = 8

type Cell = { plannedHours: number | null; capacityHours: number | null; utilizationPct: number | null; extra: Record<string, string> }

// Returns the last N imported Team & Load snapshots (periods) plus every
// consultant's row in each, shaped for a heatmap: one column per period,
// one row per consultant. Read-only -- data only changes when an admin
// runs a new import from /management/team-load/import.
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const importsResult = await pool.query(
    `SELECT id, filename, period_label, imported_by, row_count, created_at
     FROM team_load_imports
     ORDER BY created_at DESC
     LIMIT $1`,
    [PERIODS_SHOWN]
  )
  const imports = importsResult.rows.slice().reverse() // oldest -> newest, left to right

  if (imports.length === 0) {
    return NextResponse.json({ periods: [], consultants: [] })
  }

  const importIds = imports.map((r) => r.id)
  const rowsResult = await pool.query(
    `SELECT import_id, consultant_name, planned_hours, capacity_hours, utilization_pct, extra
     FROM team_load_rows
     WHERE import_id = ANY($1::uuid[])
     ORDER BY consultant_name ASC`,
    [importIds]
  )

  const periods = imports.map((r) => ({
    importId: r.id,
    label: r.period_label,
    importedBy: r.imported_by,
    createdAt: r.created_at,
    rowCount: r.row_count,
  }))

  const nameSet = new Set<string>()
  for (const r of rowsResult.rows) nameSet.add(r.consultant_name)
  const consultantNames = Array.from(nameSet).sort((a, b) => a.localeCompare(b))

  const consultants = consultantNames.map((name) => {
    const cells: Record<string, Cell> = {}
    for (const row of rowsResult.rows) {
      if (row.consultant_name !== name) continue
      cells[row.import_id] = {
        plannedHours: row.planned_hours !== null ? Number(row.planned_hours) : null,
        capacityHours: row.capacity_hours !== null ? Number(row.capacity_hours) : null,
        utilizationPct: row.utilization_pct !== null ? Number(row.utilization_pct) : null,
        extra: row.extra || {},
      }
    }
    return { name, cells }
  })

  return NextResponse.json({ periods, consultants })
}
