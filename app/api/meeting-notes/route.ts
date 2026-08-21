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
      `SELECT id, project_id, title, body, risks_decisions, meeting_date, attendees, action_items, author, created_at
       FROM meeting_notes
       WHERE tenant_id = $1
       ORDER BY meeting_date DESC NULLS LAST, created_at DESC`,
      [user.tenantId]
    )
    return NextResponse.json({ notes: result.rows })
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
      title, body: statusUpdate, risks_decisions, meeting_date,
      attendees, action_items, project_id,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO meeting_notes
        (tenant_id, project_id, title, body, risks_decisions, meeting_date, attendees, action_items, author)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        user.tenantId,
        project_id || null,
        title,
        statusUpdate || null,
        risks_decisions || null,
        meeting_date || null,
        Array.isArray(attendees) ? attendees : [],
        Array.isArray(action_items) ? action_items : [],
        user.name || 'Portal User',
      ]
    )

    return NextResponse.json({ success: true, note: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
