import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { parseTeamLoadCsv } from '@/lib/teamLoadReport'

// Step 1 of the Team & Load import: parse the uploaded capacity/utilization
// export and return every row plus a best-guess column mapping. No database
// writes happen here -- the admin reviews/adjusts the mapping in the UI,
// then POSTs the same rows plus their confirmed mapping to
// /api/admin/team-load-import/commit. Unlike the NetSuite import, this file's
// format isn't fixed (OpenAir report exports vary), so there's no
// report-type auto-detection here -- just a generic header + rows parse.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const form = await req.formData()
    const file = form.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const text = await file.text()
    let parsed
    try {
      parsed = parseTeamLoadCsv(text)
    } catch (e) {
      return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 400 })
    }

    if (parsed.rows.length === 0) {
      return NextResponse.json({ error: 'No data rows found in this file' }, { status: 400 })
    }

    return NextResponse.json({
      filename: (file as File).name || 'team-load-report.csv',
      header: parsed.header,
      rows: parsed.rows,
      suggestedMapping: parsed.suggestedMapping,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
