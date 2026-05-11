import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generate } from '@/lib/ai/generate'
import { buildShootPlanPrompt } from '@/lib/ai/prompts/shoot-plan'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await request.json()

    const { data: project } = await supabase
      .from('projects')
      .select('logline, genre')
      .eq('id', projectId)
      .single()

    if (!project || !project.logline) {
      return NextResponse.json({ error: 'Project not found or missing logline' }, { status: 400 })
    }

    const { data: scenes } = await supabase
      .from('scenes')
      .select('scene_number, heading, location, interior_exterior, time_of_day, characters, estimated_duration_seconds')
      .eq('project_id', projectId)
      .order('scene_number')

    if (!scenes || scenes.length === 0) {
      return NextResponse.json({ error: 'No scenes found — generate a scene breakdown first' }, { status: 400 })
    }

    const { data: shots } = await supabase
      .from('shots')
      .select('scene_id, shot_type, camera_movement, lens, lighting, duration_seconds')
      .eq('project_id', projectId)

    if (!shots || shots.length === 0) {
      return NextResponse.json({ error: 'No shots found — generate a shot list first' }, { status: 400 })
    }

    const sceneIdToNumber: Record<string, number> = {}
    const { data: sceneIds } = await supabase
      .from('scenes')
      .select('id, scene_number')
      .eq('project_id', projectId)

    if (sceneIds) {
      for (const s of sceneIds) {
        sceneIdToNumber[s.id] = s.scene_number
      }
    }

    const shotsWithSceneNumber = shots.map(shot => ({
      scene_number: sceneIdToNumber[shot.scene_id] || 0,
      shot_type: shot.shot_type,
      camera_movement: shot.camera_movement,
      lens: shot.lens,
      lighting: shot.lighting,
      duration_seconds: shot.duration_seconds,
    }))

    const prompt = buildShootPlanPrompt(
      project.logline,
      scenes.map(s => ({
        scene_number: s.scene_number,
        heading: s.heading,
        location: s.location || 'UNKNOWN',
        interior_exterior: s.interior_exterior || 'INT',
        time_of_day: s.time_of_day || 'DAY',
        characters: s.characters || [],
        estimated_duration_seconds: s.estimated_duration_seconds || 60,
      })),
      shotsWithSceneNumber,
      project.genre
    )

    const result = await generate({ type: 'production_plan', prompt, structured: true })

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(result.content)
    } catch {
      return NextResponse.json({ error: 'Failed to parse production plan' }, { status: 500 })
    }

    await supabase
      .from('shoot_plans')
      .delete()
      .eq('project_id', projectId)

    const { data: plan } = await supabase
      .from('shoot_plans')
      .insert({
        project_id: projectId,
        shoot_schedule: parsed.shoot_schedule || [],
        call_sheets: parsed.call_sheets || [],
        cast_breakdown: parsed.cast_breakdown || [],
        location_list: parsed.location_list || [],
        equipment_list: parsed.equipment_list || [],
        budget_tier: parsed.budget_tier || 'micro',
        budget_notes: (parsed.budget_notes as string) || null,
        total_shoot_days: (parsed.total_shoot_days as number) || 1,
        notes: (parsed.notes as string) || null,
      })
      .select()
      .single()

    await supabase.from('ai_generations').insert({
      project_id: projectId,
      user_id: user.id,
      generation_type: 'production_plan',
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
    console.error('Shoot plan generation error:', error)
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
