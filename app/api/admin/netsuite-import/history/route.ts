import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Lists past NetSuite imports (most recent first) so an admin can review what was
// imported and, if needed, delete an import from /projects/netsuite-import.
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    const result = await pool.query(
      `SELECT id, filename, report_title, imported_by, imported_at, row_count
       FROM netsuite_report_imports
       ORDER BY imported_at DESC
       LIMIT 50`
    )
    return NextResponse.json({ imports: result.rows })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
