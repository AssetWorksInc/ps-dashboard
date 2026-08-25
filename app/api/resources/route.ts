import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const sessionsQuery = user.role === 'admin'
      ? `SELECT id, title, description, type, video_url, duration_min, presenter, tags, is_published, created_at
         FROM training_sessions
         WHERE tenant_id = $1
         ORDER BY created_at DESC`
      : `SELECT id, title, description, type, video_url, duration_min, presenter, tags, is_published, created_at
         FROM training_sessions
         WHERE tenant_id = $1 AND is_published = true
         ORDER BY created_at DESC`

    const sessions = await pool.query(sessionsQuery, [user.tenantId])
    const materials = await pool.query(
      `SELECT id, title, description, type, file_url, category, author, tags, created_at
       FROM training_materials
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [user.tenantId]
    )

    return NextResponse.json({
      isAdmin: user.role === 'admin',
      sessions: sessions.rows,
      materials: materials.rows,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
