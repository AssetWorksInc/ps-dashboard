import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifySession } from '@/lib/session'

export type CurrentUser = {
  id: string
  tenantId: string
  name: string
  email: string
  role: string
}

/**
 * Reads the signed ps_user cookie set at login (see lib/session.ts), and
 * resolves everything about the user -- tenant, name, email and role -- fresh
 * from the database on every request. Nothing in the cookie except the signed
 * user id is trusted, so a customer cannot promote themselves to admin or
 * switch to another customer's account by editing their cookie.
 * Returns null if there's no valid session.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies()
  const session = verifySession(cookieStore.get('ps_user')?.value)
  if (!session) return null

  const result = await pool.query(
    'SELECT tenant_id, name, email, role FROM users WHERE id = $1',
    [session.id]
  )

  if (result.rows.length === 0 || !result.rows[0].tenant_id) return null
  const row = result.rows[0]

  return {
    id: session.id,
    tenantId: row.tenant_id,
    name: row.name || '',
    email: row.email || '',
    role: row.role === 'admin' ? 'admin' : 'customer',
  }
}
