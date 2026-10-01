import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { logActivity } from '@/lib/activityLog'

// Companion to /api/upload: saves a shared_documents row that points at an
// external URL instead of an uploaded file. Used by both the Reference
// Documents list and the Status Reports section on the Documents tab, which
// can each store either an uploaded file or a link.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
    }

    const { title, url, category, project_id, report_date } = await req.json()

    if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url.trim())) {
      return NextResponse.json({ success: false, error: 'A valid http(s) URL is required' }, { status: 400 })
    }

    // Tenant is always resolved from the authenticated session, never from
    // client-supplied data -- same rule as /api/upload.
    const tenantId = user.tenantId

    if (project_id) {
      const proj = await pool.query('SELECT tenant_id FROM projects WHERE id = $1', [project_id])
      if (proj.rows.length === 0 || proj.rows[0].tenant_id !== tenantId) {
        return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
      }
    }

    const result = await pool.query(
      `INSERT INTO shared_documents
        (tenant_id, project_id, title, url, file_type, category, uploaded_by, report_date)
       VALUES ($1, $2, $3, $4, 'link', $5, $6, $7)
       RETURNING id, project_id, title, url, file_type, category, uploaded_by, report_date, created_at`,
      [
        tenantId,
        project_id || null,
        (title && String(title).trim()) || url.trim(),
        url.trim(),
        category || 'General',
        user.name || 'Portal User',
        report_date || null,
      ]
    )

    await logActivity({
      tenantId,
      projectId: result.rows[0].project_id,
      module: 'project_center',
      entityType: 'document',
      entityId: result.rows[0].id,
      action: 'created',
      actorName: user.name,
      actorEmail: user.email,
      summary: result.rows[0].title,
      detail: result.rows[0].category ? `Category: ${result.rows[0].category} · Link` : 'Link',
    })

    return NextResponse.json({ success: true, document: result.rows[0] })
  } catch (error) {
    console.error('Document link error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
