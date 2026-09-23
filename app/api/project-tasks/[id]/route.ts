import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activityLog'

const EDITABLE_FIELDS = ['title', 'description', 'status', 'assignee', 'due_date']

// Only admins ever reach these handlers (see the role check below), and an
// admin manages tasks across every customer's projects — so, unlike some of
// the older per-record routes in this codebase, there is no tenant-match
// check here beyond confirming the task actually exists.
async function taskExists(id: string) {
  const existing = await pool.query('SELECT id FROM project_tasks WHERE id = $1', [id])
  return existing.rows.length > 0
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (user.role !== 'admin') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    const { id } = await params
    if (!(await taskExists(id))) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const body = await req.json()
    const updates: string[] = []
    const values: any[] = []
    let i = 1
    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        updates.push(`${field} = $${i}`)
        values.push(body[field])
        i++
      }
    }
    if (updates.length === 0) {
      return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 })
    }
    values.push(id)

    const result = await pool.query(
      `UPDATE project_tasks SET ${updates.join(', ')}, updated_at = now() WHERE id = $${i} RETURNING *`,
      values
    )

    await logActivity({
      tenantId: result.rows[0].tenant_id,
      projectId: result.rows[0].project_id,
      module: 'project_center',
      entityType: 'project_task',
      entityId: result.rows[0].id,
      action: 'updated',
      actorName: user.name,
      actorEmail: user.email,
      summary: result.rows[0].title,
    })

    return NextResponse.json({ success: true, task: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (user.role !== 'admin') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    const { id } = await params
    if (!(await taskExists(id))) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const deleted = await pool.query('DELETE FROM project_tasks WHERE id = $1 RETURNING *', [id])

    await logActivity({
      tenantId: deleted.rows[0]?.tenant_id,
      projectId: deleted.rows[0]?.project_id,
      module: 'project_center',
      entityType: 'project_task',
      entityId: id,
      action: 'deleted',
      actorName: user.name,
      actorEmail: user.email,
      summary: deleted.rows[0]?.title || 'Task',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
