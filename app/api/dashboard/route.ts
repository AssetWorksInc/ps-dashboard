import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const projects = await pool.query(
      `SELECT id, name, description, health, pct_complete, pm_name, start_date, end_date,
              go_live_date, go_live_label, budget_hours_total, budget_hours_used, hourly_rate, budget_status
       FROM projects
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [user.tenantId]
    )
    const announcements = await pool.query(
      `SELECT id, title, body, priority, is_pinned, author, created_at
       FROM announcements
       WHERE tenant_id = $1
       ORDER BY is_pinned DESC, created_at DESC`,
      [user.tenantId]
    )
    const milestones = await pool.query(
      `SELECT id, project_id, title, description, start_date, due_date, status, owner, pct_complete, sort_order
       FROM milestones
       WHERE tenant_id = $1
       ORDER BY sort_order ASC, due_date ASC`,
      [user.tenantId]
    )
    const deliverables = await pool.query(
      `SELECT id, project_id, category, name, description, status, due_date, owner, created_at
       FROM deliverables
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [user.tenantId]
    )
    const activity = await pool.query(
      `SELECT id, actor, action, target, icon, created_at
       FROM activity_feed
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [user.tenantId]
    )
    const appointments = await pool.query(
      `SELECT id, title, consultant, scheduled_at, location, session_type
       FROM appointments
       WHERE tenant_id = $1
       ORDER BY scheduled_at ASC
       LIMIT 3`,
      [user.tenantId]
    )
    const team = await pool.query(
      `SELECT id, name, role, department, email, phone, avatar_url, bio, is_ps_team
       FROM team_directory
       WHERE tenant_id = $1
       ORDER BY is_ps_team DESC, created_at ASC`,
      [user.tenantId]
    )
    const documents = await pool.query(
      `SELECT id, title, file_type, category, created_at
       FROM shared_documents
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT 4`,
      [user.tenantId]
    )

    return NextResponse.json({
      isAdmin: user.role === 'admin',
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
