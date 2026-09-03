import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { findOrCreateTenant } from '@/lib/tenants'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    // Admins see every tenant's data (needed for PS staff managing many customer
    // engagements at once); customers stay scoped to their own tenant only —
    // this is the one place that visibility boundary is decided.
    const isAdmin = user.role === 'admin'
    const scope = isAdmin ? '' : 'WHERE tenant_id = $1'
    const scopeP = isAdmin ? '' : 'WHERE p.tenant_id = $1'
    const params = isAdmin ? [] : [user.tenantId]

    const projects = await pool.query(
      `SELECT p.id, p.tenant_id, t.name AS tenant_name, p.name, p.description, p.health, p.pct_complete, p.pm_name,
              p.start_date, p.end_date, p.status, p.go_live_date, p.go_live_label,
              p.budget_hours_total, p.budget_hours_used, p.hourly_rate, p.budget_status
       FROM projects p
       JOIN tenants t ON t.id = p.tenant_id
       ${scopeP}
       ORDER BY p.created_at DESC`,
      params
    )
    const deliverables = await pool.query(
      `SELECT id, project_id, category, name, status, due_date, owner
       FROM deliverables
       ${scope}
       ORDER BY created_at ASC`,
      params
    )
    const contacts = await pool.query(
      `SELECT id, project_id, name, role, email, phone, is_primary
       FROM project_contacts
       ${scope}
       ORDER BY is_primary DESC, created_at ASC`,
      params
    )
    const appointments = await pool.query(
      `SELECT id, project_id, title, consultant, scheduled_at, location, session_type, notes
       FROM appointments
       ${scope}
       ORDER BY scheduled_at ASC`,
      params
    )
    const budgetLineItems = await pool.query(
      `SELECT id, project_id, activity_name, hours_planned, hours_worked, sort_order
       FROM budget_line_items
       ${scope}
       ORDER BY project_id, sort_order ASC, created_at ASC`,
      params
    )
    const billingCharges = await pool.query(
      `SELECT id, project_id, description, hours, rate, amount, charge_date, source
       FROM billing_charges
       ${scope}
       ORDER BY project_id, charge_date DESC NULLS LAST, created_at DESC`,
      params
    )
    const sopItems = await pool.query(
      `SELECT id, project_id, title, description, status, due_date, sort_order, checked_by, checked_at
       FROM sop_items
       ${scope}
       ORDER BY project_id, sort_order ASC, created_at ASC`,
      params
    )
    const documents = await pool.query(
      `SELECT id, project_id, title, description, file_url, file_type, category, uploaded_by, created_at
       FROM shared_documents
       ${scope}
       ORDER BY created_at DESC`,
      params
    )
    const meetingNotes = await pool.query(
      `SELECT id, project_id, title, body, risks_decisions, meeting_date, attendees, action_items, author, created_at,
              customer_satisfaction, scope_status, budget_quality_status, on_time_status, monitor_control
       FROM meeting_notes
       ${scope}
       ORDER BY meeting_date DESC NULLS LAST, created_at DESC`,
      params
    )
    const netsuiteTaskRows = await pool.query(
      `SELECT nr.id, nr.project_id, nr.netsuite_project_label, nr.id_number, nr.task_name, nr.task_type,
              nr.planned_hours, nr.gap_hours, nr.activity_budget_amount, nr.activity_budget_currency,
              nr.project_planned_hours, nr.project_worked_hours, nr.project_gap_hours,
              nr.project_billed_hours, nr.project_approved_hours
       FROM netsuite_task_rows nr
       ${isAdmin ? '' : 'WHERE EXISTS (SELECT 1 FROM projects pp WHERE pp.id = nr.project_id AND pp.tenant_id = $1)'}
       ORDER BY nr.project_id, nr.created_at ASC`,
      params
    )
    return NextResponse.json({
      isAdmin,
      projects: projects.rows,
      deliverables: deliverables.rows,
      contacts: contacts.rows,
      appointments: appointments.rows,
      budgetLineItems: budgetLineItems.rows,
      billingCharges: billingCharges.rows,
      sopItems: sopItems.rows,
      documents: documents.rows,
      meetingNotes: meetingNotes.rows,
      netsuiteTaskRows: netsuiteTaskRows.rows,
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
    const { name, description, pm_name, start_date, end_date, tenant_id, new_tenant_name } = body
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }
    // Which customer (tenant) this project belongs to: an existing tenant picked
    // from the dropdown, a brand-new customer typed in, or (fallback, e.g. for
    // older clients that don't send either) the admin's own tenant.
    let resolvedTenantId = tenant_id || user.tenantId
    if (new_tenant_name && new_tenant_name.trim()) {
      resolvedTenantId = await findOrCreateTenant(new_tenant_name.trim())
    }
    const result = await pool.query(
      `INSERT INTO projects
        (tenant_id, name, description, pm_name, start_date, end_date, health, status, pct_complete)
       VALUES ($1, $2, $3, $4, $5, $6, 'green', 'active', 0)
       RETURNING *`,
      [
        resolvedTenantId,
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
