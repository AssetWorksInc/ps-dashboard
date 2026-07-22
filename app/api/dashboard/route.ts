import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const projects = await pool.query(`
      SELECT id, name, description, health, pct_complete, pm_name, start_date, end_date
      FROM projects
      ORDER BY created_at DESC
    `)

    const announcements = await pool.query(`
      SELECT id, title, body, priority, is_pinned, author, created_at
      FROM announcements
      ORDER BY is_pinned DESC, created_at DESC
    `)

    const milestones = await pool.query(`
      SELECT id, title, description, due_date, status, owner
      FROM milestones
      ORDER BY due_date ASC
    `)

    const activity = await pool.query(`
      SELECT id, actor, action, target, icon, created_at
      FROM activity_feed
      ORDER BY created_at DESC
      LIMIT 5
    `)

    const appointments = await pool.query(`
      SELECT id, title, consultant, scheduled_at, location, session_type
      FROM appointments
      ORDER BY scheduled_at ASC
      LIMIT 3
    `)

    return NextResponse.json({
      projects: projects.rows,
      announcements: announcements.rows,
      milestones: milestones.rows,
      activity: activity.rows,
      appointments: appointments.rows
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
