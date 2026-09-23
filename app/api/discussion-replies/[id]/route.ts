import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activityLog'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (user.role !== 'admin') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    const { id } = await params
    const existing = await pool.query(
      `SELECT dr.tenant_id, dr.discussion_id, dr.body, d.title AS discussion_title, d.project_id
       FROM discussion_replies dr
       JOIN discussions d ON d.id = dr.discussion_id
       WHERE dr.id = $1`,
      [id]
    )
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }
    if (existing.rows[0].tenant_id !== user.tenantId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await pool.query('DELETE FROM discussion_replies WHERE id = $1', [id])
    await pool.query(
      `UPDATE discussions SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = $1`,
      [existing.rows[0].discussion_id]
    )

    const body = existing.rows[0].body || ''
    const preview = body.length > 80 ? `${body.slice(0, 80)}…` : body

    await logActivity({
      tenantId: user.tenantId,
      projectId: existing.rows[0].project_id || null,
      module: 'collaboration_hub',
      entityType: 'discussion_reply',
      entityId: id,
      action: 'deleted',
      actorName: user.name,
      actorEmail: user.email,
      summary: existing.rows[0].discussion_title || 'Discussion',
      detail: preview || null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
