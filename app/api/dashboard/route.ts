import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Mirrors /api/projects: admins (PS staff) see every tenant's data,
    // customers stay scoped to their own tenant only.
    const isAdmin = user.role === 'admin'
    const scope = isAdmin ? '' : 'WHERE tenant_id = $1'
    const params = isAdmin ? [] : [user.tenantId]

    const projects = await pool.query(
      `SELECT id, name, description, health, pct_complete, pm_name, start_date, end_date,
              go_live_date, go_live_label, budget_hours_total, budget_hours_used, hourly_rate, budget_status
       FROM projects
       ${scope}
       ORDER BY created_at DESC`,
      params
    )
    const announcements = await pool.query(
      `SELECT id, project_id, title, body, author, is_pinned, created_at
       FROM project_announcements
       ${scope}
       ORDER BY is_pinned DESC, created_at DESC`,
      params
    )
    const milestones = await pool.query(
      `SELECT id, project_id, title, description, start_date, due_date, status, owner, pct_complete, sort_order
       FROM milestones
       ${scope}
       ORDER BY sort_order ASC, due_date ASC`,
      params
    )
    const deliverables = await pool.query(
      `SELECT id, project_id, category, name, description, status, due_date, owner, created_at
       FROM deliverables
       ${scope}
       ORDER BY created_at DESC`,
      params
    )
    const activity = await pool.query(
      `SELECT id, actor, action, target, icon, created_at
       FROM activity_feed
       ${scope}
       ORDER BY created_at DESC
       LIMIT 5`,
      params
    )
    const appointments = await pool.query(
      `SELECT id, title, consultant, scheduled_at, location, session_type
       FROM appointments
       ${scope}
       ORDER BY scheduled_at ASC
       LIMIT 3`,
      params
    )
    const team = await pool.query(
      `SELECT id, name, role, department, email, phone, avatar_url, bio, is_ps_team
       FROM team_directory
       ${scope}
       ORDER BY is_ps_team DESC, created_at ASC`,
      params
    )
    const documents = await pool.query(
      `SELECT id, title, file_type, category, created_at
       FROM shared_documents
       ${scope}
       ORDER BY created_at DESC
       LIMIT 4`,
      params
    )

    return NextResponse.json({
      isAdmin,
      projects: projects.rows,
      announcements: announcements.rows,
      milestones: milestones.rows,
      deliverables: deliverables.rows,
      activity: activity.rows,
      appointments: appointments.rows,
      team: team.rows,
      documents: documents.rows,
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
