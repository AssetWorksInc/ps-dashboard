import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json()
    const { title, body: postBody, category, project_id } = body

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
      `INSERT INTO discussions (tenant_id, project_id, title, body, category, author)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        user.tenantId,
        project_id || null,
        title,
        postBody || null,
        category || 'general',
        user.name || 'Portal User',
      ]
    )

    return NextResponse.json({ success: true, discussion: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
