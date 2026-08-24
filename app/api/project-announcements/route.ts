import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (user.role !== 'admin') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    const body = await req.json()
    const { title, body: postBody, is_pinned, project_id } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (project_id) {
      const proj = await pool.query('SELECT tenant_id FROM projects WHERE id = $1', [project_id])
      if (proj.rows.length === 0 || proj.rows[0].tenant_id !== user.tenantId) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
    }

    const result = await pool.query(
      `INSERT INTO project_announcements (tenant_id, project_id, title, body, author, is_pinned)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        user.tenantId,
        project_id || null,
        title,
        postBody || null,
        user.name || 'Portal User',
        is_pinned === true,
      ]
    )

    return NextResponse.json({ success: true, announcement: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
