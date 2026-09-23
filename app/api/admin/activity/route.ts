import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Admin-gated read of the activity_log table that Project Center, Portfolio,
// Resource Center, and Collaboration Hub write to as their own saves
// succeed (see lib/activityLog.ts). Supports the filters the Activity page
// needs -- action type, module, a specific project, and free-text search --
// plus simple keyset pagination on created_at for "load older activity".

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || ''
    const moduleFilter = searchParams.get('module') || ''
    const projectId = searchParams.get('project_id') || ''
    const q = searchParams.get('q') || ''
    const before = searchParams.get('before') || ''
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 40, 1), 200)

    const where: string[] = []
    const values: any[] = []
    let i = 1

    if (action) {
      where.push(`al.action = $${i++}`)
      values.push(action)
    }
    if (moduleFilter) {
      where.push(`al.module = $${i++}`)
      values.push(moduleFilter)
    }
    if (projectId) {
      where.push(`al.project_id = $${i++}`)
      values.push(projectId)
    }
    if (q) {
      where.push(`(al.summary ILIKE $${i} OR al.detail ILIKE $${i} OR al.actor_name ILIKE $${i} OR p.name ILIKE $${i})`)
      values.push(`%${q}%`)
      i++
    }
    if (before) {
      where.push(`al.created_at < $${i++}`)
      values.push(before)
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''
    values.push(limit)

    const result = await pool.query(
      `SELECT al.id, al.tenant_id, al.project_id, p.name AS project_name, t.name AS tenant_name,
              al.module, al.entity_type, al.entity_id, al.action,
              al.actor_name, al.actor_email, al.summary, al.detail, al.created_at
       FROM activity_log al
       LEFT JOIN projects p ON p.id = al.project_id
       LEFT JOIN tenants t ON t.id = al.tenant_id
       ${whereClause}
       ORDER BY al.created_at DESC, al.id DESC
       LIMIT $${i}`,
      values
    )

    const counts = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE created_at >= now() - interval '1 day') AS today,
         COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days') AS week,
         COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days' AND action = 'deleted') AS week_deletes
       FROM activity_log`
    )

    return NextResponse.json({ entries: result.rows, counts: counts.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
