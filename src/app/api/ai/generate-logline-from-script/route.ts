import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generate } from '@/lib/ai/generate'
import { buildLoglineFromScriptPrompt } from '@/lib/ai/prompts/logline-from-script'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await request.json()

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

    const prompt = buildLoglineFromScriptPrompt(script.content, project?.genre)
    const result = await generate({ type: 'logline', prompt })

    const logline = result.content.trim().replace(/^["']|["']$/g, '')

    await supabase
      .from('projects')
      .update({ logline })
      .eq('id', projectId)

    await supabase.from('ai_generations').insert({
      project_id: projectId,
      user_id: user.id,
      generation_type: 'logline',
      provider: result.provider,
      model: result.model,
      input_prompt: prompt,
      output_content: logline,
      tokens_used: result.tokensUsed,
      duration_ms: result.durationMs,
      accepted: true,
    })

    return NextResponse.json({ logline })
  } catch (error) {
    console.error('Logline from script error:', error)
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
