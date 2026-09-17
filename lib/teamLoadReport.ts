// Parsing + mapping helpers for the Team & Load capacity/utilization import.
//
// Unlike the NetSuite import (lib/netsuiteReport.ts), there is no fixed,
// known report format here: the OpenAir export an admin pulls varies from
// pull to pull (different column names, different column order, sometimes
// extra columns). So instead of auto-detecting a report type from a fixed
// header signature, this parses the file generically (header row + data
// rows, each row returned as a plain header->value record) and offers a
// best-guess column mapping that the admin reviews and adjusts in the UI
// before anything is written to the database. Kept dependency-free (no
// csv-parse package), matching the rest of this codebase.

export type TeamLoadFieldKey = 'consultantName' | 'plannedHours' | 'capacityHours' | 'utilizationPct'

export interface TeamLoadMapping {
  consultantName: string | null
  plannedHours: string | null
  capacityHours: string | null
  utilizationPct: string | null
}

export interface ParsedTeamLoadFile {
  header: string[]
  rows: Record<string, string>[]
  suggestedMapping: TeamLoadMapping
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

/** Some exports (like OpenAir's) lead with a one-field report title line
 *  before the real header row. If the first line has exactly one non-empty
 *  field and there's a second line with more than one, treat the first as
 *  a title and skip it. Otherwise the first line is the header. */
function findHeaderRowIndex(lineFields: string[][]): number {
  if (lineFields.length === 0) return -1
  const first = lineFields[0].filter((f) => f.trim() !== '')
  if (first.length === 1 && lineFields.length > 1) {
    return 1
  }
  return 0
}

export function toNumberOrNull(raw: string | undefined | null): number | null {
  if (raw === undefined || raw === null) return null
  let trimmed = raw.trim()
  if (trimmed === '') return null
  trimmed = trimmed.replace(/%$/, '').replace(/,/g, '')
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

/** Best-effort guess at which uploaded column is which target field, based
 *  on keyword matches in the header text. The admin can override every
 *  guess in the UI before committing -- this only saves them a click when
 *  the guess is right. */
export function guessColumnMapping(header: string[]): TeamLoadMapping {
  const find = (keywords: string[], exclude: string[] = []) => {
    const idx = header.findIndex((h) => {
      const low = h.toLowerCase()
      if (exclude.some((x) => low.includes(x))) return false
      return keywords.some((k) => low.includes(k))
    })
    return idx === -1 ? null : header[idx]
  }

  return {
    consultantName: find(['consultant', 'resource', 'employee', 'staff', 'name'], ['project', 'task', 'client', 'customer']),
    plannedHours: find(['planned', 'allocated', 'assigned', 'scheduled'], ['capacity']),
    capacityHours: find(['capacity', 'available hours', 'total hours', 'max hours']),
    utilizationPct: find(['utilization', 'utilisation', '% util', 'percent']),
  }
}

/** Parses an uploaded CSV into a header + row records, with a best-guess
 *  column mapping. Throws if no usable header row can be found. */
export function parseTeamLoadCsv(text: string): ParsedTeamLoadFile {
  const cleaned = text.replace(/^\uFEFF/, '') // strip BOM
  const lines = cleaned.split(/\r\n|\n|\r/).filter((l) => l.length > 0)
  const lineFields = lines.map(parseOneCsvLine)

  const headerIdx = findHeaderRowIndex(lineFields)
  if (headerIdx === -1) {
    throw new Error('Could not find a header row in this file.')
  }

  const header = lineFields[headerIdx].map((f) => f.trim()).filter((f) => f !== '')
  if (header.length === 0) {
    throw new Error('The header row in this file has no columns.')
  }

  const rows: Record<string, string>[] = []
  for (let i = headerIdx + 1; i < lineFields.length; i++) {
    const fields = lineFields[i]
    if (fields.every((f) => f.trim() === '')) continue
    const record: Record<string, string> = {}
    header.forEach((col, colIdx) => {
      record[col] = (fields[colIdx] ?? '').trim()
    })
    rows.push(record)
  }

  return { header, rows, suggestedMapping: guessColumnMapping(header) }
}

export interface AggregatedConsultantRow {
  consultantName: string
  plannedHours: number | null
  capacityHours: number | null
  utilizationPct: number | null
  occurrences: number
  extra: Record<string, string>
}

/** Applies a confirmed column mapping to the parsed rows, aggregating by
 *  consultant name. OpenAir capacity exports can list one row per
 *  project/assignment per person, so planned hours are summed across
 *  duplicate names; capacity and utilization are assumed constant per
 *  person and taken from the first row that has them. Any uploaded column
 *  not used in the mapping is kept per-consultant in `extra` (from the
 *  first row seen) so nothing is silently dropped. */
export function aggregateTeamLoadRows(
  rows: Record<string, string>[],
  header: string[],
  mapping: TeamLoadMapping
): AggregatedConsultantRow[] {
  if (!mapping.consultantName) return []

  const mappedColumns = new Set(
    [mapping.consultantName, mapping.plannedHours, mapping.capacityHours, mapping.utilizationPct].filter(
      (c): c is string => !!c
    )
  )
  const extraColumns = header.filter((h) => !mappedColumns.has(h))

  const byName = new Map<string, AggregatedConsultantRow>()

  for (const row of rows) {
    const name = (row[mapping.consultantName] || '').trim()
    if (!name) continue

    const planned = mapping.plannedHours ? toNumberOrNull(row[mapping.plannedHours]) : null
    const capacity = mapping.capacityHours ? toNumberOrNull(row[mapping.capacityHours]) : null
    const util = mapping.utilizationPct ? toNumberOrNull(row[mapping.utilizationPct]) : null

    const existing = byName.get(name)
    if (!existing) {
      const extra: Record<string, string> = {}
      for (const col of extraColumns) {
        if (row[col]) extra[col] = row[col]
      }
      byName.set(name, {
        consultantName: name,
        plannedHours: planned,
        capacityHours: capacity,
        utilizationPct: util,
        occurrences: 1,
        extra,
      })
    } else {
      existing.occurrences += 1
      if (planned !== null) {
        existing.plannedHours = (existing.plannedHours ?? 0) + planned
      }
      if (existing.capacityHours === null && capacity !== null) existing.capacityHours = capacity
      if (existing.utilizationPct === null && util !== null) existing.utilizationPct = util
    }
  }

  const result = Array.from(byName.values())
  for (const r of result) {
    if (r.utilizationPct === null && r.plannedHours !== null && r.capacityHours !== null && r.capacityHours > 0) {
      r.utilizationPct = Math.round((r.plannedHours / r.capacityHours) * 1000) / 10
    }
  }
  return result
}
