import pool from '@/lib/db'

// Shared logging helper for the Management Center Activity feed. Every write
// path across the app (Project Center, Portfolio, Resource Center,
// Collaboration Hub) calls this once its own database write has succeeded,
// so the activity_log table stays a record of what actually happened rather
// than what an API call merely attempted.
//
// Deliberately fire-and-forget from the caller's perspective: a failure here
// is logged to the server console but never thrown, so a logging bug can
// never break the real save it's attached to.

export type ActivityAction = 'created' | 'updated' | 'deleted'

export type ActivityModule =
  | 'project_center'
  | 'portfolio'
  | 'resource_center'
  | 'collaboration_hub'
  | 'netsuite_import'

export type ActivityEntry = {
  tenantId?: string | null
  projectId?: string | null
  module: ActivityModule
  entityType: string
  entityId?: string | number | null
  action: ActivityAction
  actorName?: string | null
  actorEmail?: string | null
  summary: string
  detail?: string | null
}

export async function logActivity(entry: ActivityEntry): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO activity_log
        (tenant_id, project_id, module, entity_type, entity_id, action, actor_name, actor_email, summary, detail)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        entry.tenantId || null,
        entry.projectId || null,
        entry.module,
        entry.entityType,
        entry.entityId != null ? String(entry.entityId) : null,
        entry.action,
        entry.actorName || null,
        entry.actorEmail || null,
        entry.summary,
        entry.detail || null,
      ]
    )
  } catch (err) {
    console.error('[activityLog] failed to write activity_log row:', err)
  }
}
