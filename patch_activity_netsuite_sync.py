#!/usr/bin/env python3
"""
Mirrors each NetSuite task (from an Activity Detail Report import) onto its
own Hours-by-Activity line item, instead of that section being 100%
hand-typed. A task only gets mirrored if it carries a NetSuite internal task
ID -- without one there's no safe way to recognize "the same task" again on
the next import, so those stay visible only in the read-only Delivery Detail
task table.

Same override pattern as the Budget Utilization fix (budget_manual_override):
a mirrored line item keeps refreshing its Activity Name and Planned Hours on
every import until a PM hand-edits either of those two fields, at which point
manual_override flips true for that row and future imports leave it alone.
Editing Worked Hours alone never flips it -- NetSuite has no per-task
worked-hours figure to protect there; it's PM-entered either way, imported
row or not.

Requires the migration in migrate_activity_netsuite_link.js to have been run
first (adds netsuite_id_number / source / manual_override to
budget_line_items). Run from the repo root: python3 patch_activity_netsuite_sync.py
Safe to re-run: each anchor is matched exactly once; if already applied, this
will fail loudly instead of double-patching.
"""
import sys

COMMIT_ROUTE_PATH = "app/api/admin/netsuite-import/commit/route.ts"
PROJECTS_ROUTE_PATH = "app/api/projects/route.ts"
LINE_ITEM_ID_ROUTE_PATH = "app/api/budget-line-items/[id]/route.ts"
PAGE_PATH = "app/projects/page.tsx"


def apply_one(path, old, new, label):
    with open(path, "r") as f:
        content = f.read()
    count = content.count(old)
    if count == 0:
        print(f"FAIL [{label}]: anchor not found in {path}")
        sys.exit(1)
    if count > 1:
        print(f"FAIL [{label}]: anchor found {count} times in {path} (expected exactly 1)")
        sys.exit(1)
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print(f"OK   [{label}]")


# --------------------------------------------------------------------------
# 1. Commit route: mirror each NetSuite task onto a Hours-by-Activity row
# --------------------------------------------------------------------------

apply_one(
    COMMIT_ROUTE_PATH,
    """        const rollup = labelRows[0] as NetsuiteTaskRow | undefined
        if (rollup) {
          // Only auto-fill Budgeted/Used Hours from NetSuite's own rollup when
          // nobody has manually set Budget Settings for this project -- once a
          // PM saves Budget Settings by hand, budget_manual_override flips true
          // and future imports stop touching these two columns, so a manual
          // entry can never be silently clobbered by the next import.
          await client.query(
            `UPDATE projects SET budget_hours_total = $1, budget_hours_used = $2
             WHERE id = $3 AND budget_manual_override IS NOT TRUE`,
            [rollup.projectPlannedHours, rollup.projectWorkedHours, projectId]
          )
        }
      }""",
    """        const rollup = labelRows[0] as NetsuiteTaskRow | undefined
        if (rollup) {
          // Only auto-fill Budgeted/Used Hours from NetSuite's own rollup when
          // nobody has manually set Budget Settings for this project -- once a
          // PM saves Budget Settings by hand, budget_manual_override flips true
          // and future imports stop touching these two columns, so a manual
          // entry can never be silently clobbered by the next import.
          await client.query(
            `UPDATE projects SET budget_hours_total = $1, budget_hours_used = $2
             WHERE id = $3 AND budget_manual_override IS NOT TRUE`,
            [rollup.projectPlannedHours, rollup.projectWorkedHours, projectId]
          )
        }

        // Mirror each task with its own NetSuite ID onto a Hours-by-Activity
        // line item, so that table can stay in sync with NetSuite instead of
        // being entirely hand-typed. A task with no NetSuite ID is skipped --
        // there's no safe way to recognize it again on the next import, so it
        // stays visible only in the read-only Delivery Detail task table. A
        // line item already flagged manual_override is left untouched (same
        // override pattern as the rollup above); Worked Hours is never
        // touched here, since NetSuite's Activity Detail Report has no
        // per-task worked-hours figure to draw from -- it's PM-entered
        // either way, imported row or not.
        const projectTenant = await client.query(`SELECT tenant_id FROM projects WHERE id = $1`, [projectId])
        const projectTenantId = projectTenant.rows[0]?.tenant_id
        if (projectTenantId) {
          for (const row of labelRows as NetsuiteTaskRow[]) {
            if (!row.idNumber) continue
            const upd = await client.query(
              `UPDATE budget_line_items
               SET activity_name = COALESCE($1, activity_name), hours_planned = COALESCE($2, hours_planned)
               WHERE project_id = $3 AND netsuite_id_number = $4 AND manual_override IS NOT TRUE`,
              [row.taskName, row.plannedHours, projectId, row.idNumber]
            )
            if (upd.rowCount === 0) {
              const existing = await client.query(
                `SELECT id FROM budget_line_items WHERE project_id = $1 AND netsuite_id_number = $2`,
                [projectId, row.idNumber]
              )
              if (existing.rows.length === 0) {
                await client.query(
                  `INSERT INTO budget_line_items
                    (tenant_id, project_id, activity_name, hours_planned, hours_worked, source, netsuite_id_number, manual_override)
                   VALUES ($1, $2, $3, $4, 0, 'netsuite', $5, false)`,
                  [projectTenantId, projectId, row.taskName || row.label, row.plannedHours, row.idNumber]
                )
              }
            }
          }
        }
      }""",
    "commit route: mirror NetSuite tasks onto budget_line_items",
)

# --------------------------------------------------------------------------
# 2. /api/projects GET: return the three new columns
# --------------------------------------------------------------------------

apply_one(
    PROJECTS_ROUTE_PATH,
    """    const budgetLineItems = await pool.query(
      `SELECT id, project_id, activity_name, hours_planned, hours_worked, sort_order, created_at
       FROM budget_line_items
       ${scope}
       ORDER BY project_id, sort_order ASC, created_at ASC`,
      params
    )""",
    """    const budgetLineItems = await pool.query(
      `SELECT id, project_id, activity_name, hours_planned, hours_worked, sort_order, created_at,
              source, netsuite_id_number, manual_override
       FROM budget_line_items
       ${scope}
       ORDER BY project_id, sort_order ASC, created_at ASC`,
      params
    )""",
    "/api/projects: return source/netsuite_id_number/manual_override on line items",
)

# --------------------------------------------------------------------------
# 3. Per-line-item PATCH route: allow manual_override through
# --------------------------------------------------------------------------

apply_one(
    LINE_ITEM_ID_ROUTE_PATH,
    """const EDITABLE_FIELDS = ['activity_name', 'hours_planned', 'hours_worked', 'sort_order']""",
    """const EDITABLE_FIELDS = ['activity_name', 'hours_planned', 'hours_worked', 'sort_order', 'manual_override']""",
    "budget-line-items/[id]: allow manual_override in EDITABLE_FIELDS",
)

# --------------------------------------------------------------------------
# 4. Page: saveLineItem() sets manual_override only when Name/Planned change
# --------------------------------------------------------------------------

apply_one(
    PAGE_PATH,
    """  async function saveLineItem(id: string) {
    const res = await fetch(`/api/budget-line-items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_name: lineItemDraft.activity_name,
        hours_planned: lineItemDraft.hours_planned === '' ? 0 : Number(lineItemDraft.hours_planned),
        hours_worked: lineItemDraft.hours_worked === '' ? 0 : Number(lineItemDraft.hours_worked),
      }),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setEditingLineItemId(null)
    }
  }""",
    """  async function saveLineItem(id: string) {
    const original = lineItems.find((li: any) => li.id === id)
    const newActivityName = lineItemDraft.activity_name
    const newHoursPlanned = lineItemDraft.hours_planned === '' ? 0 : Number(lineItemDraft.hours_planned)
    const newHoursWorked = lineItemDraft.hours_worked === '' ? 0 : Number(lineItemDraft.hours_worked)
    const payload: any = {
      activity_name: newActivityName,
      hours_planned: newHoursPlanned,
      hours_worked: newHoursWorked,
    }
    // A NetSuite-sourced row only locks out of future auto-refresh when its
    // Activity Name or Planned Hours is hand-edited -- editing Worked Hours
    // alone never sets this, since NetSuite has no per-task worked-hours
    // figure to protect there in the first place.
    if (
      original?.source === 'netsuite' && !original.manual_override &&
      (original.activity_name !== newActivityName || Number(original.hours_planned) !== newHoursPlanned)
    ) {
      payload.manual_override = true
    }
    const res = await fetch(`/api/budget-line-items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setEditingLineItemId(null)
    }
  }""",
    "page: saveLineItem sets manual_override only on Name/Planned edits",
)

# --------------------------------------------------------------------------
# 5. Page: show a "NetSuite" badge on imported line items
# --------------------------------------------------------------------------

apply_one(
    PAGE_PATH,
    """                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#323E48', fontWeight: 500 }}>{li.activity_name}</td>""",
    """                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#323E48', fontWeight: 500 }}>
                                  {li.activity_name}
                                  {li.source === 'netsuite' && (
                                    <span title={li.manual_override ? 'Originally imported from NetSuite; manually edited since, so it no longer auto-updates.' : 'Imported from NetSuite; refreshes automatically on the next Activity Detail import.'} style={{ marginLeft: '7px', fontSize: '9px', fontWeight: 700, color: li.manual_override ? '#8a9199' : '#00538C', border: '1px solid #CCCCCC', borderRadius: '3px', padding: '1px 5px', textTransform: 'uppercase' as const, letterSpacing: '.3px' }}>
                                      {li.manual_override ? 'NetSuite \\u00b7 edited' : 'NetSuite'}
                                    </span>
                                  )}
                                </td>""",
    "page: NetSuite badge on imported Hours-by-Activity rows",
)

print("\nAll patches applied successfully.")
