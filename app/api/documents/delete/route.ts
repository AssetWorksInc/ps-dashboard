import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { join } from 'path'
import pool from '@/lib/db'

const UPLOAD_DIR = '/var/www/ps-portal/uploads'

export async function DELETE(req: NextRequest) {
  try {
    const { id, fileUrl } = await req.json()

    if (!id) {
      return NextResponse.json({ success: false, error: 'No document ID provided' }, { status: 400 })
    }

    // Get the document record first
    const result = await pool.query(
      'SELECT id, file_url FROM shared_documents WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 })
    }

    const doc = result.rows[0]

    // Delete file from VM disk
    try {
      const fileName = doc.file_url?.split('/').pop()
      if (fileName) {
        const filePath = join(UPLOAD_DIR, fileName)
        await unlink(filePath)
      }
    } catch {
      // File may not exist on disk — continue to delete DB record
      console.log('File not found on disk — deleting DB record only')
    }

    // Delete record from database
    await pool.query('DELETE FROM shared_documents WHERE id = $1', [id])

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
