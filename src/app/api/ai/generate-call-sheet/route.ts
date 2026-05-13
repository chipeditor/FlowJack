import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generate } from '@/lib/ai/generate'
import { buildCallSheetPrompt } from '@/lib/ai/prompts/call-sheet'
import { requireAIPermission, handleAuthError } from '@/lib/auth/check-permission'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { projectId, dayNumber } = await request.json()
    const { userId } = await requireAIPermission(supabase, projectId)

    const { data: project } = await supabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 400 })

    const { data: shootPlan } = await supabase
      .from('shoot_plans')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!shootPlan) return NextResponse.json({ error: 'No production plan — generate one first' }, { status: 400 })

    const shootDay = (shootPlan.shoot_schedule as Record<string, unknown>[])?.find(
      (d: Record<string, unknown>) => d.day_number === dayNumber
    ) as { day_number: number; location: string; interior_exterior: string; time_of_day: string; scenes: number[]; estimated_hours: number; notes: string | null } | undefined

    if (!shootDay) return NextResponse.json({ error: `Shoot day ${dayNumber} not found in plan` }, { status: 400 })

    const { data: allScenes } = await supabase
      .from('scenes')
      .select('scene_number, heading, location, interior_exterior, time_of_day, characters, estimated_duration_seconds')
      .eq('project_id', projectId)
      .in('scene_number', shootDay.scenes)
      .order('scene_number')

    const scenes = allScenes || []

    const { data: shots } = await supabase
      .from('shots')
      .select('scene_id')
      .eq('project_id', projectId)

    const { data: sceneIds } = await supabase
      .from('scenes')
      .select('id, scene_number')
      .eq('project_id', projectId)
      .in('scene_number', shootDay.scenes)

    const sceneIdToNumber: Record<string, number> = {}
    if (sceneIds) {
      for (const s of sceneIds) sceneIdToNumber[s.id] = s.scene_number
    }

    const shotCountByScene: Record<number, number> = {}
    if (shots) {
      for (const shot of shots) {
        const num = sceneIdToNumber[shot.scene_id]
        if (num && shootDay.scenes.includes(num)) {
          shotCountByScene[num] = (shotCountByScene[num] || 0) + 1
        }
      }
    }

    const scenesForDay = scenes.map(s => ({
      scene_number: s.scene_number,
      heading: s.heading,
      location: s.location || 'UNKNOWN',
      interior_exterior: s.interior_exterior || 'INT',
      time_of_day: s.time_of_day || 'DAY',
      characters: s.characters || [],
      estimated_duration_seconds: s.estimated_duration_seconds || 60,
      shot_count: shotCountByScene[s.scene_number] || 0,
    }))

    const equipmentList = (shootPlan.equipment_list as { category: string; item: string; scenes_needed: number[]; notes: string | null }[]) || []
    const equipmentForDay = equipmentList.filter(e =>
      e.scenes_needed.some(sn => shootDay.scenes.includes(sn))
    )

    const { data: crewMembers } = await supabase
      .from('crew_members')
      .select('name, role, is_cast, character_name, is_key_contact')
      .eq('project_id', projectId)

    const crew = {
      key_contacts: (crewMembers || []).filter(c => c.is_key_contact).map(c => ({ name: c.name, role: c.role })),
      cast: (crewMembers || []).filter(c => c.is_cast).map(c => ({ character_name: c.character_name || '', actor_name: c.name || null })),
    }

    const scheduleArr = shootPlan.shoot_schedule as { day_number: number; location: string; scenes: number[] }[]
    const nextDay = scheduleArr?.find(d => d.day_number === dayNumber + 1)
    const nextDaySummary = nextDay
      ? `Day ${nextDay.day_number} at ${nextDay.location}, Scenes ${nextDay.scenes.join(', ')}`
      : null

    const prompt = buildCallSheetPrompt(
      project.title,
      shootDay,
      shootPlan.total_shoot_days,
      scenesForDay,
      equipmentForDay,
      crew,
      nextDaySummary
    )

    const result = await generate({ type: 'production_plan', prompt, structured: true })

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(result.content)
    } catch {
      return NextResponse.json({ error: 'Failed to parse call sheet' }, { status: 500 })
    }

    await supabase
      .from('call_sheets')
      .delete()
      .eq('project_id', projectId)
      .eq('day_number', dayNumber)

    const { data: callSheet, error: insertError } = await supabase
      .from('call_sheets')
      .insert({
        project_id: projectId,
        shoot_plan_id: shootPlan.id,
        day_number: dayNumber,
        crew_call: parsed.crew_call || '7:00 AM',
        shooting_call: parsed.shooting_call || null,
        sunrise: parsed.sunrise || null,
        sunset: parsed.sunset || null,
        locations: parsed.locations || [],
        scenes: parsed.scenes || [],
        cast_list: parsed.cast || [],
        department_notes: parsed.department_notes || [],
        breakfast_time: parsed.breakfast_time || null,
        lunch_time: parsed.lunch_time || null,
        advance_schedule_note: parsed.advance_schedule_note || null,
        notes: null,
      })
      .select()
      .single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    await supabase.from('ai_generations').insert({
      project_id: projectId,
      user_id: userId,
      generation_type: 'production_plan',
      provider: result.provider,
      model: result.model,
      input_prompt: prompt,
      output_content: result.content,
      tokens_used: result.tokensUsed,
      duration_ms: result.durationMs,
      accepted: true,
    })

    return NextResponse.json({ callSheet })
  } catch (error) {
    console.error('Call sheet generation error:', error)
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
