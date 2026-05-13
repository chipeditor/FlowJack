import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generate } from '@/lib/ai/generate'
import { buildProductionPlanPrompt } from '@/lib/ai/prompts/production-plan'
import { requireAIPermission, handleAuthError } from '@/lib/auth/check-permission'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
  const supabase = await createServerSupabaseClient()
  const { projectId } = await request.json()
  const { userId } = await requireAIPermission(supabase, projectId)

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (!project || !project.logline) {
    return NextResponse.json({ error: 'Project not found or missing logline' }, { status: 400 })
  }

  const { data: script } = await supabase
    .from('scripts')
    .select('content')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .single()

  if (!script) {
    return NextResponse.json({ error: 'No active screenplay' }, { status: 400 })
  }

  const { count: sceneCount } = await supabase
    .from('scenes')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  const prompt = buildProductionPlanPrompt(
    project.logline,
    script.content,
    sceneCount || 0,
    project.genre,
    project.tone
  )

  const result = await generate({ type: 'production_plan', prompt, structured: true })

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(result.content)
  } catch {
    return NextResponse.json({ error: 'Failed to parse production plan' }, { status: 500 })
  }

  const { data: plan } = await supabase
    .from('production_plans')
    .insert({
      project_id: projectId,
      voiceover_direction: parsed.voiceover_direction || [],
      music_direction: parsed.music_direction || {},
      sfx_direction: parsed.sfx_direction || [],
      color_palette: parsed.color_palette || [],
      visual_style: parsed.visual_style as string || null,
      reference_films: parsed.reference_films as string[] || [],
      notes: null,
    })
    .select()
    .single()

  await supabase.from('ai_generations').insert({
    project_id: projectId,
    user_id: userId,
    generation_type: 'creative_brief',
    provider: result.provider,
    model: result.model,
    input_prompt: prompt,
    output_content: result.content,
    tokens_used: result.tokensUsed,
    duration_ms: result.durationMs,
    accepted: true,
  })

  return NextResponse.json({ plan })
  } catch (error) {
    console.error('Production plan generation error:', error)
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
