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

  // OpenAir (the daily emailed report) is the source of truth for hours and
  // fees; the older NetSuite import is only a fallback for projects that have
  // no OpenAir snapshot yet. "act" = the most recent day the hours-to-date
  // figure went up between two daily snapshots (OpenAir's report has no
  // "last time entry" column, so this is how we tell a project is moving).
  const result = await pool.query(
    `SELECT DISTINCT ON (p.id)
       p.id, p.name, p.tenant_id, t.name AS tenant_name,
       p.engagement_status, p.epic, p.confluence_url, p.pm_comment,
       p.next_milestone, p.next_milestone_date,
       p.start_date, p.end_date,
       ndr.internal_id AS pid,
       (ndr.internal_id IS NOT NULL) AS has_ndr,
       ndr.prime_resource, ndr.secondary_prime_resource,
       ndr.pct_complete, ndr.contract_signed_date, ndr.last_time_entry_date,
       ndr.services_backlog, ndr.services_revenue,
       oa.prime_resource AS oa_prime_resource,
       oa.budget_hours AS oa_budget_hours, oa.hours_to_date AS oa_hours_to_date,
       oa.budget_fees AS oa_budget_fees, oa.fees_to_date AS oa_fees_to_date,
       oa.contract_signed_date AS oa_contract_signed_date,
       act.d AS oa_last_activity
     FROM projects p
     JOIN tenants t ON t.id = p.tenant_id
     LEFT JOIN netsuite_dashboard_rows ndr ON ndr.project_id = p.id
     LEFT JOIN LATERAL (
       SELECT s.prime_resource, s.budget_hours, s.hours_to_date, s.budget_fees, s.fees_to_date, s.contract_signed_date
       FROM openair_project_snapshots s
       WHERE s.project_id = p.id
       ORDER BY s.report_date DESC, s.generated_at DESC NULLS LAST
       LIMIT 1
     ) oa ON true
     LEFT JOIN LATERAL (
       SELECT MAX(x.report_date) AS d FROM (
         SELECT s.report_date, s.hours_to_date,
                LAG(s.hours_to_date) OVER (PARTITION BY s.label ORDER BY s.report_date) AS prev
         FROM openair_project_snapshots s
         WHERE s.project_id = p.id
       ) x
       WHERE x.prev IS NOT NULL AND x.hours_to_date > x.prev
     ) act ON true
     ORDER BY p.id, ndr.created_at DESC NULLS LAST`
  )

  const today = new Date().toISOString().slice(0, 10)

  const rows = result.rows.map((r) => {
    const hasOa = r.oa_budget_fees !== null && r.oa_budget_fees !== undefined
    const oaBudgetFees = hasOa ? Number(r.oa_budget_fees) : null
    const oaFeesToDate = r.oa_fees_to_date !== null && r.oa_fees_to_date !== undefined ? Number(r.oa_fees_to_date) : null
    const oaBudgetHours = r.oa_budget_hours !== null && r.oa_budget_hours !== undefined ? Number(r.oa_budget_hours) : null
    const oaHoursToDate = r.oa_hours_to_date !== null && r.oa_hours_to_date !== undefined ? Number(r.oa_hours_to_date) : null
    // Backlog = fees still to bill = Budget Fees - Project-to-Date Charge Fees
    // (identical to OpenAir's "Remaining Budget Fees" column).
    const backlog =
      oaBudgetFees !== null && oaFeesToDate !== null
        ? Math.round((oaBudgetFees - oaFeesToDate) * 100) / 100
        : r.services_backlog !== null ? Number(r.services_backlog) : null
    const servicesRevenue =
      oaFeesToDate !== null ? oaFeesToDate : r.services_revenue !== null ? Number(r.services_revenue) : null
    const pctComplete =
      oaBudgetHours !== null && oaBudgetHours > 0 && oaHoursToDate !== null
        ? Math.round((oaHoursToDate / oaBudgetHours) * 10000) / 100
        : r.pct_complete !== null ? Number(r.pct_complete) : null
    const contractSignedDate = dateOnly(r.contract_signed_date) || dateOnly(r.oa_contract_signed_date)
    const oaActivity = dateOnly(r.oa_last_activity)
    const ndrActivity = dateOnly(r.last_time_entry_date)
    const lastTimeEntryDate =
      oaActivity && ndrActivity ? (oaActivity > ndrActivity ? oaActivity : ndrActivity) : oaActivity || ndrActivity
    // "Known" = we can tell whether the project is moving. A NetSuite row with
    // no date means "never", which is meaningful. An OpenAir-only project with
    // no observed change yet is simply unknown (history is still building), and
    // must not be flagged as stale just because the daily reports are new.
    const activityKnown = lastTimeEntryDate !== null || (!!r.has_ndr && !hasOa)
    const nextMilestoneDate = dateOnly(r.next_milestone_date)
    const signal = signalFor(
      {
        pctComplete,
        contractSignedDate,
        lastTimeEntryDate,
        activityKnown,
        servicesBacklog: backlog,
        epic: r.epic,
      },
      today
    )
    return {
      id: r.id,
      linked: true,
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
      primeResource: r.oa_prime_resource || r.prime_resource,
      secondaryPrimeResource: r.secondary_prime_resource,
      pctComplete,
      contractSignedDate,
      lastTimeEntryDate,
      activityKnown,
      servicesBacklog: backlog,
      servicesRevenue,
      openairUrl: r.pid ? `https://app.openair.com/projects/${r.pid}` : null,
      signal,
    }
  })

  // Every other project in the newest OpenAir report that is not (yet) a portal
  // project. Staff-only and read-only: nothing is created in the portal, and no
  // customer can see these. They update by themselves with each daily report.
  const unlinked = await pool.query(
    `SELECT s.label, s.client_name, s.prime_resource, s.budget_hours, s.hours_to_date,
            s.budget_fees, s.fees_to_date, s.contract_signed_date,
            (SELECT MAX(x.report_date) FROM (
               SELECT a.report_date, a.hours_to_date,
                      LAG(a.hours_to_date) OVER (ORDER BY a.report_date) AS prev
               FROM openair_project_snapshots a WHERE a.label = s.label
             ) x WHERE x.prev IS NOT NULL AND x.hours_to_date > x.prev) AS last_activity
     FROM openair_project_snapshots s
     WHERE s.project_id IS NULL
       AND s.report_date = (SELECT MAX(report_date) FROM openair_project_snapshots)
       AND s.generated_at = (SELECT MAX(generated_at) FROM openair_project_snapshots
                              WHERE report_date = (SELECT MAX(report_date) FROM openair_project_snapshots))`
  )
  const unlinkedRows = unlinked.rows.map((r) => {
    const budgetFees = r.budget_fees !== null ? Number(r.budget_fees) : null
    const feesToDate = r.fees_to_date !== null ? Number(r.fees_to_date) : null
    const budgetHours = r.budget_hours !== null ? Number(r.budget_hours) : null
    const hoursToDate = r.hours_to_date !== null ? Number(r.hours_to_date) : null
    const backlog = budgetFees !== null && feesToDate !== null ? Math.round((budgetFees - feesToDate) * 100) / 100 : null
    const pctComplete =
      budgetHours !== null && budgetHours > 0 && hoursToDate !== null ? Math.round((hoursToDate / budgetHours) * 10000) / 100 : null
    const lastTimeEntryDate = dateOnly(r.last_activity)
    const activityKnown = lastTimeEntryDate !== null
    const contractSignedDate = dateOnly(r.contract_signed_date)
    const signal = signalFor(
      { pctComplete, contractSignedDate, lastTimeEntryDate, activityKnown, servicesBacklog: backlog, epic: null },
      today
    )
    return {
      id: `oa:${r.label}`,
      linked: false,
      name: r.label,
      tenantId: null,
      client: r.client_name || String(r.label).split('-')[0],
      pid: null,
      engagementStatus: 'OPEN',
      epic: null,
      confluenceUrl: null,
      pmComment: null,
      nextMilestone: null,
      nextMilestoneDate: null,
      primeResource: r.prime_resource,
      secondaryPrimeResource: null,
      pctComplete,
      contractSignedDate,
      lastTimeEntryDate,
      activityKnown,
      servicesBacklog: backlog,
      servicesRevenue: feesToDate,
      openairUrl: null,
      signal,
    }
  })

  return NextResponse.json({ projects: [...rows, ...unlinkedRows] })
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
