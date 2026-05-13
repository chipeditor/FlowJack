import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generate } from '@/lib/ai/generate'
import { buildSceneBreakdownPrompt } from '@/lib/ai/prompts/scenes'
import { requireAIPermission, handleAuthError } from '@/lib/auth/check-permission'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
  const supabase = await createServerSupabaseClient()
  const { projectId } = await request.json()
  const { userId } = await requireAIPermission(supabase, projectId)

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

  let parsed: { scenes: Array<Record<string, unknown>>; characters?: Array<Record<string, unknown>> }
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

  // Upsert extracted characters
  let extractedCharacters: Record<string, unknown>[] = []
  if (parsed.characters && parsed.characters.length > 0) {
    // Fetch existing characters for this project (for null-only merge)
    const { data: existingChars } = await supabase
      .from('characters')
      .select('id, name')
      .eq('project_id', projectId)

    const existingByName = new Map(
      (existingChars || []).map(c => [c.name.toLowerCase(), c])
    )

    for (let i = 0; i < parsed.characters.length; i++) {
      const char = parsed.characters[i]
      const name = char.name as string
      if (!name) continue

      const traits = (char.physical_traits as Record<string, unknown>) || {}
      // Strip null values from traits
      const cleanTraits: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(traits)) {
        if (v != null) cleanTraits[k] = v
      }

      const existing = existingByName.get(name.toLowerCase())

      if (existing) {
        // Merge: only fill in null fields on existing character
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (char.description) updates.description = char.description
        if (char.wardrobe) updates.wardrobe = char.wardrobe
        if (Object.keys(cleanTraits).length > 0) {
          // Merge traits: existing traits take priority
          updates.physical_traits = cleanTraits // will be merged below
        }

        // Fetch full existing record to merge traits properly
        const { data: fullExisting } = await supabase
          .from('characters')
          .select('description, wardrobe, physical_traits')
          .eq('id', existing.id)
          .single()

        if (fullExisting) {
          // Only set description/wardrobe if currently null
          if (fullExisting.description) delete updates.description
          if (fullExisting.wardrobe) delete updates.wardrobe
          // Merge traits: existing values take priority
          if (Object.keys(cleanTraits).length > 0) {
            const mergedTraits = { ...cleanTraits, ...(fullExisting.physical_traits || {}) }
            updates.physical_traits = mergedTraits
          } else {
            delete updates.physical_traits
          }
        }

        if (Object.keys(updates).length > 1) { // more than just updated_at
          await supabase.from('characters').update(updates).eq('id', existing.id)
        }
        extractedCharacters.push({ id: existing.id, name })
      } else {
        // Insert new character
        const { data: newChar } = await supabase
          .from('characters')
          .insert({
            project_id: projectId,
            name,
            description: (char.description as string) || null,
            physical_traits: cleanTraits,
            wardrobe: (char.wardrobe as string) || null,
            sort_order: i,
          })
          .select('id, name')
          .single()

        if (newChar) {
          extractedCharacters.push(newChar)
          existingByName.set(name.toLowerCase(), newChar)
        }
      }
    }

    // Populate scene_characters join table
    if (scenes && extractedCharacters.length > 0) {
      const charByName = new Map(
        extractedCharacters.map(c => [(c.name as string).toLowerCase(), c.id as string])
      )

      const joins: { scene_id: string; character_id: string }[] = []
      for (const scene of scenes) {
        const sceneChars = (scene.characters as string[]) || []
        for (const charName of sceneChars) {
          const charId = charByName.get(charName.toLowerCase())
          if (charId) {
            joins.push({ scene_id: scene.id, character_id: charId })
          }
        }
      }

      if (joins.length > 0) {
        await supabase.from('scene_characters').upsert(joins, { onConflict: 'scene_id,character_id' })
      }
    }
  }

  await supabase.from('ai_generations').insert({
    project_id: projectId,
    user_id: userId,
    generation_type: 'scenes',
    provider: result.provider,
    model: result.model,
    input_prompt: prompt,
    output_content: result.content,
    tokens_used: result.tokensUsed,
    duration_ms: result.durationMs,
    accepted: true,
  })

  return NextResponse.json({ scenes, characters: extractedCharacters })
  } catch (error) {
    console.error('Scene generation error:', error)
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
