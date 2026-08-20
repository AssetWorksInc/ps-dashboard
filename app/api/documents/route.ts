import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const UPLOAD_DIR = '/mnt/s3files/documents'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const fileName = searchParams.get('file')

    if (!fileName) {
      return NextResponse.json({ error: 'No file specified' }, { status: 400 })
    }

    // Security — prevent directory traversal
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '')

    // The core access-control check: only serve this file if a document
    // record exists pointing at it AND that document belongs to the
    // logged-in user's own tenant.
    const result = await pool.query(
      `SELECT id, tenant_id
       FROM shared_documents
       WHERE file_url LIKE '%' || $1`,
      [safeName]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (result.rows[0].tenant_id !== user.tenantId) {
      return NextResponse.json(
        { error: 'Not authorized to access this document' },
        { status: 403 }
      )
    }

    const filePath = join(UPLOAD_DIR, safeName)
    const fileBuffer = await readFile(filePath)

    // Determine content type
    const ext = safeName.split('.').pop()?.toLowerCase()
    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      txt: 'text/plain',
      csv: 'text/csv',
    }

    const contentType = contentTypes[ext || ''] || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeName}"`,
      }
    })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
