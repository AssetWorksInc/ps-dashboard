import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activityLog'

// Undoes a single NetSuite import. For each project that import touched:
//  - if THIS import is the one that created the project (created_by_import_id
//    matches), the project is deleted outright, along with its mapping — unless
//    the project already has other Portal data attached (deliverables, budget
//    items, etc.), in which case deletion is skipped and only its NetSuite data
//    is cleared, since destroying unrelated Portal work would be worse than
//    leaving one stray project behind.
//  - otherwise the project already existed before this import, so only this
//    import's task rows and budget sync are cleared; the project itself is left
//    alone.
// The import record itself is always removed once its effects are undone.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { id: importId } = await params

  const client = await pool.connect()
  let projectsDeleted = 0
  let projectsCleared = 0
  let projectsKept = 0

  try {
    await client.query('BEGIN')

    const importRow = await client.query(
      `SELECT id, filename, report_title FROM netsuite_report_imports WHERE id = $1`,
      [importId]
    )
    if (importRow.rows.length === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Import not found' }, { status: 404 })
    }

    const affectedTask = await client.query(
      `SELECT DISTINCT project_id FROM netsuite_task_rows WHERE import_id = $1`,
      [importId]
    )
    const affectedDashboard = await client.query(
      `SELECT DISTINCT project_id FROM netsuite_dashboard_rows WHERE import_id = $1`,
      [importId]
    )
    const affectedProjectIds = Array.from(new Set<string>([
      ...affectedTask.rows.map(r => r.project_id),
      ...affectedDashboard.rows.map(r => r.project_id),
    ]))

    for (const projectId of affectedProjectIds) {
      const mapRow = await client.query(
        `SELECT created_by_import_id FROM netsuite_project_map WHERE project_id = $1`,
        [projectId]
      )
      const createdByThisImport = mapRow.rows[0]?.created_by_import_id === importId

      // Clear this import's own data from the project regardless of what happens next.
      // Only reset the Budget tab hours if this import actually touched the task-row
      // table for this project - a Dashboard-only import shouldn't blank out hours
      // that came from a different (Activity Detail) import.
      const deletedTask = await client.query(`DELETE FROM netsuite_task_rows WHERE project_id = $1 AND import_id = $2`, [projectId, importId])
      if ((deletedTask.rowCount || 0) > 0) {
        await client.query(`UPDATE projects SET budget_hours_total = NULL, budget_hours_used = NULL WHERE id = $1`, [projectId])
      }
      await client.query(`DELETE FROM netsuite_dashboard_rows WHERE project_id = $1 AND import_id = $2`, [projectId, importId])

      if (createdByThisImport) {
        try {
          await client.query('SAVEPOINT before_project_delete')
          await client.query(`DELETE FROM netsuite_project_map WHERE project_id = $1`, [projectId])
          await client.query(`DELETE FROM projects WHERE id = $1`, [projectId])
          await client.query('RELEASE SAVEPOINT before_project_delete')
          projectsDeleted++
        } catch {
          await client.query('ROLLBACK TO SAVEPOINT before_project_delete')
          projectsKept++
        }
      } else {
        projectsCleared++
      }
    }

    await client.query(`DELETE FROM netsuite_report_imports WHERE id = $1`, [importId])
    await client.query('COMMIT')

    // One summarized entry for the whole undo, same reasoning as the commit
    // route -- this can touch dozens of projects in one action.
    await logActivity({
      tenantId: null,
      projectId: null,
      module: 'netsuite_import',
      entityType: 'import',
      entityId: importId,
      action: 'deleted',
      actorName: user.name,
      actorEmail: user.email,
      summary: importRow.rows[0].report_title || importRow.rows[0].filename || 'NetSuite import',
      detail: `${projectsDeleted} projects deleted · ${projectsCleared} cleared · ${projectsKept} kept`,
    })

    return NextResponse.json({ success: true, projectsDeleted, projectsCleared, projectsKept })
  } catch (error) {
    await client.query('ROLLBACK')
    return NextResponse.json({ error: String(error) }, { status: 500 })
  } finally {
    client.release()
  }
}
