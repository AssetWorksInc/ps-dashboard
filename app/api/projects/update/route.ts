import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function PATCH(req: Request) {
  try {
    const { id, health, status } = await req.json()

    await pool.query(
      `UPDATE projects
       SET health = COALESCE($1, health),
           status = COALESCE($2, status)
       WHERE id = $3`,
      [health, status, id]
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
