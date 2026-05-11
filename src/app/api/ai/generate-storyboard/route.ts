import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generate } from '@/lib/ai/generate'
import { buildStoryboardPrompt } from '@/lib/ai/prompts/storyboard'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId, shotId } = await request.json()

  const { data: shot } = await supabase
    .from('shots')
    .select('*')
    .eq('id', shotId)
    .single()

  if (!shot) {
    return NextResponse.json({ error: 'Shot not found' }, { status: 400 })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('genre, tone')
    .eq('id', projectId)
    .single()

  const prompt = buildStoryboardPrompt(
    {
      shot_type: shot.shot_type,
      camera_movement: shot.camera_movement,
      lens: shot.lens,
      framing: shot.framing,
      lighting: shot.lighting,
      description: shot.description,
      action: shot.action,
    },
    {
      genre: project?.genre || undefined,
      tone: project?.tone || undefined,
    }
  )

  const result = await generate({ type: 'storyboard', prompt, structured: true })

  let parsed: { image_prompt: string; video_prompt: string; style_reference: string; camera_notes: string }
  try {
    parsed = JSON.parse(result.content)
  } catch {
    return NextResponse.json({ error: 'Failed to parse storyboard data' }, { status: 500 })
  }

  const { data: storyboard } = await supabase
    .from('storyboards')
    .insert({
      shot_id: shotId,
      project_id: projectId,
      image_prompt: parsed.image_prompt,
      video_prompt: parsed.video_prompt,
      style_reference: parsed.style_reference,
      camera_notes: parsed.camera_notes,
      status: 'pending',
      sort_order: 0,
    })
    .select()
    .single()

  await supabase.from('ai_generations').insert({
    project_id: projectId,
    user_id: user.id,
    generation_type: 'storyboard',
    provider: result.provider,
    model: result.model,
    input_prompt: prompt,
    output_content: result.content,
    tokens_used: result.tokensUsed,
    duration_ms: result.durationMs,
    accepted: true,
  })

  return NextResponse.json({ storyboard })
  } catch (error) {
    console.error('Storyboard generation error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
