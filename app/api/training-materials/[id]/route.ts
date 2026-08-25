import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const EDITABLE_FIELDS = ['title', 'description', 'type', 'file_url', 'category', 'author', 'tags']

async function assertOwnership(id: string, tenantId: string): Promise<'not_found' | 'forbidden' | 'ok'> {
  const result = await pool.query(`SELECT tenant_id FROM training_materials WHERE id = $1`, [id])
  if (result.rows.length === 0) return 'not_found'
  if (result.rows[0].tenant_id !== tenantId) return 'forbidden'
  return 'ok'
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await params
    const ownership = await assertOwnership(id, user.tenantId)
    if (ownership === 'not_found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (ownership === 'forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const sets: string[] = []
    const values: any[] = []
    let i = 1
    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        sets.push(`${field} = $${i}`)
        values.push(body[field])
        i++
      }
    }
    if (sets.length === 0) {
      return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 })
    }
    values.push(id)

    const result = await pool.query(
      `UPDATE training_materials SET ${sets.join(', ')} WHERE id = $${i}
       RETURNING id, title, description, type, file_url, category, author, tags, created_at`,
      values
    )

    return NextResponse.json({ material: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await params
    const ownership = await assertOwnership(id, user.tenantId)
    if (ownership === 'not_found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (ownership === 'forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await pool.query(`DELETE FROM training_materials WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
