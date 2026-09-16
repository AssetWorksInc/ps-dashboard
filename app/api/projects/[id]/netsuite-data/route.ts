import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Clears just this project's NetSuite data - its task rows, its mapping (so the
// next import for this project starts fresh), and resets the Budget tab's
// NetSuite-synced hours. Unlike deleting an entire import, this only touches
// this one project and leaves the import record (and any other projects it
// touched) alone.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    const { id } = await params
    const existing = await pool.query('SELECT id FROM projects WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const deleted = await client.query('DELETE FROM netsuite_task_rows WHERE project_id = $1', [id])
      await client.query('DELETE FROM netsuite_project_map WHERE project_id = $1', [id])
      await client.query('UPDATE projects SET budget_hours_total = NULL, budget_hours_used = NULL WHERE id = $1', [id])
      await client.query('COMMIT')
      return NextResponse.json({ success: true, rowsCleared: deleted.rowCount || 0 })
    } catch (error) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: String(error) }, { status: 500 })
    } finally {
      client.release()
    }
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
