import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

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
    const { project_id, title, description, assignee, due_date, status } = body

    if (!project_id || !title || !String(title).trim()) {
      return NextResponse.json({ error: 'project_id and title are required' }, { status: 400 })
    }

    // Tasks are scoped to the project's own tenant, not the creating admin's —
    // an admin managing many customers' engagements must not accidentally tag
    // a task with their own tenant instead of the customer's.
    const proj = await pool.query('SELECT tenant_id FROM projects WHERE id = $1', [project_id])
    if (proj.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    const tenantId = proj.rows[0].tenant_id

    const result = await pool.query(
      `INSERT INTO project_tasks
        (tenant_id, project_id, title, description, status, assignee, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        tenantId,
        project_id,
        title,
        description || null,
        status || 'todo',
        assignee || null,
        due_date || null,
      ]
    )

    return NextResponse.json({ success: true, task: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
