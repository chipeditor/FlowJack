import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contentType = request.headers.get('content-type') || ''

  let text = ''
  let format = 'text'

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 })
    }

    const name = file.name.toLowerCase()
    const buffer = Buffer.from(await file.arrayBuffer())

    if (name.endsWith('.pdf')) {
      try {
        // @ts-expect-error pdf-parse v1 has no type declarations
        const pdfParse = (await import('pdf-parse')).default
        const result = await pdfParse(buffer)
        text = result.text
        format = 'pdf'
      } catch {
        return NextResponse.json({ error: 'Could not extract text from PDF. Try pasting the text directly.' }, { status: 400 })
      }
    } else if (name.endsWith('.docx')) {
      try {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        text = result.value
        format = 'docx'
      } catch {
        return NextResponse.json({ error: 'Could not extract text from DOCX. Try pasting the text directly.' }, { status: 400 })
      }
    } else if (name.endsWith('.txt') || name.endsWith('.fountain')) {
      text = buffer.toString('utf-8')
      format = name.endsWith('.fountain') ? 'fountain' : 'text'
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Upload PDF, DOCX, or TXT.' }, { status: 400 })
    }
  } else {
    const body = await request.json()
    text = body.content || ''
    format = 'pasted'
  }

  text = text.trim()
  if (!text || text.length < 100) {
    return NextResponse.json({ error: 'Script content is too short or empty.' }, { status: 400 })
  }

  const wordCount = text.split(/\s+/).length
  const estimatedRuntime = Math.round(wordCount / 150) * 60

  return NextResponse.json({
    content: text,
    wordCount,
    estimatedRuntime,
    format,
  })
}
