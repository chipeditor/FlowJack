import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generate } from '@/lib/ai/generate'
import { requireAIPermission, handleAuthError } from '@/lib/auth/check-permission'

export const maxDuration = 120

const EXTRACT_PROMPT = (screenplay: string) => `You are a professional script supervisor extracting characters from a screenplay.

SCREENPLAY:
${screenplay}

Extract ALL characters from this screenplay. For each character, extract any physical traits, wardrobe details, age, or personality descriptors mentioned ANYWHERE in the screenplay (action lines, parentheticals, character introductions). Only include traits that are explicitly stated or clearly implied — do NOT invent or assume traits that aren't in the text. Consolidate name variations (e.g. "SARAH", "Sarah", "SARAH CHEN") into a single canonical name.

Respond in JSON format:
{
  "characters": [
    {
      "name": "Sarah Chen",
      "description": "Brief character summary if evident from screenplay",
      "physical_traits": {
        "hair_color": null,
        "hair_style": null,
        "eye_color": null,
        "skin_tone": null,
        "age_range": "30s",
        "build": null,
        "height": null,
        "facial_hair": null,
        "distinguishing_features": null,
        "era": null,
        "archetype": null
      },
      "wardrobe": "leather jacket, worn boots",
      "scenes": [1, 3, 5]
    }
  ]
}

For physical_traits, use null for any trait not mentioned in the screenplay. The "scenes" array should list the scene numbers where they appear.

Respond with ONLY valid JSON.`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    const { userId } = await requireAIPermission(supabase, projectId)

    // Fetch active script
    const { data: script } = await supabase
      .from('scripts')
      .select('content')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .single()

    if (!script?.content) {
      return NextResponse.json({ error: 'No active screenplay found' }, { status: 400 })
    }

    const prompt = EXTRACT_PROMPT(script.content)
    const result = await generate({ type: 'scenes', prompt, structured: true })

    let parsed: { characters: Array<Record<string, unknown>> }
    try {
      parsed = JSON.parse(result.content)
    } catch {
      return NextResponse.json({ error: 'Failed to parse character extraction' }, { status: 500 })
    }

    if (!parsed.characters || parsed.characters.length === 0) {
      return NextResponse.json({ error: 'No characters found in screenplay' }, { status: 400 })
    }

    // Fetch existing characters for null-only merge
    const { data: existingChars } = await supabase
      .from('characters')
      .select('id, name, description, wardrobe, physical_traits')
      .eq('project_id', projectId)

    const existingByName = new Map(
      (existingChars || []).map(c => [c.name.toLowerCase(), c])
    )

    const upserted: { id: string; name: string; isNew: boolean }[] = []

    for (let i = 0; i < parsed.characters.length; i++) {
      const char = parsed.characters[i]
      const name = char.name as string
      if (!name) continue

      const traits = (char.physical_traits as Record<string, unknown>) || {}
      const cleanTraits: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(traits)) {
        if (v != null) cleanTraits[k] = v
      }

      const existing = existingByName.get(name.toLowerCase())

      if (existing) {
        // Merge: only fill null fields
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

        if (!existing.description && char.description) {
          updates.description = char.description
        }
        if (!existing.wardrobe && char.wardrobe) {
          updates.wardrobe = char.wardrobe
        }
        if (Object.keys(cleanTraits).length > 0) {
          const existingTraits = (existing.physical_traits || {}) as Record<string, unknown>
          const mergedTraits = { ...cleanTraits, ...existingTraits }
          updates.physical_traits = mergedTraits
        }

        if (Object.keys(updates).length > 1) {
          await supabase.from('characters').update(updates).eq('id', existing.id)
        }
        upserted.push({ id: existing.id, name, isNew: false })
      } else {
        // Insert new
        const { data: newChar } = await supabase
          .from('characters')
          .insert({
            project_id: projectId,
            name,
            description: (char.description as string) || null,
            physical_traits: cleanTraits,
            wardrobe: (char.wardrobe as string) || null,
            sort_order: (existingChars?.length || 0) + i,
          })
          .select('id, name')
          .single()

        if (newChar) {
          upserted.push({ id: newChar.id, name: newChar.name, isNew: true })
          existingByName.set(name.toLowerCase(), { ...newChar, description: null, wardrobe: null, physical_traits: {} })
        }
      }
    }

    // Populate scene_characters join table if scenes exist
    const { data: scenes } = await supabase
      .from('scenes')
      .select('id, scene_number, characters')
      .eq('project_id', projectId)

    if (scenes && scenes.length > 0 && upserted.length > 0) {
      const charByName = new Map(
        upserted.map(c => [c.name.toLowerCase(), c.id])
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

    // Log generation
    await supabase.from('ai_generations').insert({
      project_id: projectId,
      user_id: userId,
      generation_type: 'scenes',
      provider: result.provider,
      model: result.model,
      input_prompt: `Extract characters from screenplay`,
      output_content: result.content,
      tokens_used: result.tokensUsed,
      duration_ms: result.durationMs,
      accepted: true,
    })

    return NextResponse.json({
      characters: upserted,
      newCount: upserted.filter(c => c.isNew).length,
      updatedCount: upserted.filter(c => !c.isNew).length,
    })
  } catch (error) {
    console.error('Character extraction error:', error)
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Character extraction failed' }, { status: 500 })
  }
}
