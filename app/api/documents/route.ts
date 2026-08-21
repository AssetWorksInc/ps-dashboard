import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const result = await pool.query(
      `SELECT
        sd.id, sd.title, sd.file_url, sd.file_type,
        sd.category, sd.uploaded_by, sd.created_at
      FROM shared_documents sd
      WHERE sd.tenant_id = $1
      ORDER BY sd.created_at DESC`,
      [user.tenantId]
    )

    return NextResponse.json({ documents: result.rows })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
