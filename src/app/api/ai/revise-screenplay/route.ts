import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generate } from '@/lib/ai/generate'
import { buildRevisionPrompt } from '@/lib/ai/prompts/revision'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, revisionNotes } = await request.json()

    if (!revisionNotes?.trim()) {
      return NextResponse.json({ error: 'Revision notes are required' }, { status: 400 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('logline, genre, tone, duration_target')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 400 })
    }

    const { data: currentScript } = await supabase
      .from('scripts')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .single()

    if (!currentScript) {
      return NextResponse.json({ error: 'No active screenplay to revise' }, { status: 400 })
    }

    console.log(`[FlowJack] Revising screenplay — project: ${projectId}, notes: "${revisionNotes.substring(0, 100)}..."`)

    const prompt = buildRevisionPrompt(
      currentScript.content,
      revisionNotes,
      project.logline || '',
      project.genre,
      project.tone
    )

    // Use higher token limit for revisions to preserve full length
    const result = await generate({
      type: 'screenplay',
      prompt,
      maxTokens: 16384,
    })

    const wordCount = result.content.split(/\s+/).length
    const estimatedRuntime = Math.round(wordCount * 0.5)

    // Deactivate current script
    await supabase
      .from('scripts')
      .update({ is_active: false })
      .eq('id', currentScript.id)

    // Create new version
    const { data: script, error: dbError } = await supabase
      .from('scripts')
      .insert({
        project_id: projectId,
        version: currentScript.version + 1,
        title: currentScript.title,
        content: result.content,
        format: 'fountain',
        word_count: wordCount,
        estimated_runtime_seconds: estimatedRuntime,
        is_active: true,
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB insert error:', dbError)
      return NextResponse.json({ error: 'Failed to save revision' }, { status: 500 })
    }

    // Store revision in version history
    await supabase.from('versions').insert({
      entity_type: 'script',
      entity_id: script.id,
      version_number: script.version,
      snapshot: { content: currentScript.content, word_count: currentScript.word_count },
      change_description: revisionNotes,
    })

    await supabase.from('ai_generations').insert({
      project_id: projectId,
      user_id: user.id,
      generation_type: 'screenplay',
      provider: result.provider,
      model: result.model,
      input_prompt: `REVISION: ${revisionNotes}`,
      output_content: result.content,
      tokens_used: result.tokensUsed,
      duration_ms: result.durationMs,
      accepted: false,
      metadata: { type: 'revision', previous_version: currentScript.version },
    })

    console.log(`[FlowJack] Revision complete: v${script.version}, ${wordCount} words, ${result.durationMs}ms`)

    return NextResponse.json({ script })
  } catch (error) {
    console.error('Screenplay revision error:', error)
    const message = error instanceof Error ? error.message : 'Revision failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
