import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        sd.id, sd.title, sd.file_url, sd.file_type,
        sd.category, sd.uploaded_by, sd.created_at
      FROM shared_documents sd
      JOIN tenants t ON sd.tenant_id = t.id
      WHERE t.slug = 'lakewood'
      ORDER BY sd.created_at DESC
    `)
    return NextResponse.json({ documents: result.rows })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
