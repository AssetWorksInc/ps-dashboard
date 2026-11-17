import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { cookies } from 'next/headers'

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

    const cookieStore = await cookies()
    cookieStore.set('ps_user', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
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
