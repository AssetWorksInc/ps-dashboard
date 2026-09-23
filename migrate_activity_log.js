// One-time migration: creates the activity_log table that every write path
// across the app (Project Center, Portfolio, Resource Center, Collaboration
// Hub) will log to via lib/activityLog.ts, powering the Management Center
// Activity page and the "N updates today" badge on the Dashboard.
//
// entity_id is TEXT rather than UUID -- some tables use uuid ids, others
// (e.g. milestones, budget line items) may use a different id type, and this
// column only needs to display, never join, so TEXT keeps it universal.
//
// Safe to re-run: CREATE TABLE / INDEX both use IF NOT EXISTS.
//
// Run from ~/ps-dashboard on the server:
//   node migrate_activity_log.js
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id SERIAL PRIMARY KEY,
      tenant_id UUID,
      project_id UUID,
      module TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      action TEXT NOT NULL,
      actor_name TEXT,
      actor_email TEXT,
      summary TEXT NOT NULL,
      detail TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_log_project ON activity_log(project_id)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_log_module ON activity_log(module)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_log_tenant ON activity_log(tenant_id)`)

  const check = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = 'activity_log' ORDER BY ordinal_position`
  )
  console.log('activity_log columns:')
  console.log(JSON.stringify(check.rows, null, 2))
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
