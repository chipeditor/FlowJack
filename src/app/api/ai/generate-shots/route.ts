import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generate } from '@/lib/ai/generate'
import { buildShotListPrompt } from '@/lib/ai/prompts/shots'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId, sceneId } = await request.json()

  const { data: scene } = await supabase
    .from('scenes')
    .select('*')
    .eq('id', sceneId)
    .single()

  if (!scene) {
    return NextResponse.json({ error: 'Scene not found' }, { status: 400 })
  }

  const prompt = buildShotListPrompt({
    heading: scene.heading,
    description: scene.description || '',
    characters: scene.characters || [],
    mood: scene.mood || 'neutral',
  })

  const result = await generate({ type: 'shots', prompt, structured: true })

  let parsed: { shots: Array<Record<string, unknown>> }
  try {
    parsed = JSON.parse(result.content)
  } catch {
    return NextResponse.json({ error: 'Failed to parse shot list' }, { status: 500 })
  }

  const shotsToInsert = parsed.shots.map((shot, i) => ({
    scene_id: sceneId,
    project_id: projectId,
    shot_number: shot.shot_number as number || i + 1,
    shot_type: shot.shot_type as string,
    camera_movement: shot.camera_movement as string,
    lens: shot.lens as string,
    framing: shot.framing as string,
    lighting: shot.lighting as string,
    description: shot.description as string,
    action: shot.action as string,
    dialogue: shot.dialogue as string | null,
    duration_seconds: shot.duration_seconds as number,
    transition: (shot.transition as string) || 'cut',
    notes: shot.notes as string,
    sort_order: i,
  }))

  const { data: shots } = await supabase
    .from('shots')
    .insert(shotsToInsert)
    .select()

  await supabase.from('ai_generations').insert({
    project_id: projectId,
    user_id: user.id,
    generation_type: 'shots',
    provider: result.provider,
    model: result.model,
    input_prompt: prompt,
    output_content: result.content,
    tokens_used: result.tokensUsed,
    duration_ms: result.durationMs,
    accepted: true,
  })

  return NextResponse.json({ shots })
  } catch (error) {
    console.error('Shot generation error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
