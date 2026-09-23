import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activityLog'

const EDITABLE_FIELDS = ['activity_name', 'hours_planned', 'hours_worked', 'sort_order', 'manual_override']

async function assertOwnership(id: string, tenantId: string) {
  const existing = await pool.query('SELECT tenant_id FROM budget_line_items WHERE id = $1', [id])
  if (existing.rows.length === 0) return 'not_found'
  if (existing.rows[0].tenant_id !== tenantId) return 'forbidden'
  return 'ok'
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (user.role !== 'admin') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    const { id } = await params
    const check = await assertOwnership(id, user.tenantId)
    if (check === 'not_found') return NextResponse.json({ error: 'Line item not found' }, { status: 404 })
    if (check === 'forbidden') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

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
      `UPDATE budget_line_items SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    )

    await logActivity({
      tenantId: user.tenantId,
      projectId: result.rows[0].project_id,
      module: 'project_center',
      entityType: 'budget_line_item',
      entityId: result.rows[0].id,
      action: 'updated',
      actorName: user.name,
      actorEmail: user.email,
      summary: result.rows[0].activity_name,
    })

    return NextResponse.json({ success: true, item: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (user.role !== 'admin') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    const { id } = await params
    const check = await assertOwnership(id, user.tenantId)
    if (check === 'not_found') return NextResponse.json({ error: 'Line item not found' }, { status: 404 })
    if (check === 'forbidden') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    const deleted = await pool.query('DELETE FROM budget_line_items WHERE id = $1 RETURNING *', [id])

    await logActivity({
      tenantId: user.tenantId,
      projectId: deleted.rows[0]?.project_id,
      module: 'project_center',
      entityType: 'budget_line_item',
      entityId: id,
      action: 'deleted',
      actorName: user.name,
      actorEmail: user.email,
      summary: deleted.rows[0]?.activity_name || 'Budget line item',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
