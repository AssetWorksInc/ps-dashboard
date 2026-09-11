import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { signalFor } from '@/lib/portfolioSignal'

const EDITABLE_FIELDS = [
  'engagement_status',
  'epic',
  'confluence_url',
  'pm_comment',
  'next_milestone',
  'next_milestone_date',
] as const

const VALID_STATUSES = ['GREEN', 'YELLOW', 'RED', 'BLUE', 'GREY', 'OPEN']

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
    const signal = signalFor(
      {
        pctComplete,
        contractSignedDate: r.contract_signed_date,
        lastTimeEntryDate: r.last_time_entry_date,
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
      nextMilestoneDate: r.next_milestone_date,
      primeResource: r.prime_resource,
      secondaryPrimeResource: r.secondary_prime_resource,
      pctComplete,
      contractSignedDate: r.contract_signed_date,
      lastTimeEntryDate: r.last_time_entry_date,
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
  const { id, field, value } = body

  if (!id || !field) {
    return NextResponse.json({ error: 'id and field are required' }, { status: 400 })
  }
  if (!EDITABLE_FIELDS.includes(field)) {
    return NextResponse.json({ error: 'Field is not editable' }, { status: 400 })
  }
  if (field === 'engagement_status' && !VALID_STATUSES.includes(value)) {
    return NextResponse.json({ error: 'Invalid engagement status' }, { status: 400 })
  }

  const column = field as (typeof EDITABLE_FIELDS)[number]
  const cleanValue = value === '' ? null : value

  await pool.query(`UPDATE projects SET ${column} = $1 WHERE id = $2`, [cleanValue, id])

  return NextResponse.json({ success: true })
}
