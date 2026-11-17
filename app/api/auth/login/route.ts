import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { cookies } from 'next/headers'
import { signSession, SESSION_MAX_AGE_SECONDS } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const result = await pool.query(
      `SELECT id, email, name, role
       FROM users
       WHERE email = $1
       AND password = crypt($2, password)`,
      [email, password]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = result.rows[0]

    // The cookie carries only a signed user id; name, role and tenant are always
    // read from the database (lib/auth.ts), never from the browser.
    const token = signSession(String(user.id))
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Server is missing AUTH_SECRET' },
        { status: 500 }
      )
    }
    const cookieStore = await cookies()
    cookieStore.set('ps_user', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/'
    })

    return NextResponse.json({
      success: true,
      name: user.name,
      role: user.role
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
