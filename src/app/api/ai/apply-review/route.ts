import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { requireProjectPermission, handleAuthError } from '@/lib/auth/check-permission'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { projectId, suggestions } = await request.json()
    await requireProjectPermission(supabase, projectId, 'screenplay', 'edit')

    const { data: script } = await supabase
      .from('scripts')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .single()

    if (!script) return NextResponse.json({ error: 'No screenplay found' }, { status: 400 })

    const lines = script.content.split('\n')

    const sorted = [...suggestions].sort(
      (a: { lineStart: number }, b: { lineStart: number }) => b.lineStart - a.lineStart
    )

    for (const s of sorted) {
      const start = Math.max(0, s.lineStart - 1)
      const end = Math.min(lines.length, s.lineEnd)
      const newLines = s.suggestedText.split('\n')
      lines.splice(start, end - start, ...newLines)
    }

    const newContent = lines.join('\n')
    const wordCount = newContent.split(/\s+/).length
    const estimatedRuntime = Math.round(wordCount / 150) * 60

    await supabase
      .from('scripts')
      .update({ is_active: false })
      .eq('project_id', projectId)
      .eq('is_active', true)

    await supabase.from('scripts').insert({
      project_id: projectId,
      version: script.version + 1,
      title: script.title,
      content: newContent,
      format: script.format,
      word_count: wordCount,
      estimated_runtime_seconds: estimatedRuntime,
      is_active: true,
    })

    return NextResponse.json({ success: true, version: script.version + 1 })
  } catch (error) {
    console.error('Apply review error:', error)
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    const message = error instanceof Error ? error.message : 'Failed to apply changes'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
