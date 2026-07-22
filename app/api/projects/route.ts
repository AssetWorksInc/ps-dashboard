import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const projects = await pool.query(`
      SELECT id, name, description, health, pct_complete, pm_name, start_date, end_date, status
      FROM projects
      ORDER BY created_at DESC
    `)

    const deliverables = await pool.query(`
      SELECT id, project_id, category, name, status, due_date, owner
      FROM deliverables
      ORDER BY created_at ASC
    `)

    const contacts = await pool.query(`
      SELECT id, project_id, name, role, email, is_primary
      FROM project_contacts
      ORDER BY is_primary DESC
    `)

    const appointments = await pool.query(`
      SELECT id, project_id, title, consultant, scheduled_at, location, session_type
      FROM appointments
      ORDER BY scheduled_at ASC
    `)

    return NextResponse.json({
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
