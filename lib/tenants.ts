import pool from '@/lib/db'
import { slugify } from '@/lib/slugify'

export async function findOrCreateTenant(name: string): Promise<string> {
  const trimmed = name.trim()
  const existing = await pool.query('SELECT id FROM tenants WHERE name = $1', [trimmed])
  if (existing.rows.length > 0) return existing.rows[0].id

  const baseSlug = slugify(trimmed)
  let slug = baseSlug
  let n = 1
  while (true) {
    const clash = await pool.query('SELECT id FROM tenants WHERE slug = $1', [slug])
    if (clash.rows.length === 0) break
    n++
    slug = `${baseSlug}-${n}`
  }

  const result = await pool.query(
    `INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id`,
    [trimmed, slug]
  )
  return result.rows[0].id
}
