// Parsing helpers for two different SuiteProjects Pro (NetSuite) CSV report exports:
//  - "Activity detail report" (e.g. "Project Tasks with GAP") - one row per task,
//    with Planned/Worked/Gap/Billed/Approved hours.
//  - "Services Project Dashboard Report" - one row per project, with Prime Resource,
//    % Complete, Contract Signed Date, Last time entry date, Services Backlog/Revenue.
// The report type is auto-detected from the header row so admins can import either
// one without picking a mode up front. Kept dependency-free (no csv-parse package)
// since both export formats are simple, quoted CSV with a title line before the
// real header row.

export type NetsuiteReportType = 'activity_detail' | 'dashboard'

export interface NetsuiteTaskRow {
  label: string
  idNumber: string | null
  taskName: string | null
  taskType: string | null
  plannedHours: number | null
  gapHours: number | null
  activityBudgetAmount: number | null
  activityBudgetCurrency: string | null
  projectPlannedHours: number | null
  projectWorkedHours: number | null
  projectGapHours: number | null
  projectBilledHours: number | null
  projectApprovedHours: number | null
}

export interface NetsuiteDashboardRow {
  label: string
  primeResource: string | null
  secondaryPrimeResource: string | null
  internalId: string | null
  client: string | null
  pctComplete: number | null
  contractSignedDate: string | null
  lastTimeEntryDate: string | null
  servicesBacklog: number | null
  servicesRevenue: number | null
}

export interface ParsedNetsuiteReport {
  reportType: NetsuiteReportType
  reportTitle: string | null
  skippedRowCount: number
  activityRows: NetsuiteTaskRow[]
  dashboardRows: NetsuiteDashboardRow[]
}

export interface ParsedLabel {
  customerCode: string
  businessLine: string
  rest: string
}

const LABEL_RE = /^([A-Z0-9]+)-([A-Z0-9]+)-(.+)$/

/** Splits a NetSuite "Project" label like "COLORADOSTUNIV-FC-P001 AiM IWMS License, Services"
 *  into its customer code, business-line code, and the remaining project code + description.
 *  Returns null for rows that aren't real project rows (report totals, footer/metadata lines). */
export function parseNetsuiteLabel(label: string): ParsedLabel | null {
  const m = LABEL_RE.exec(label.trim())
  if (!m) return null
  return { customerCode: m[1], businessLine: m[2], rest: m[3].trim() }
}

/** A human-friendly guess at a customer's display name from its NetSuite code,
 *  e.g. "COLORADOSTUNIV" -> "Coloradostuniv". Admins can always edit this before import. */
export function guessCustomerName(customerCode: string): string {
  return customerCode
    .toLowerCase()
    .replace(/^./, c => c.toUpperCase())
}

function parseOneCsvLine(line: string): string[] {
  const fields: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(cur)
        cur = ''
      } else {
        cur += ch
      }
    }
  }
  fields.push(cur)
  return fields
}

function toNumberOrNull(raw: string | undefined): number | null {
  if (raw === undefined) return null
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

function parseBudget(raw: string | undefined): { amount: number | null; currency: string | null } {
  if (!raw) return { amount: null, currency: null }
  const trimmed = raw.trim()
  if (trimmed === '') return { amount: null, currency: null }
  const m = /^(-?[\d.]+)\s+([A-Za-z]{2,4})$/.exec(trimmed)
  if (!m) return { amount: toNumberOrNull(trimmed), currency: null }
  return { amount: toNumberOrNull(m[1]), currency: m[2].toUpperCase() }
}

/** Parses a plain dollar-amount string, handling thousands separators, a leading
 *  "$", and accounting-style negatives in parentheses, e.g. "$1,234.56 " or "($19,345.97)". */
function toMoneyOrNull(raw: string | undefined): number | null {
  if (raw === undefined) return null
  let trimmed = raw.trim()
  if (trimmed === '') return null
  let negative = false
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    negative = true
    trimmed = trimmed.slice(1, -1).trim()
  }
  trimmed = trimmed.replace(/[$,]/g, '').trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  return negative ? -n : n
}

/** Converts an "M/D/YYYY" date string (as used in these NetSuite exports) to
 *  ISO "YYYY-MM-DD" for storage in a Postgres date column. Returns null for
 *  empty or unrecognized values rather than guessing. */
function toIsoDateOrNull(raw: string | undefined): string | null {
  if (raw === undefined) return null
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed)
  if (!m) return null
  const [, mo, da, yr] = m
  return `${yr}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`
}

/** Scans the file for the report's title line (if any) and its header row -
 *  the first row whose "Project" column is literally "Project". Works whether
 *  the title line is a single bare field or a quoted field followed by empty
 *  trailing commas (both formats appear across these NetSuite exports). */
function findReportHeader(lines: string[]): { reportTitle: string | null; header: string[]; headerIndex: number } {
  let reportTitle: string | null = null
  let headerIndex = -1
  let header: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const fields = parseOneCsvLine(lines[i])
    if (fields[0]?.trim() === 'Project') {
      header = fields.map(f => f.trim())
      headerIndex = i
      break
    }
    const nonEmpty = fields.filter(f => f.trim() !== '')
    if (i === 0 && reportTitle === null && nonEmpty.length === 1) {
      reportTitle = nonEmpty[0].trim()
    }
  }

  return { reportTitle, header, headerIndex }
}

/** Distinguishes the "Activity detail report" (task-level rows) from the
 *  "Services Project Dashboard Report" (one row per project) by looking for
 *  a column unique to each format. Defaults to activity_detail, the original
 *  supported format, if neither signature is found. */
export function detectNetsuiteReportType(header: string[]): NetsuiteReportType {
  if (header.includes('Task/Activity name') || header.includes('Planned Hours')) {
    return 'activity_detail'
  }
  if (header.some(h => h.startsWith('Total - Services Backlog')) || header.includes('Project - % Complete')) {
    return 'dashboard'
  }
  return 'activity_detail'
}

function parseActivityRows(lines: string[], header: string[], headerIndex: number): { rows: NetsuiteTaskRow[]; skippedRowCount: number } {
  const col = (name: string) => header.indexOf(name)
  const idx = {
    project: col('Project'),
    idNumber: col('ID Number'),
    taskName: col('Task/Activity name'),
    taskType: col('Project task type'),
    plannedHours: col('Planned Hours'),
    gapHours: col('Gap Hours'),
    activityBudget: col('Activity Budget'),
    projPlanned: col('Project - Planned hours'),
    projWorked: col('Project - Worked hours'),
    projGap: col('Project - Gap hours'),
    projBilled: col('Project - Billed hours'),
    projApproved: col('Project - Approved hours'),
  }

  const rows: NetsuiteTaskRow[] = []
  let skippedRowCount = 0

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const fields = parseOneCsvLine(lines[i])
    const rawLabel = fields[idx.project] ?? ''
    const parsed = parseNetsuiteLabel(rawLabel)
    if (!parsed) {
      skippedRowCount++
      continue
    }
    const budget = parseBudget(fields[idx.activityBudget])
    rows.push({
      label: rawLabel.trim(),
      idNumber: fields[idx.idNumber]?.trim() || null,
      taskName: fields[idx.taskName]?.trim() || null,
      taskType: fields[idx.taskType]?.trim() || null,
      plannedHours: toNumberOrNull(fields[idx.plannedHours]),
      gapHours: toNumberOrNull(fields[idx.gapHours]),
      activityBudgetAmount: budget.amount,
      activityBudgetCurrency: budget.currency,
      projectPlannedHours: toNumberOrNull(fields[idx.projPlanned]),
      projectWorkedHours: toNumberOrNull(fields[idx.projWorked]),
      projectGapHours: toNumberOrNull(fields[idx.projGap]),
      projectBilledHours: toNumberOrNull(fields[idx.projBilled]),
      projectApprovedHours: toNumberOrNull(fields[idx.projApproved]),
    })
  }

  return { rows, skippedRowCount }
}

function parseDashboardRows(lines: string[], header: string[], headerIndex: number): { rows: NetsuiteDashboardRow[]; skippedRowCount: number } {
  const col = (name: string) => header.indexOf(name)
  const backlogCol = header.findIndex(h => h.startsWith('Total - Services Backlog'))
  const revenueCol = header.findIndex(h => h.startsWith('Total - Services Revenue'))
  const idx = {
    project: col('Project'),
    primeResource: col('Project - Prime Resource'),
    secondaryPrimeResource: col('Project - Secondary Prime Resource'),
    internalId: col('Project - Internal id'),
    client: col('Project - Client'),
    pctComplete: col('Project - % Complete'),
    contractSignedDate: col('Project - Contract Signed Date'),
    lastTimeEntryDate: col('Project - Last time entry date'),
    servicesBacklog: backlogCol,
    servicesRevenue: revenueCol,
  }

  const rows: NetsuiteDashboardRow[] = []
  let skippedRowCount = 0

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const fields = parseOneCsvLine(lines[i])
    const rawLabel = fields[idx.project] ?? ''
    const parsed = parseNetsuiteLabel(rawLabel)
    if (!parsed) {
      skippedRowCount++
      continue
    }
    rows.push({
      label: rawLabel.trim(),
      primeResource: fields[idx.primeResource]?.trim() || null,
      secondaryPrimeResource: fields[idx.secondaryPrimeResource]?.trim() || null,
      internalId: fields[idx.internalId]?.trim() || null,
      client: fields[idx.client]?.trim() || null,
      pctComplete: toNumberOrNull(fields[idx.pctComplete]),
      contractSignedDate: toIsoDateOrNull(fields[idx.contractSignedDate]),
      lastTimeEntryDate: toIsoDateOrNull(fields[idx.lastTimeEntryDate]),
      servicesBacklog: toMoneyOrNull(fields[idx.servicesBacklog]),
      servicesRevenue: toMoneyOrNull(fields[idx.servicesRevenue]),
    })
  }

  return { rows, skippedRowCount }
}

/** Parses either supported NetSuite CSV export, auto-detecting which one from
 *  the header row. Handles each report's leading title line and trailing
 *  totals/footer rows automatically - any row whose "Project" column doesn't
 *  look like a real NetSuite project label is skipped. */
export function parseNetsuiteReportCsv(text: string): ParsedNetsuiteReport {
  const cleaned = text.replace(/^﻿/, '') // strip BOM
  const lines = cleaned.split(/\r\n|\n|\r/).filter(l => l.length > 0)

  const { reportTitle, header, headerIndex } = findReportHeader(lines)

  if (headerIndex === -1) {
    throw new Error('Could not find the report header row (expected a "Project" column).')
  }

  const reportType = detectNetsuiteReportType(header)

  if (reportType === 'dashboard') {
    const { rows, skippedRowCount } = parseDashboardRows(lines, header, headerIndex)
    return { reportType, reportTitle, skippedRowCount, activityRows: [], dashboardRows: rows }
  }

  const { rows, skippedRowCount } = parseActivityRows(lines, header, headerIndex)
  return { reportType, reportTitle, skippedRowCount, activityRows: rows, dashboardRows: [] }
}
