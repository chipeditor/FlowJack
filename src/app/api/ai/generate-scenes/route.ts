import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generate } from '@/lib/ai/generate'
import { buildSceneBreakdownPrompt } from '@/lib/ai/prompts/scenes'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await request.json()

  const { data: script } = await supabase
    .from('scripts')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .single()

  if (!script) {
    return NextResponse.json({ error: 'No active screenplay found' }, { status: 400 })
  }

  const prompt = buildSceneBreakdownPrompt(script.content)
  const result = await generate({ type: 'scenes', prompt, structured: true })

  let parsed: { scenes: Array<Record<string, unknown>> }
  try {
    parsed = JSON.parse(result.content)
  } catch {
    return NextResponse.json({ error: 'Failed to parse scene breakdown' }, { status: 500 })
  }

  const scenesToInsert = parsed.scenes.map((scene, i) => ({
    script_id: script.id,
    project_id: projectId,
    scene_number: scene.scene_number as number || i + 1,
    heading: scene.heading as string,
    description: scene.description as string,
    location: scene.location as string,
    time_of_day: scene.time_of_day as string,
    interior_exterior: scene.interior_exterior as string,
    characters: scene.characters as string[],
    mood: scene.mood as string,
    estimated_duration_seconds: scene.estimated_duration_seconds as number,
    notes: scene.notes as string,
    sort_order: i,
  }))

  const { data: scenes } = await supabase
    .from('scenes')
    .insert(scenesToInsert)
    .select()

  await supabase.from('ai_generations').insert({
    project_id: projectId,
    user_id: user.id,
    generation_type: 'scenes',
    provider: result.provider,
    model: result.model,
    input_prompt: prompt,
    output_content: result.content,
    tokens_used: result.tokensUsed,
    duration_ms: result.durationMs,
    accepted: true,
  })

  return NextResponse.json({ scenes })
}
