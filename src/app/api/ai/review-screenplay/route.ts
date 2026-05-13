import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generate } from '@/lib/ai/generate'
import { buildScriptReviewPrompt, ScriptSuggestion } from '@/lib/ai/prompts/script-review'
import { randomUUID } from 'crypto'
import { requireAIPermission, handleAuthError } from '@/lib/auth/check-permission'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { projectId } = await request.json()
    const { userId } = await requireAIPermission(supabase, projectId)

    const { data: project } = await supabase
      .from('projects')
      .select('genre')
      .eq('id', projectId)
      .single()

    const { data: script } = await supabase
      .from('scripts')
      .select('content')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .single()

    if (!script) return NextResponse.json({ error: 'No screenplay found' }, { status: 400 })

    const prompt = buildScriptReviewPrompt(script.content, project?.genre)
    const result = await generate({ type: 'script_review', prompt, structured: true })

    let suggestions: ScriptSuggestion[] = []
    try {
      const parsed = JSON.parse(result.content)
      suggestions = (parsed.suggestions || []).map((s: Omit<ScriptSuggestion, 'id'>) => ({
        ...s,
        id: randomUUID(),
      }))
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI suggestions' }, { status: 500 })
    }

    await supabase.from('ai_generations').insert({
      project_id: projectId,
      user_id: userId,
      generation_type: 'script_review',
      provider: result.provider,
      model: result.model,
      input_prompt: prompt.slice(0, 5000),
      output_content: result.content,
      tokens_used: result.tokensUsed,
      duration_ms: result.durationMs,
      accepted: false,
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Script review error:', error)
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    const message = error instanceof Error ? error.message : 'Review failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
