import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activityLog'

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { id, health, status, start_date, end_date } = await req.json()
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 })
    }

    // Customers can edit their own project's Health/Status/dates from the
    // Overview tab's "Update Project" panel (an intentional exception to the
    // admin-only rule most other project fields follow — see the 9/9
    // changelog entry), but only for a project under their own tenant.
    // Admins can edit any project. Checked here rather than trusted from the
    // client, since `id` is just a value in the request body.
    if (user.role !== 'admin') {
      const owned = await pool.query('SELECT id FROM projects WHERE id = $1 AND tenant_id = $2', [id, user.tenantId])
      if (owned.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
      }
    }

    const updated = await pool.query(
      `UPDATE projects
       SET health = COALESCE($1, health),
           status = COALESCE($2, status),
           start_date = COALESCE($3, start_date),
           end_date = COALESCE($4, end_date)
       WHERE id = $5
       RETURNING tenant_id, name, start_date, end_date`,
      [health, status, start_date || null, end_date || null, id]
    )

    const proj = updated.rows[0]

    await logActivity({
      tenantId: proj?.tenant_id,
      projectId: id,
      module: 'project_center',
      entityType: 'project',
      entityId: id,
      action: 'updated',
      actorName: user.name,
      actorEmail: user.email,
      summary: proj?.name || 'Project',
      detail: [
        health ? `Health: ${health}` : null,
        status ? `Status: ${status}` : null,
      ].filter(Boolean).join(' · ') || null,
    })

    // Auto-create a real "Project Timeline" milestone the first time both
    // dates are set on a project that has no milestones yet, so the
    // Dashboard's Implementation Timeline has something real to show.
    if (proj && proj.start_date && proj.end_date) {
      const existing = await pool.query(
        'SELECT COUNT(*) FROM milestones WHERE project_id = $1',
        [id]
      )
      if (Number(existing.rows[0].count) === 0) {
        const milestone = await pool.query(
          `INSERT INTO milestones
            (tenant_id, project_id, title, start_date, due_date, status, owner, pct_complete, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [proj.tenant_id, id, 'Project Timeline', proj.start_date, proj.end_date, 'active', null, 0, 0]
        )

        await logActivity({
          tenantId: proj.tenant_id,
          projectId: id,
          module: 'project_center',
          entityType: 'milestone',
          entityId: milestone.rows[0].id,
          action: 'created',
          actorName: user.name,
          actorEmail: user.email,
          summary: milestone.rows[0].title,
          detail: 'Auto-created from project start/end dates',
        })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
