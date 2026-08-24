import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json()
    const { discussion_id, body: replyBody } = body

    if (!discussion_id) {
      return NextResponse.json({ error: 'discussion_id is required' }, { status: 400 })
    }
    if (!replyBody || !String(replyBody).trim()) {
      return NextResponse.json({ error: 'Reply body is required' }, { status: 400 })
    }

    const discussion = await pool.query('SELECT tenant_id FROM discussions WHERE id = $1', [discussion_id])
    if (discussion.rows.length === 0 || discussion.rows[0].tenant_id !== user.tenantId) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    const result = await pool.query(
      `INSERT INTO discussion_replies (discussion_id, tenant_id, body, author)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [discussion_id, user.tenantId, replyBody, user.name || 'Portal User']
    )

    await pool.query(
      `UPDATE discussions SET reply_count = reply_count + 1 WHERE id = $1`,
      [discussion_id]
    )

    return NextResponse.json({ success: true, reply: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
