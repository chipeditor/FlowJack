import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generate } from '@/lib/ai/generate'
import { buildScreenplayPrompt } from '@/lib/ai/prompts/screenplay'
import { generateMultiPassScreenplay } from '@/lib/ai/generate-multipass'
import { requireAIPermission, handleAuthError } from '@/lib/auth/check-permission'

export const maxDuration = 300

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

    const useMultiPass = project.duration_target === 'standard' || project.duration_target === 'feature'

    console.log(`[FlowJack] Generating screenplay — duration: ${project.duration_target}, mode: ${useMultiPass ? 'multi-pass' : 'single-pass'}, project: ${project.id}`)

    let screenplayContent: string
    let wordCount: number
    let tokensUsed: number
    let durationMs: number
    let provider: string
    let model: string
    let promptUsed: string

    if (useMultiPass) {
      const result = await generateMultiPassScreenplay(
        project.logline,
        project.genre,
        project.tone,
        project.duration_target,
        (stage, detail) => console.log(`[FlowJack] [${stage}] ${detail}`)
      )

      screenplayContent = result.screenplay
      wordCount = result.wordCount
      tokensUsed = result.totalTokensUsed
      durationMs = result.totalDurationMs
      provider = 'openai'
      model = `gpt-4o (${result.batchCount}-pass)`
      promptUsed = `Multi-pass generation: ${result.outline.scenes.length} scenes outlined, ${result.batchCount} batches. Word counts per batch: ${result.batchWordCounts.join(', ')}`

      console.log(`[FlowJack] Multi-pass complete: ${wordCount} words (~${Math.round(wordCount / 250)} pages), ${result.outline.scenes.length} scenes, ${result.batchCount} batches: [${result.batchWordCounts.join(', ')}] words, ${Math.round(durationMs / 1000)}s total`)

      await supabase
        .from('projects')
        .update({
          metadata: {
            outline: result.outline,
            generation_mode: 'multi-pass',
            batch_count: result.batchCount,
            batch_word_counts: result.batchWordCounts,
          },
        })
        .eq('id', projectId)

    } else {
      const prompt = buildScreenplayPrompt(project.logline, project.genre, project.tone, project.duration_target)

      const tokenLimits: Record<string, number> = {
        short: 4096,
        medium: 8192,
      }
      const maxTokens = tokenLimits[project.duration_target || 'short'] || 8192

      const result = await generate({ type: 'screenplay', prompt, maxTokens })

      screenplayContent = result.content
      wordCount = result.content.split(/\s+/).length
      tokensUsed = result.tokensUsed
      durationMs = result.durationMs
      provider = result.provider
      model = result.model
      promptUsed = prompt

      console.log(`[FlowJack] Single-pass: ${wordCount} words, ${provider}/${model}, ${durationMs}ms`)
    }

    const estimatedRuntime = Math.round(wordCount * 0.5)

    // Deactivate previous scripts
    await supabase
      .from('scripts')
      .update({ is_active: false })
      .eq('project_id', projectId)
      .eq('is_active', true)

    // Get next version number
    const { count } = await supabase
      .from('scripts')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)

    const { data: script, error: dbError } = await supabase
      .from('scripts')
      .insert({
        project_id: projectId,
        version: (count || 0) + 1,
        title: project.title,
        content: screenplayContent,
        format: 'fountain',
        word_count: wordCount,
        estimated_runtime_seconds: estimatedRuntime,
        is_active: true,
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB insert error:', dbError)
      return NextResponse.json({ error: 'Failed to save screenplay' }, { status: 500 })
    }

    await supabase
      .from('projects')
      .update({ status: 'in_progress' })
      .eq('id', projectId)

    await supabase.from('ai_generations').insert({
      project_id: projectId,
      user_id: userId,
      generation_type: 'screenplay',
      provider,
      model,
      input_prompt: promptUsed,
      output_content: screenplayContent,
      tokens_used: tokensUsed,
      duration_ms: durationMs,
      accepted: true,
    })

    return NextResponse.json({ script })
  } catch (error) {
    console.error('Screenplay generation error:', error)
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
