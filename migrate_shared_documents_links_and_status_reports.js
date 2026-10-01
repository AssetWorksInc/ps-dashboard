// One-time migration for the Project Center Documents tab: lets a document
// be a URL link instead of an uploaded file, and adds a "Status Reports"
// section (PDF upload or URL link, each with its own date stamp) alongside
// the existing Reference Documents / Project Checklist content.
//
// shared_documents gains:
//   - url TEXT (nullable) -- set instead of file_url when a document is a
//     link rather than an uploaded file. file_type is 'link' for these rows.
//   - report_date DATE (nullable) -- the date stamp on a Status Report entry
//     (the period the report covers, not the upload timestamp). Unused by
//     plain Reference Documents, where created_at already serves that role.
// file_url is relaxed to nullable, since a link-type row has no file.
//
// category values already in use: 'SOP' (Reference Documents). This adds a
// new 'StatusReport' category alongside it -- same table, same routes, no
// new table needed.
//
// Safe to re-run: ADD COLUMN IF NOT EXISTS, and DROP NOT NULL is a no-op if
// the column is already nullable.
//
// Run from ~/ps-dashboard on the server:
//   node migrate_shared_documents_links_and_status_reports.js
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
  await pool.query(`ALTER TABLE shared_documents ADD COLUMN IF NOT EXISTS url TEXT`)
  await pool.query(`ALTER TABLE shared_documents ADD COLUMN IF NOT EXISTS report_date DATE`)
  await pool.query(`ALTER TABLE shared_documents ALTER COLUMN file_url DROP NOT NULL`)

  const cols = await pool.query(
    `SELECT column_name, data_type, is_nullable FROM information_schema.columns
     WHERE table_name = 'shared_documents' ORDER BY ordinal_position`
  )
  console.log('shared_documents columns:')
  console.log(JSON.stringify(cols.rows, null, 2))

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
