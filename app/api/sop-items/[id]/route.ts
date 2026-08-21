import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const EDITABLE_FIELDS = ['title', 'description', 'status', 'due_date', 'sort_order']

async function assertOwnership(id: string, tenantId: string) {
  const existing = await pool.query('SELECT tenant_id FROM sop_items WHERE id = $1', [id])
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
    if (check === 'not_found') return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
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
    // checked_by / checked_at are never trusted from the client — they're
    // derived server-side from whoever is authenticated when status flips
    // to complete, and cleared whenever it flips away from complete.
    if ('status' in body) {
      if (body.status === 'complete') {
        updates.push(`checked_by = $${i}`)
        values.push(user.name || 'Portal User')
        i++
        updates.push(`checked_at = now()`)
      } else {
        updates.push(`checked_by = NULL`)
        updates.push(`checked_at = NULL`)
      }
    }
    if (updates.length === 0) {
      return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 })
    }
    values.push(id)

    const result = await pool.query(
      `UPDATE sop_items SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    )

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
    if (check === 'not_found') return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
    if (check === 'forbidden') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    await pool.query('DELETE FROM sop_items WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
