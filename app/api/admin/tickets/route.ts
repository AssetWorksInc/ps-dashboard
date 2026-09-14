import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Serves the seeded Jira (CC + ME) ticket snapshot to the Tickets queue page.
// This is a one-time snapshot loaded by scripts/seed-tickets.js, not a live
// Jira poll — the server has no Atlassian API token configured yet. See
// claude/portal-dev-changelog.md for the plan to wire up live refresh later.

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { rows } = await pool.query(`
    SELECT
      t.id,
      t.external_id,
      t.jira_project,
      t.title,
      t.status,
      t.priority,
      t.submitted_by,
      t.assigned_to,
      t.created_at,
      t.updated_at,
      t.url,
      t.issue_type,
      t.org_name,
      t.customer_visible,
      t.tenant_id,
      t.project_id,
      te.name AS tenant_name
    FROM tickets t
    LEFT JOIN tenants te ON te.id = t.tenant_id
    WHERE t.external_source = 'jira'
    ORDER BY t.updated_at DESC
  `)

  const tickets = rows.map((r) => ({
    id: r.id as string,
    key: r.external_id as string,
    jiraProject: r.jira_project as string,
    title: r.title as string,
    status: r.status as string,
    priority: r.priority as string,
    submittedBy: r.submitted_by as string | null,
    assignedTo: r.assigned_to as string | null,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
    url: r.url as string,
    issueType: r.issue_type as string | null,
    client: (r.tenant_name as string | null) || (r.org_name as string | null),
    hasTenantMatch: Boolean(r.tenant_id),
    projectId: r.project_id as string | null,
    customerVisible: Boolean(r.customer_visible),
  }))

  return NextResponse.json({ tickets })
}
