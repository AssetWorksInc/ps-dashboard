import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const documents = await pool.query(
      `SELECT id, title, description, file_type, category, uploaded_by, created_at
       FROM shared_documents
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [user.tenantId]
    )
    const team = await pool.query(
      `SELECT id, name, role, department, email, phone, is_ps_team
       FROM team_directory
       WHERE tenant_id = $1
       ORDER BY is_ps_team DESC, name ASC`,
      [user.tenantId]
    )
    const discussions = await pool.query(
      `SELECT id, project_id, title, body, category, author, is_pinned, reply_count, created_at
       FROM discussions
       WHERE tenant_id = $1
       ORDER BY is_pinned DESC, created_at DESC`,
      [user.tenantId]
    )
    const discussionReplies = await pool.query(
      `SELECT dr.id, dr.discussion_id, dr.body, dr.author, dr.created_at
       FROM discussion_replies dr
       JOIN discussions d ON d.id = dr.discussion_id
       WHERE dr.tenant_id = $1
       ORDER BY dr.created_at ASC`,
      [user.tenantId]
    )
    const announcements = await pool.query(
      `SELECT id, project_id, title, body, author, is_pinned, created_at
       FROM project_announcements
       WHERE tenant_id = $1
       ORDER BY is_pinned DESC, created_at DESC`,
      [user.tenantId]
    )
    return NextResponse.json({
      isAdmin: user.role === 'admin',
      documents: documents.rows,
      team: team.rows,
      discussions: discussions.rows,
      discussionReplies: discussionReplies.rows,
      announcements: announcements.rows
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
