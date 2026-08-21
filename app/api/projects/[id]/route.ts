import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const EDITABLE_FIELDS = [
  'name', 'description', 'status', 'health', 'pct_complete', 'pm_name',
  'start_date', 'end_date', 'go_live_date', 'go_live_label',
  'budget_hours_total', 'budget_hours_used', 'hourly_rate', 'budget_status',
]

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { id } = await params
    const existing = await pool.query('SELECT tenant_id FROM projects WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    if (existing.rows[0].tenant_id !== user.tenantId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
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
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    )

    return NextResponse.json({ success: true, project: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
