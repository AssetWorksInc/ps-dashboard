import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const UPLOAD_DIR = '/mnt/s3files/documents'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const category = formData.get('category') as string
    const projectId = formData.get('project_id') as string | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    // Tenant is always resolved from the authenticated session, never from
    // client-supplied form data.
    const tenantId = user.tenantId

    // If a project_id was supplied, make sure it actually belongs to this tenant.
    if (projectId) {
      const proj = await pool.query('SELECT tenant_id FROM projects WHERE id = $1', [projectId])
      if (proj.rows.length === 0 || proj.rows[0].tenant_id !== tenantId) {
        return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
      }
    }

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

    // Save record to database — uploaded_by comes from the session, not the client.
    const result = await pool.query(
      `INSERT INTO shared_documents
        (tenant_id, project_id, title, file_url, file_type, category, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, project_id, title, file_url, file_type, category, uploaded_by, created_at`,
      [tenantId, projectId || null, title || file.name, `/uploads/${fileName}`, ext, category || 'General', user.name || 'Portal User']
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
