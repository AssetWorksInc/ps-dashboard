// One-time migration for the Accounts page (Management Center): adds a CSM
// name and a manually-set CS health status to each tenant, and creates a
// renewals table to track contract end date and renewal-pipeline stage per
// customer. Both are brand new concepts -- nothing like this exists in the
// schema today.
//
// cs_health follows the same "a person sets it by hand" convention as
// engagement_status on Portfolio, but uses the simpler three-value
// Green / Amber / Red scale a CSM would use for a book-of-business review,
// rather than the six-value engagement_status vocabulary.
//
// renewals is one row per renewal cycle; the app only ever reads the most
// recently created row per tenant as "the current renewal," so re-running a
// renewal (a new contract term) is just another INSERT, and history is kept
// for free.
//
// Safe to re-run: ALTER TABLE ... ADD COLUMN IF NOT EXISTS and
// CREATE TABLE / INDEX ... IF NOT EXISTS.
//
// Run from ~/ps-dashboard on the server:
//   node migrate_accounts_csm_health_renewals.js
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
  await pool.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS csm_name TEXT`)
  await pool.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cs_health TEXT`)
  await pool.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cs_health_note TEXT`)

  // gen_random_uuid() is built into Postgres 14+, but this extension keeps
  // the migration safe on older Postgres too.
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS renewals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      contract_end DATE,
      stage TEXT NOT NULL DEFAULT 'Not started',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_renewals_tenant ON renewals(tenant_id)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_renewals_contract_end ON renewals(contract_end)`)

  const tenantCols = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = 'tenants' ORDER BY ordinal_position`
  )
  console.log('tenants columns:')
  console.log(JSON.stringify(tenantCols.rows, null, 2))

  const renewalCols = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = 'renewals' ORDER BY ordinal_position`
  )
  console.log('renewals columns:')
  console.log(JSON.stringify(renewalCols.rows, null, 2))

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
