import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generate } from '@/lib/ai/generate'
import { buildLoglinePrompt } from '@/lib/ai/prompts/logline'
import { requireAIPermission, handleAuthError } from '@/lib/auth/check-permission'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
  const supabase = await createServerSupabaseClient()
  const { projectId, idea, genre, tone } = await request.json()
  const { userId } = await requireAIPermission(supabase, projectId)

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
    user_id: userId,
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
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
