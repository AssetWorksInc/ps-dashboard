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
      `SELECT id, project_id, category, name, description, status, due_date, owner, created_at
       FROM deliverables
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [user.tenantId]
    )
    return NextResponse.json({ deliverables: result.rows })
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
    const { category, name, description, status, due_date, owner, project_id } = body

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO deliverables
        (tenant_id, project_id, category, name, description, status, due_date, owner)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        user.tenantId,
        project_id || null,
        category,
        name,
        description || null,
        status || 'not-started',
        due_date || null,
        owner || null,
      ]
    )

    return NextResponse.json({ success: true, deliverable: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
