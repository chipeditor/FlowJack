import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generate } from '@/lib/ai/generate'
import { buildScreenplayPrompt } from '@/lib/ai/prompts/screenplay'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await request.json()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (!project || !project.logline) {
    return NextResponse.json({ error: 'Project not found or missing logline' }, { status: 400 })
  }

  const prompt = buildScreenplayPrompt(project.logline, project.genre, project.tone, project.duration_target)
  const result = await generate({ type: 'screenplay', prompt })

  const wordCount = result.content.split(/\s+/).length
  const estimatedRuntime = Math.round(wordCount * 0.5)

  const { data: script } = await supabase
    .from('scripts')
    .insert({
      project_id: projectId,
      version: 1,
      title: project.title,
      content: result.content,
      format: 'fountain',
      word_count: wordCount,
      estimated_runtime_seconds: estimatedRuntime,
      is_active: true,
    })
    .select()
    .single()

  await supabase
    .from('projects')
    .update({ status: 'in_progress' })
    .eq('id', projectId)

  await supabase.from('ai_generations').insert({
    project_id: projectId,
    user_id: user.id,
    generation_type: 'screenplay',
    provider: result.provider,
    model: result.model,
    input_prompt: prompt,
    output_content: result.content,
    tokens_used: result.tokensUsed,
    duration_ms: result.durationMs,
    accepted: true,
  })

  return NextResponse.json({ script })
}
