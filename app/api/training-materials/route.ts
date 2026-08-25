import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, type, file_url, category, author, tags } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO training_materials
        (tenant_id, title, description, type, file_url, category, author, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, description, type, file_url, category, author, tags, created_at`,
      [
        user.tenantId,
        title,
        description || null,
        type || 'guide',
        file_url || null,
        category || null,
        author || null,
        Array.isArray(tags) ? tags : null,
      ]
    )

    return NextResponse.json({ material: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
