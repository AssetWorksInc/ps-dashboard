import { cookies } from 'next/headers'
import pool from '@/lib/db'

export type CurrentUser = {
  id: string
  tenantId: string
  name: string
  email: string
  role: string
}

/**
 * Reads the ps_user cookie set at login, and resolves the user's
 * tenant fresh from the database every time (never trusts a tenant
 * value from the client). Returns null if there's no valid session.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('ps_user')?.value
  if (!raw) return null

  let parsed: { id?: string; name?: string; email?: string; role?: string }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (!parsed.id) return null

  const result = await pool.query(
    'SELECT tenant_id FROM users WHERE id = $1',
    [parsed.id]
  )

  if (result.rows.length === 0 || !result.rows[0].tenant_id) return null

  return {
    id: parsed.id,
    tenantId: result.rows[0].tenant_id,
    name: parsed.name || '',
    email: parsed.email || '',
    role: parsed.role || 'customer',
  }
}
