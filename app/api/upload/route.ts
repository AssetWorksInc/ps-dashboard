import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import pool from '@/lib/db'

const UPLOAD_DIR = '/var/www/ps-portal/uploads'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const category = formData.get('category') as string
    const uploadedBy = formData.get('uploadedBy') as string
    const tenantSlug = formData.get('tenantSlug') as string || 'lakewood'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    // Get tenant ID
    const tenantResult = await pool.query(
      'SELECT id FROM tenants WHERE slug = $1',
      [tenantSlug]
    )
    if (tenantResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 })
    }
    const tenantId = tenantResult.rows[0].id

    // Create upload directory if it doesn't exist
    await mkdir(UPLOAD_DIR, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${safeName}`
    const filePath = join(UPLOAD_DIR, fileName)

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Get file extension
    const ext = file.name.split('.').pop()?.toLowerCase() || 'file'

    // Save record to database
    const result = await pool.query(
      `INSERT INTO shared_documents
        (tenant_id, title, file_url, file_type, category, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, file_url, file_type, category, uploaded_by, created_at`,
      [tenantId, title || file.name, `/uploads/${fileName}`, ext, category || 'General', uploadedBy || 'Portal User']
    )

    return NextResponse.json({
      success: true,
      document: result.rows[0]
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
