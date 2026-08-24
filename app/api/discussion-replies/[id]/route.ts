import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (user.role !== 'admin') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    const { id } = await params
    const existing = await pool.query('SELECT tenant_id, discussion_id FROM discussion_replies WHERE id = $1', [id])
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

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
