import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    // Staff only: this reports database row counts and a customer name.
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM projects)       AS projects,
        (SELECT COUNT(*) FROM announcements)  AS announcements,
        (SELECT COUNT(*) FROM milestones)     AS milestones,
        (SELECT name FROM tenants LIMIT 1)    AS tenant`
    )
    return NextResponse.json({
      connected: true,
      data: result.rows[0]
    })
  } catch (error) {
    return NextResponse.json({
      connected: false,
      error: String(error)
    }, { status: 500 })
  }
}
