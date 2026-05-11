import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generate } from '@/lib/ai/generate'
import { buildLoglinePrompt } from '@/lib/ai/prompts/logline'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId, idea, genre, tone } = await request.json()

  if (!projectId || !idea) {
    return NextResponse.json({ error: 'Missing projectId or idea' }, { status: 400 })
  }

  const prompt = buildLoglinePrompt(idea, genre, tone)
  const result = await generate({ type: 'logline', prompt })

  await supabase
    .from('projects')
    .update({ logline: result.content })
    .eq('id', projectId)

  await supabase.from('ai_generations').insert({
    project_id: projectId,
    user_id: user.id,
    generation_type: 'logline',
    provider: result.provider,
    model: result.model,
    input_prompt: prompt,
    output_content: result.content,
    tokens_used: result.tokensUsed,
    duration_ms: result.durationMs,
    accepted: true,
  })

  return NextResponse.json({ logline: result.content })
  } catch (error) {
    console.error('Logline generation error:', error)
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
