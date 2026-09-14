// One-time seed of Jira Customer Care (CC) and Maintenance Engineering (ME) tickets
// into the existing `tickets` table, pulled as a snapshot (no live Jira API token
// exists yet — see claude/portal-dev-changelog.md). Safe to re-run: it deletes any
// prior rows with external_source='jira' before reinserting.
//
// Usage: node scripts/seed-tickets.js

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function loadEnv() {
  let envFile = '';
  for (const f of ['.env.local', '.env', '.env.production']) {
    if (fs.existsSync(f)) envFile += fs.readFileSync(f, 'utf8') + '\n';
  }
  const env = {};
  envFile.split('\n').forEach(line => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
  return env;
}

async function main() {
  const env = loadEnv();
  const connectionString = env.DATABASE_URL || env.POSTGRES_URL || env.PG_CONNECTION_STRING;
  const pool = connectionString
    ? new Pool({ connectionString })
    : new Pool({
        host: env.PGHOST || env.DB_HOST,
        user: env.PGUSER || env.DB_USER,
        password: env.PGPASSWORD || env.DB_PASSWORD,
        database: env.PGDATABASE || env.DB_NAME,
        port: env.PGPORT || env.DB_PORT || 5432,
      });

  const dataPath = path.join(__dirname, 'seed-tickets-data.json');
  const records = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Loaded ${records.length} ticket records from ${dataPath}`);

  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at timestamptz;
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS url text;
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS issue_type text;
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS org_name text;
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS customer_visible boolean DEFAULT false;
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS jira_project text;
    `);
    console.log('Schema check/extend done.');

    const tenantRes = await client.query('SELECT id, slug FROM tenants');
    const tenantBySlug = {};
    for (const row of tenantRes.rows) tenantBySlug[row.slug] = row.id;
    console.log(`Loaded ${tenantRes.rows.length} tenants for matching.`);

    await client.query('BEGIN');
    const del = await client.query(`DELETE FROM tickets WHERE external_source = 'jira'`);
    console.log(`Cleared ${del.rowCount} previously-seeded jira rows.`);

    let inserted = 0;
    let tenantMatched = 0;
    let projectMatched = 0;

    for (const r of records) {
      const tenantId = r.tenant_slug ? tenantBySlug[r.tenant_slug] || null : null;
      if (tenantId) tenantMatched++;
      if (r.project_id) projectMatched++;

      await client.query(
        `INSERT INTO tickets (
           id, tenant_id, project_id, title, description, status, priority,
           submitted_by, assigned_to, external_id, external_source,
           created_at, resolved_at, updated_at, url, issue_type, org_name,
           customer_visible, jira_project
         ) VALUES (
           gen_random_uuid(), $1, $2, $3, NULL, $4, $5,
           $6, $7, $8, 'jira',
           $9, NULL, $10, $11, $12, $13,
           $14, $15
         )`,
        [
          tenantId,
          r.project_id || null,
          r.title,
          r.status,
          r.priority,
          r.submitted_by || null,
          r.assigned_to || null,
          r.external_id,
          r.created_at,
          r.updated_at,
          r.url,
          r.issue_type || null,
          r.org_name || null,
          r.customer_visible,
          r.jira_project,
        ]
      );
      inserted++;
    }

    await client.query('COMMIT');
    console.log(`Inserted ${inserted} tickets.`);
    console.log(`  matched to a tenant: ${tenantMatched}`);
    console.log(`  matched to a specific project: ${projectMatched}`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Seed failed, rolled back:', e.message);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
