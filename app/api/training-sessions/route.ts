import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activityLog'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, type, video_url, duration_min, presenter, tags, is_published } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO training_sessions
        (tenant_id, title, description, type, video_url, duration_min, presenter, tags, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, title, description, type, video_url, duration_min, presenter, tags, is_published, created_at`,
      [
        user.tenantId,
        title,
        description || null,
        type || 'recorded',
        video_url || null,
        duration_min !== undefined && duration_min !== null && duration_min !== '' ? Number(duration_min) : null,
        presenter || null,
        Array.isArray(tags) ? tags : null,
        is_published !== undefined ? !!is_published : true,
      ]
    )

    const session = result.rows[0]

    await logActivity({
      tenantId: user.tenantId,
      projectId: null,
      module: 'resource_center',
      entityType: 'training_session',
      entityId: session.id,
      action: 'created',
      actorName: user.name,
      actorEmail: user.email,
      summary: session.title,
      detail: session.presenter || null,
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
