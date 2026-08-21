import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const result = await pool.query(
      `SELECT id, project_id, title, description, start_date, due_date, status, owner, pct_complete, sort_order
       FROM milestones
       WHERE tenant_id = $1
       ORDER BY sort_order ASC, due_date ASC`,
      [user.tenantId]
    )
    return NextResponse.json({ milestones: result.rows })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title, description, start_date, due_date,
      status, owner, pct_complete, sort_order, project_id,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO milestones
        (tenant_id, project_id, title, description, start_date, due_date, status, owner, pct_complete, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        user.tenantId,
        project_id || null,
        title,
        description || null,
        start_date || null,
        due_date || null,
        status || 'upcoming',
        owner || null,
        pct_complete || 0,
        sort_order || 0,
      ]
    )

    return NextResponse.json({ success: true, milestone: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
