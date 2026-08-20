import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { join, basename } from 'path'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const UPLOAD_DIR = '/mnt/s3files/documents'

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ success: false, error: 'No document ID provided' }, { status: 400 })
    }

    // Get the document record first
    const result = await pool.query(
      'SELECT id, tenant_id, file_url FROM shared_documents WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 })
    }

    const doc = result.rows[0]

    // Make sure this document actually belongs to the logged-in user's tenant
    if (doc.tenant_id !== user.tenantId) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this document' },
        { status: 403 }
      )
    }

    // Delete file from the S3 Files mount
    try {
      const fileName = doc.file_url ? basename(doc.file_url) : null
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
