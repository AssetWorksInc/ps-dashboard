import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activityLog'

// The three fields a person can edit here, plus the three renewal fields
// (which live in their own table, upserted onto whichever renewal row is
// "current" for that tenant -- see upsertRenewalField below).
const EDITABLE_FIELDS = [
  'csm_name',
  'cs_health',
  'cs_health_note',
  'renewal_contract_end',
  'renewal_stage',
  'renewal_notes',
] as const
type EditableField = (typeof EDITABLE_FIELDS)[number]

const FIELD_LABEL: Record<EditableField, string> = {
  csm_name: 'CSM',
  cs_health: 'CS Health',
  cs_health_note: 'CS Health Note',
  renewal_contract_end: 'Renewal Contract End',
  renewal_stage: 'Renewal Stage',
  renewal_notes: 'Renewal Notes',
}

// A CSM's own Green / Amber / Red read on the account -- deliberately a
// simpler three-value scale than Portfolio's six-value engagement_status,
// since this is a relationship read, not a delivery-status read.
const VALID_HEALTH = ['GREEN', 'AMBER', 'RED']

const VALID_STAGES = ['Not started', 'In progress', 'At risk', 'Renewed', 'Lost']

// Postgres `date` columns come back from pg as JS Date objects (local
// midnight); reduce to a plain YYYY-MM-DD string, same convention as
// app/api/admin/portfolio/route.ts.
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

  const result = await pool.query(`
    SELECT * FROM (
      SELECT DISTINCT ON (t.id)
        t.id, t.name, t.slug, t.tier, t.csm_name, t.cs_health, t.cs_health_note,
        r.contract_end, r.stage, r.notes
      FROM tenants t
      LEFT JOIN renewals r ON r.tenant_id = t.id
      ORDER BY t.id, r.created_at DESC NULLS LAST
    ) sub
    ORDER BY sub.name ASC
  `)

  const tenants = result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    tier: r.tier,
    csmName: r.csm_name,
    csHealth: r.cs_health,
    csHealthNote: r.cs_health_note,
    renewal:
      r.contract_end || r.stage || r.notes
        ? { contractEnd: dateOnly(r.contract_end), stage: r.stage, notes: r.notes }
        : null,
  }))

  return NextResponse.json({ tenants })
}

// Finds the current renewal row for a tenant (the most recently created
// one) and updates a single column on it, or inserts a fresh row if the
// tenant has never had a renewal recorded. Column name is never taken from
// the request body directly -- it only ever comes from the fixed mapping
// in PATCH below, so this stays safe from injection despite the interpolation.
async function upsertRenewalField(tenantId: string, column: 'contract_end' | 'stage' | 'notes', value: string | null) {
  const existing = await pool.query(
    `SELECT id FROM renewals WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [tenantId]
  )
  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE renewals SET ${column} = $1, updated_at = now() WHERE id = $2`,
      [value, existing.rows[0].id]
    )
    return
  }
  await pool.query(
    `INSERT INTO renewals (tenant_id, ${column}) VALUES ($1, $2)`,
    [tenantId, value]
  )
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
  if (field === 'cs_health' && value && !VALID_HEALTH.includes(value)) {
    return NextResponse.json({ error: 'Invalid CS health value' }, { status: 400 })
  }
  if (field === 'renewal_stage' && value && !VALID_STAGES.includes(value)) {
    return NextResponse.json({ error: 'Invalid renewal stage' }, { status: 400 })
  }

  const tenantRow = await pool.query('SELECT id, name FROM tenants WHERE id = $1', [id])
  if (tenantRow.rows.length === 0) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const column = field as EditableField
  const cleanValue = value === '' ? null : value

  if (column.startsWith('renewal_')) {
    const renewalColumn = column.replace('renewal_', '') as 'contract_end' | 'stage' | 'notes'
    await upsertRenewalField(id, renewalColumn, cleanValue)
  } else {
    await pool.query(`UPDATE tenants SET ${column} = $1 WHERE id = $2`, [cleanValue, id])
  }

  await logActivity({
    tenantId: id,
    projectId: null,
    module: 'accounts',
    entityType: 'tenant',
    entityId: id,
    action: 'updated',
    actorName: user.name,
    actorEmail: user.email,
    summary: tenantRow.rows[0].name,
    detail: `${FIELD_LABEL[column]} → ${cleanValue ?? '(cleared)'}`,
  })

  return NextResponse.json({ success: true })
}
