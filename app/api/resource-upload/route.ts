import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
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
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    await mkdir(UPLOAD_DIR, { recursive: true })

    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${safeName}`
    const filePath = join(UPLOAD_DIR, fileName)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    const ext = file.name.split('.').pop()?.toLowerCase() || 'file'

    return NextResponse.json({
      success: true,
      file_url: `/uploads/${fileName}`,
      file_type: ext,
      file_name: file.name,
    })
  } catch (error) {
    console.error('Resource upload error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
