// One-time migration: adds three columns to budget_line_items so a line item
// can be linked to (and safely re-synced from) a specific NetSuite task:
//   - netsuite_id_number  TEXT     -- the task's own NetSuite internal ID
//                                     (netsuite_task_rows.id_number), used to
//                                     recognize "the same task" across re-imports.
//   - source              TEXT     -- 'manual' (default, existing behavior) or
//                                     'netsuite' (created by an Activity Detail import).
//   - manual_override     BOOLEAN  -- same idea as projects.budget_manual_override:
//                                     flips true only when a PM hand-edits a
//                                     NetSuite-sourced row's Activity Name or
//                                     Planned Hours. Future imports then leave
//                                     that row's name/planned-hours alone.
//
// Safe to re-run: every ADD COLUMN / CREATE INDEX uses IF NOT EXISTS.
//
// Run from ~/ps-dashboard on the server:
//   node migrate_activity_netsuite_link.js
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

for (const file of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), file)
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
    }
  }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false })

async function main() {
  await pool.query(`ALTER TABLE budget_line_items ADD COLUMN IF NOT EXISTS netsuite_id_number TEXT`)
  await pool.query(`ALTER TABLE budget_line_items ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'`)
  await pool.query(`ALTER TABLE budget_line_items ADD COLUMN IF NOT EXISTS manual_override BOOLEAN NOT NULL DEFAULT false`)
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_budget_line_items_netsuite_id
     ON budget_line_items(project_id, netsuite_id_number)
     WHERE netsuite_id_number IS NOT NULL`
  )
  const check = await pool.query(
    `SELECT column_name, data_type, column_default FROM information_schema.columns
     WHERE table_name = 'budget_line_items' AND column_name IN ('netsuite_id_number', 'source', 'manual_override')
     ORDER BY column_name`
  )
  console.log('New columns on budget_line_items:')
  console.log(JSON.stringify(check.rows, null, 2))
  await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
