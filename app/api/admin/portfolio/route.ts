import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { signalFor } from '@/lib/portfolioSignal'
import { logActivity } from '@/lib/activityLog'

const EDITABLE_FIELDS = [
  'engagement_status',
  'epic',
  'confluence_url',
  'pm_comment',
  'next_milestone',
  'next_milestone_date',
] as const

const FIELD_LABEL: Record<string, string> = {
  engagement_status: 'Engagement Status',
  epic: 'Epic',
  confluence_url: 'Confluence URL',
  pm_comment: 'PM Comment',
  next_milestone: 'Next Milestone',
  next_milestone_date: 'Next Milestone Date',
}

const VALID_STATUSES = ['GREEN', 'YELLOW', 'RED', 'BLUE', 'GREY', 'OPEN']

// Above this many projects in one bulk edit, log a single summarized entry
// instead of one row per project, so a large bulk update doesn't flood the
// Activity feed the way a per-row NetSuite import would.
const BULK_LOG_THRESHOLD = 15

// Postgres `date` columns come back from pg as JS Date objects (local midnight),
// and NextResponse.json() then serializes them to a full ISO timestamp. Reduce
// to a plain YYYY-MM-DD string here so downstream date math (shortDate/daysAgo
// on the client, signalFor's daysSince on the server) gets what it expects.
function dateOnly(d: unknown): string | null {
  if (d === null || d === undefined) return null
  if (d instanceof Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return String(d).slice(0, 10)
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const result = await pool.query(
    `SELECT DISTINCT ON (p.id)
       p.id, p.name, p.tenant_id, t.name AS tenant_name,
       p.engagement_status, p.epic, p.confluence_url, p.pm_comment,
       p.next_milestone, p.next_milestone_date,
       p.start_date, p.end_date,
       ndr.internal_id AS pid,
       ndr.prime_resource, ndr.secondary_prime_resource,
       ndr.pct_complete, ndr.contract_signed_date, ndr.last_time_entry_date,
       ndr.services_backlog, ndr.services_revenue
     FROM projects p
     JOIN tenants t ON t.id = p.tenant_id
     LEFT JOIN netsuite_dashboard_rows ndr ON ndr.project_id = p.id
     ORDER BY p.id, ndr.created_at DESC NULLS LAST`
  )

  const today = new Date().toISOString().slice(0, 10)

  const rows = result.rows.map((r) => {
    const pctComplete = r.pct_complete !== null ? Number(r.pct_complete) : null
    const backlog = r.services_backlog !== null ? Number(r.services_backlog) : null
    const contractSignedDate = dateOnly(r.contract_signed_date)
    const lastTimeEntryDate = dateOnly(r.last_time_entry_date)
    const nextMilestoneDate = dateOnly(r.next_milestone_date)
    const signal = signalFor(
      {
        pctComplete,
        contractSignedDate,
        lastTimeEntryDate,
        servicesBacklog: backlog,
        epic: r.epic,
      },
      today
    )
    return {
      id: r.id,
      name: r.name,
      tenantId: r.tenant_id,
      client: r.tenant_name,
      pid: r.pid,
      engagementStatus: r.engagement_status,
      epic: r.epic,
      confluenceUrl: r.confluence_url,
      pmComment: r.pm_comment,
      nextMilestone: r.next_milestone,
      nextMilestoneDate,
      primeResource: r.prime_resource,
      secondaryPrimeResource: r.secondary_prime_resource,
      pctComplete,
      contractSignedDate,
      lastTimeEntryDate,
      servicesBacklog: backlog,
      servicesRevenue: r.services_revenue !== null ? Number(r.services_revenue) : null,
      openairUrl: r.pid ? `https://app.openair.com/projects/${r.pid}` : null,
      signal,
    }
  })

  return NextResponse.json({ projects: rows })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const body = await req.json()
  const { id, ids, field, value } = body
  const targetIds: string[] = Array.isArray(ids) && ids.length > 0 ? ids : id ? [id] : []

  if (targetIds.length === 0 || !field) {
    return NextResponse.json({ error: 'id (or ids) and field are required' }, { status: 400 })
  }
  if (!EDITABLE_FIELDS.includes(field)) {
    return NextResponse.json({ error: 'Field is not editable' }, { status: 400 })
  }
  if (field === 'engagement_status' && !VALID_STATUSES.includes(value)) {
    return NextResponse.json({ error: 'Invalid engagement status' }, { status: 400 })
  }

  const column = field as (typeof EDITABLE_FIELDS)[number]
  const cleanValue = value === '' ? null : value

  const updated = await pool.query(
    `UPDATE projects SET ${column} = $1 WHERE id = ANY($2) RETURNING id, name, tenant_id`,
    [cleanValue, targetIds]
  )

  const fieldLabel = FIELD_LABEL[column] || column
  const detail = `${fieldLabel} → ${cleanValue ?? '(cleared)'}`

  if (updated.rows.length > BULK_LOG_THRESHOLD) {
    await logActivity({
      tenantId: updated.rows[0]?.tenant_id,
      projectId: null,
      module: 'portfolio',
      entityType: 'project',
      entityId: null,
      action: 'updated',
      actorName: user.name,
      actorEmail: user.email,
      summary: `${updated.rows.length} projects`,
      detail,
    })
  } else {
    for (const row of updated.rows) {
      await logActivity({
        tenantId: row.tenant_id,
        projectId: row.id,
        module: 'portfolio',
        entityType: 'project',
        entityId: row.id,
        action: 'updated',
        actorName: user.name,
        actorEmail: user.email,
        summary: row.name,
        detail,
      })
    }
  }

  return NextResponse.json({ success: true, count: targetIds.length })
}
