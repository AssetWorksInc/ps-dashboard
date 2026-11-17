// Creates the two tables used by scripts/openair-ingest.js.
// Idempotent: safe to run more than once. Run BEFORE starting the ingest job.
const fs = require('fs'); const path = require('path'); const { Pool } = require('pg')
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
    CREATE TABLE IF NOT EXISTS openair_ingest_log (
      id bigserial PRIMARY KEY,
      s3_key text NOT NULL UNIQUE,
      status text NOT NULL,
      message text,
      row_count integer,
      matched_count integer,
      unmatched_count integer,
      projects_updated integer,
      report_date date,
      report_generated_at timestamp,
      processed_at timestamptz NOT NULL DEFAULT now()
    )`)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS openair_project_snapshots (
      id bigserial PRIMARY KEY,
      report_date date NOT NULL,
      generated_at timestamp NOT NULL,
      label text NOT NULL,
      project_id uuid,
      project_owner text,
      prime_resource text,
      contract_type text,
      project_stage text,
      budget_hours numeric,
      hours_to_date numeric,
      remaining_hours numeric,
      budget_fees numeric,
      fees_to_date numeric,
      total_invoiced numeric,
      invoiced_outstanding numeric,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (report_date, label)
    )`)
  // Added later so the Management Center can list every OpenAir project (even ones not in the portal yet).
  await pool.query(`ALTER TABLE openair_project_snapshots ADD COLUMN IF NOT EXISTS client_name text`)
  await pool.query(`ALTER TABLE openair_project_snapshots ADD COLUMN IF NOT EXISTS contract_signed_date date`)
  // Currency of the money columns for that project (OpenAir writes "444588.25 GBP" after Budget Fees). NULL = USD.
  await pool.query(`ALTER TABLE openair_project_snapshots ADD COLUMN IF NOT EXISTS currency text`)
  await pool.query(`CREATE INDEX IF NOT EXISTS openair_snapshots_project_idx ON openair_project_snapshots (project_id, report_date)`)
  for (const t of ['openair_ingest_log', 'openair_project_snapshots']) {
    const r = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [t])
    console.log('\n' + t); for (const c of r.rows) console.log('  ' + c.column_name + ' : ' + c.data_type)
  }
  console.log('\nMIGRATION_DONE')
  await pool.end()
}
main().catch(e => { console.error(e); process.exit(1) })
