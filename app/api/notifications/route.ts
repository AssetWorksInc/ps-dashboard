import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantSlug = searchParams.get('tenantSlug') || 'lakewood'

    const tenantResult = await pool.query(
      'SELECT id FROM tenants WHERE slug = $1',
      [tenantSlug]
    )

    if (tenantResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 })
    }

    const tenantId = tenantResult.rows[0].id

    const [activityResult, announcementsResult] = await Promise.all([
      pool.query(
        `SELECT id, actor, action, target, icon, created_at
         FROM activity_feed
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [tenantId]
      ),
      pool.query(
        `SELECT id, title, body, priority, is_pinned, author, expires_at, created_at
         FROM announcements
         WHERE tenant_id = $1
           AND (expires_at IS NULL OR expires_at > now())
         ORDER BY is_pinned DESC, created_at DESC
         LIMIT 20`,
        [tenantId]
      ),
    ])

    const activity = activityResult.rows.map((row) => ({
      type: 'activity' as const,
      id: row.id,
      icon: row.icon || '📌',
      title: `${row.actor} ${row.action}${row.target ? ` — ${row.target}` : ''}`,
      subtitle: null as string | null,
      createdAt: row.created_at,
    }))

    const announcements = announcementsResult.rows.map((row) => ({
      type: 'announcement' as const,
      id: row.id,
      icon: row.priority === 'high' ? '🚨' : row.is_pinned ? '📌' : '📢',
      title: row.title,
      subtitle: row.body as string | null,
      createdAt: row.created_at,
    }))

    const combined = [...activity, ...announcements].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({ success: true, notifications: combined })
  } catch (error) {
    console.error('Notifications error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
