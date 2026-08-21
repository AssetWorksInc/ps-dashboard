import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const projects = await pool.query(
      `SELECT id, name, description, health, pct_complete, pm_name, start_date, end_date, status,
              go_live_date, go_live_label, budget_hours_total, budget_hours_used, hourly_rate, budget_status
       FROM projects
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [user.tenantId]
    )
    const deliverables = await pool.query(
      `SELECT id, project_id, category, name, status, due_date, owner
       FROM deliverables
       WHERE tenant_id = $1
       ORDER BY created_at ASC`,
      [user.tenantId]
    )
    const contacts = await pool.query(
      `SELECT id, project_id, name, role, email, is_primary
       FROM project_contacts
       WHERE tenant_id = $1
       ORDER BY is_primary DESC`,
      [user.tenantId]
    )
    const appointments = await pool.query(
      `SELECT id, project_id, title, consultant, scheduled_at, location, session_type
       FROM appointments
       WHERE tenant_id = $1
       ORDER BY scheduled_at ASC`,
      [user.tenantId]
    )
    return NextResponse.json({
      isAdmin: user.role === 'admin',
      projects: projects.rows,
      deliverables: deliverables.rows,
      contacts: contacts.rows,
      appointments: appointments.rows
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, pm_name, start_date, end_date } = body

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO projects
        (tenant_id, name, description, pm_name, start_date, end_date, health, status, pct_complete)
       VALUES ($1, $2, $3, $4, $5, $6, 'green', 'active', 0)
       RETURNING *`,
      [
        user.tenantId,
        name,
        description || null,
        pm_name || null,
        start_date || null,
        end_date || null,
      ]
    )

    return NextResponse.json({ success: true, project: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
