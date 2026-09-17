#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

// A bare `node` invocation doesn't get Next.js's automatic .env loading,
// so pull DATABASE_URL from .env.local / .env ourselves if it's not
// already in the shell environment.
for (const file of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), file)
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/)
    for (const line of lines) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line)
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in environment or .env/.env.local')
  process.exit(1)
}

const sql = fs.readFileSync(path.join(process.cwd(), 'migration_team_load.sql'), 'utf8')
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false })

pool.query(sql)
  .then(() => {
    console.log('Migration applied successfully.')
    return pool.end()
  })
  .catch((err) => {
    console.error('Migration failed:', err.message)
    process.exit(1)
  })
