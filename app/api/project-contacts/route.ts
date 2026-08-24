import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (user.role !== 'admin') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    const body = await req.json()
    const { project_id, name, role, email, phone, is_primary } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    const proj = await pool.query('SELECT tenant_id FROM projects WHERE id = $1', [project_id])
    if (proj.rows.length === 0 || proj.rows[0].tenant_id !== user.tenantId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const result = await pool.query(
      `INSERT INTO project_contacts (tenant_id, project_id, name, role, email, phone, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        user.tenantId,
        project_id,
        name,
        role || null,
        email || null,
        phone || null,
        is_primary === true,
      ]
    )

    return NextResponse.json({ success: true, contact: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
