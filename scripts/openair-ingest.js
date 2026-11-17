#!/usr/bin/env node
/*
 * OpenAir daily report ingest.
 *
 * OpenAir emails a scheduled CSV ("All open Project Overview info-Autorun") to an
 * address that AWS SES receives and drops, as a raw email, into an S3 bucket. This
 * job (run every few minutes by pm2) lists that bucket, reads each email it has not
 * seen before, pulls out the CSV attachment, validates it, stores a snapshot per
 * project, and fills Budgeted / Used hours on matched projects.
 *
 * - No keys: AWS credentials come from the server's instance role.
 * - Read-only on S3: processed files are tracked in openair_ingest_log, never deleted.
 * - Safe to re-run: each (report date, project) is stored once; a repeat or older
 *   file never overwrites newer data.
 * - A project whose budget a person set by hand (budget_manual_override) is not touched.
 */
const fs = require('fs'); const path = require('path')
for (const file of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), file)
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
    }
  }
}
const { Pool } = require('pg')
const { simpleParser } = require('mailparser')

const BUCKET = process.env.OPENAIR_S3_BUCKET || 'ps-portal-openair-reports'
const PREFIX = process.env.OPENAIR_S3_PREFIX || 'openair-reports/'
const REGION = process.env.OPENAIR_S3_REGION || process.env.AWS_REGION || 'us-east-1'
const ALLOWED_SENDER_DOMAINS = (process.env.OPENAIR_ALLOWED_SENDER_DOMAINS || 'openair.com,netsuite.com,oracle.com,assetworks.com')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
const MIN_ROWS = parseInt(process.env.OPENAIR_MIN_ROWS || '10', 10)
const MAX_BYTES = 15 * 1024 * 1024
const LOCK_ID = 7351001

const REQUIRED = [
  'Project', 'Project owner', 'Project stage', 'Budget Hours', 'Project to Date Charge Hours',
  'Remaining Budget Hours', 'Budget Fees (USD)', 'Project to Date Charge Fees (USD)',
  'Total Invoiced (USD)', 'Total Invoiced Outstanding (USD)',
]

// ---------- CSV ----------
function parseCsv(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
  const rows = []; let row = []; let field = ''; let inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false }
      else field += c
    } else if (c === '"') inQ = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''; rows.push(row); row = []
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}
function num(s) {
  if (s == null) return null
  const t = String(s).replace(/USD/g, '').replace(/[%,$]/g, '').trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}
function validIso(t) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t || ''); if (!m) return null
  const y = +m[1], mo = +m[2], d = +m[3]
  if (y < 1900 || y > 2200 || mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, mo - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d ? t : null
}
// OpenAir writes "0000-00-00" for an empty date; anything that is not a real date becomes null.
function isoOrMdy(s) { const t = (s || '').trim(); if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return validIso(t); return validIso(mdyToIso(t)) }
function mdyToIso(s) { const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s || ''); return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : null }

// Returns { ok:true, reportDate, generatedAt, rows } or { ok:false, reason }
function parseReport(csvText) {
  const all = parseCsv(csvText)
  if (all.length < 3) return { ok: false, reason: 'file too short' }
  const title = (all[0][0] || '')
  if (!/Project Overview/i.test(title)) return { ok: false, reason: 'title line does not look like the Project Overview report' }
  const header = all[1]
  const missing = REQUIRED.filter(c => !header.includes(c))
  if (missing.length) return { ok: false, reason: 'missing columns: ' + missing.join('; ') }
  const reportDate = mdyToIso((/effective\s+(\d{1,2}\/\d{1,2}\/\d{4})/i.exec(title) || [])[1])
  if (!reportDate) return { ok: false, reason: 'could not read the report date from the title line' }
  let generatedAt = null
  for (const r of all.slice(2)) {
    const g = /Generated on:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(r[0] || '')
    if (g) {
      let h = parseInt(g[4], 10) % 12; if (g[6].toUpperCase() === 'PM') h += 12
      generatedAt = `${g[3]}-${g[1].padStart(2, '0')}-${g[2].padStart(2, '0')} ${String(h).padStart(2, '0')}:${g[5]}:00`
    }
  }
  if (!generatedAt) generatedAt = reportDate + ' 00:00:00'
  const ix = {}; header.forEach((c, i) => { ix[c] = i })
  const rows = []
  for (const r of all.slice(2)) {
    if (r.length !== header.length) continue
    const label = (r[ix['Project']] || '').trim()
    if (!label) continue
    rows.push({
      label,
      clientName: ix['Client'] != null ? ((r[ix['Client']] || '').trim() || null) : null,
      contractSignedDate: ix['Contract Signed Date'] != null ? (isoOrMdy(r[ix['Contract Signed Date']])) : null,
      projectOwner: r[ix['Project owner']] || null,
      primeResource: ix['Prime Resource'] != null ? (r[ix['Prime Resource']] || null) : null,
      contractType: ix['Contract Type'] != null ? ((r[ix['Contract Type']] || '').trim() || null) : null,
      projectStage: r[ix['Project stage']] || null,
      budgetHours: num(r[ix['Budget Hours']]),
      hoursToDate: num(r[ix['Project to Date Charge Hours']]),
      remainingHours: num(r[ix['Remaining Budget Hours']]),
      budgetFees: num(r[ix['Budget Fees (USD)']]),
      feesToDate: num(r[ix['Project to Date Charge Fees (USD)']]),
      totalInvoiced: num(r[ix['Total Invoiced (USD)']]),
      invoicedOutstanding: num(r[ix['Total Invoiced Outstanding (USD)']]),
    })
  }
  if (rows.length < MIN_ROWS) return { ok: false, reason: `only ${rows.length} project rows (minimum ${MIN_ROWS})` }
  return { ok: true, reportDate, generatedAt, rows }
}

// ---------- email ----------
// Returns { ok:true, csv, info } or { ok:false, status, reason }
async function csvFromEmail(buf) {
  const mail = await simpleParser(buf)
  const hdr = (k) => { const v = mail.headers.get(k); return v == null ? '' : String(v).trim() }
  const spam = hdr('x-ses-spam-verdict').toUpperCase(); const virus = hdr('x-ses-virus-verdict').toUpperCase()
  const from = (mail.from && mail.from.value && mail.from.value[0] && mail.from.value[0].address || '').toLowerCase()
  const info = `from=${from || '?'} spam=${spam || 'n/a'} virus=${virus || 'n/a'}`
  const isCsv = a => /\.csv$/i.test(a.filename || '') || /csv/i.test(a.contentType || '')
  let csvAtt = (mail.attachments || []).find(isCsv)
  if (!csvAtt) {
    // A person forwarding the report "as attachment" wraps the original email inside this one.
    const inner = (mail.attachments || []).find(a => /rfc822/i.test(a.contentType || ''))
    if (inner) { const m2 = await simpleParser(inner.content); csvAtt = (m2.attachments || []).find(isCsv) }
  }
  if (!csvAtt) return { ok: false, status: 'skipped', reason: 'no CSV attachment (' + info + ')' }
  if (spam === 'FAIL' || virus === 'FAIL') return { ok: false, status: 'rejected', reason: 'failed spam/virus check (' + info + ')' }
  const domain = from.split('@')[1] || ''
  if (!ALLOWED_SENDER_DOMAINS.some(d => domain === d || domain.endsWith('.' + d))) {
    return { ok: false, status: 'rejected', reason: 'sender domain not allowed (' + info + ')' }
  }
  return { ok: true, csv: csvAtt.content.toString('utf8'), info: info + ' file=' + (csvAtt.filename || '?') }
}

// ---------- database ----------
async function logRow(client, key, status, message, extra = {}) {
  await client.query(
    `INSERT INTO openair_ingest_log
       (s3_key, status, message, row_count, matched_count, unmatched_count, projects_updated, report_date, report_generated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (s3_key) DO NOTHING`,
    [key, status, String(message).slice(0, 500), extra.rows ?? null, extra.matched ?? null, extra.unmatched ?? null,
     extra.updated ?? null, extra.reportDate ?? null, extra.generatedAt ?? null])
}

async function matchProjects(client, labels) {
  const out = new Map()
  const viaMap = await client.query(
    `SELECT netsuite_project_label AS label, project_id FROM netsuite_project_map WHERE netsuite_project_label = ANY($1::text[])`, [labels])
  const byLabel = new Map()
  for (const r of viaMap.rows) { if (!byLabel.has(r.label)) byLabel.set(r.label, new Set()); byLabel.get(r.label).add(r.project_id) }
  for (const [l, s] of byLabel) if (s.size === 1) out.set(l, [...s][0])
  const rest = labels.filter(l => !out.has(l) && !byLabel.has(l))
  if (rest.length) {
    const lower = rest.map(l => l.toLowerCase().trim())
    const viaName = await client.query(`SELECT id, lower(btrim(name)) AS n FROM projects WHERE lower(btrim(name)) = ANY($1::text[])`, [lower])
    const byName = new Map()
    for (const r of viaName.rows) { if (!byName.has(r.n)) byName.set(r.n, new Set()); byName.get(r.n).add(r.id) }
    for (const l of rest) { const s = byName.get(l.toLowerCase().trim()); if (s && s.size === 1) out.set(l, [...s][0]) }
  }
  return out
}

// Processes one raw email. Returns a short status string. Throws only on unexpected (retryable) errors.
async function ingestBuffer(pool, key, buf) {
  const e = await csvFromEmail(buf)
  if (!e.ok) { await logRow(pool, key, e.status, e.reason); return e.status + ': ' + e.reason }
  const rep = parseReport(e.csv)
  if (!rep.ok) { await logRow(pool, key, 'rejected', rep.reason + ' (' + e.info + ')'); return 'rejected: ' + rep.reason }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const labels = rep.rows.map(r => r.label)
    const matches = await matchProjects(client, labels)
    const prev = await client.query(`SELECT max(generated_at) AS g FROM openair_project_snapshots`)
    const newest = !prev.rows[0].g || new Date(rep.generatedAt.replace(' ', 'T') + 'Z') >= new Date(prev.rows[0].g.toISOString ? prev.rows[0].g.toISOString() : prev.rows[0].g)

    for (const r of rep.rows) {
      await client.query(
        `INSERT INTO openair_project_snapshots
           (report_date, generated_at, label, project_id, project_owner, prime_resource, contract_type, project_stage,
            budget_hours, hours_to_date, remaining_hours, budget_fees, fees_to_date, total_invoiced, invoiced_outstanding,
            client_name, contract_signed_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         ON CONFLICT (report_date, label) DO UPDATE SET
           generated_at = EXCLUDED.generated_at, project_id = EXCLUDED.project_id, project_owner = EXCLUDED.project_owner,
           prime_resource = EXCLUDED.prime_resource, contract_type = EXCLUDED.contract_type, project_stage = EXCLUDED.project_stage,
           budget_hours = EXCLUDED.budget_hours, hours_to_date = EXCLUDED.hours_to_date, remaining_hours = EXCLUDED.remaining_hours,
           budget_fees = EXCLUDED.budget_fees, fees_to_date = EXCLUDED.fees_to_date, total_invoiced = EXCLUDED.total_invoiced,
           invoiced_outstanding = EXCLUDED.invoiced_outstanding,
           client_name = EXCLUDED.client_name, contract_signed_date = EXCLUDED.contract_signed_date
         WHERE EXCLUDED.generated_at >= openair_project_snapshots.generated_at`,
        [rep.reportDate, rep.generatedAt, r.label, matches.get(r.label) || null, r.projectOwner, r.primeResource, r.contractType,
         r.projectStage, r.budgetHours, r.hoursToDate, r.remainingHours, r.budgetFees, r.feesToDate, r.totalInvoiced, r.invoicedOutstanding, r.clientName, r.contractSignedDate])
    }

    let updated = 0
    if (newest) {
      // Same rule as the NetSuite import: a budget a person set by hand is never overwritten.
      const u = await client.query(
        `UPDATE projects p SET
           budget_hours_total = CASE WHEN s.budget_hours > 0 THEN s.budget_hours ELSE p.budget_hours_total END,
           budget_hours_used = COALESCE(s.hours_to_date, p.budget_hours_used)
         FROM openair_project_snapshots s
         WHERE s.report_date = $1 AND s.generated_at = $2 AND s.project_id = p.id
           AND p.budget_manual_override IS NOT TRUE`, [rep.reportDate, rep.generatedAt])
      updated = u.rowCount
    }
    const matched = rep.rows.filter(r => matches.has(r.label)).length
    const msg = `ok (${e.info})` + (newest ? '' : ' [older than newest file: stored, projects not updated]')
    await logRow(client, key, 'ok', msg, { rows: rep.rows.length, matched, unmatched: rep.rows.length - matched, updated, reportDate: rep.reportDate, generatedAt: rep.generatedAt })
    await client.query('COMMIT')
    return `ok: ${rep.rows.length} rows, ${matched} matched, ${rep.rows.length - matched} unmatched, ${updated} projects updated`
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally { client.release() }
}

// ---------- main ----------
async function main() {
  const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false })
  const lock = await pool.query('SELECT pg_try_advisory_lock($1) AS ok', [LOCK_ID])
  if (!lock.rows[0].ok) { console.log('another run is in progress, exiting'); await pool.end(); return }
  const s3 = new S3Client({ region: REGION, followRegionRedirects: true })
  const stamp = () => new Date().toISOString()
  try {
    const objects = []; let token
    do {
      const r = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: PREFIX, ContinuationToken: token }))
      for (const o of r.Contents || []) if (o.Key && !o.Key.endsWith('/')) objects.push(o)
      token = r.IsTruncated ? r.NextContinuationToken : undefined
    } while (token)
    const seen = new Set()
    if (objects.length) {
      const r = await pool.query('SELECT s3_key FROM openair_ingest_log WHERE s3_key = ANY($1::text[])', [objects.map(o => o.Key)])
      for (const x of r.rows) seen.add(x.s3_key)
    }
    const todo = objects.filter(o => !seen.has(o.Key)).sort((a, b) => new Date(a.LastModified) - new Date(b.LastModified))
    console.log(`${stamp()} bucket=${BUCKET} objects=${objects.length} new=${todo.length}`)
    for (const o of todo) {
      try {
        if (o.Size > MAX_BYTES) { await logRow(pool, o.Key, 'rejected', 'file larger than 15 MB'); console.log(o.Key, '-> rejected (too large)'); continue }
        const g = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: o.Key }))
        const buf = Buffer.from(await g.Body.transformToByteArray())
        console.log(o.Key, '->', await ingestBuffer(pool, o.Key, buf))
      } catch (err) {
        console.error(`${stamp()} ERROR on ${o.Key}: ${err && err.message}`)   // not logged as done, so the next run retries it
      }
    }
  } finally {
    await pool.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {})
    await pool.end()
  }
}

module.exports = { parseCsv, parseReport, csvFromEmail, ingestBuffer, num }
if (require.main === module) main().then(() => { console.log('INGEST_DONE') }).catch(e => { console.error(e); process.exit(1) })
