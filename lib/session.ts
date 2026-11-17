import { createHmac, timingSafeEqual } from 'crypto'

// Signed login cookie. The value is "<payload>.<signature>" where the payload is
// base64url JSON { id, exp } and the signature is an HMAC-SHA256 of the payload
// using AUTH_SECRET. Anyone can read it, but nobody can change it (or invent one)
// without the secret, so the user id inside it can be trusted.

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function secret(): string | null {
  const s = process.env.AUTH_SECRET
  return s && s.length >= 32 ? s : null
}

function sign(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('base64url')
}

/** Returns the cookie value to store, or null if AUTH_SECRET is not configured. */
export function signSession(userId: string): string | null {
  const key = secret()
  if (!key) return null
  const payload = Buffer.from(
    JSON.stringify({ id: userId, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS })
  ).toString('base64url')
  return `${payload}.${sign(payload, key)}`
}

/** Returns the user id if the cookie is genuine and unexpired, otherwise null. */
export function verifySession(token: string | undefined | null): { id: string } | null {
  const key = secret()
  if (!key || !token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payload, sig] = parts
  const expected = Buffer.from(sign(payload, key))
  const given = Buffer.from(sig)
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof data?.id !== 'string' || !data.id) return null
    if (typeof data?.exp !== 'number' || data.exp < Math.floor(Date.now() / 1000)) return null
    return { id: data.id }
  } catch {
    return null
  }
}
