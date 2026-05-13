import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { requireAIPermission, handleAuthError } from '@/lib/auth/check-permission'
import { PhysicalTraits } from '@/lib/types'
import { fal } from '@fal-ai/client'

export const maxDuration = 120

function getStorageAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function buildPortraitPrompt(traits: PhysicalTraits, name: string, wardrobe?: string): string {
  const parts: string[] = [
    'Professional character reference portrait, head and shoulders, neutral gray background, soft studio lighting, facing camera, sharp focus',
  ]

  const desc: string[] = []
  if (traits.age_range) desc.push(traits.age_range)
  if (traits.skin_tone) desc.push(`${traits.skin_tone} skin`)
  if (traits.build) desc.push(`${traits.build} build`)
  if (traits.height) desc.push(traits.height)
  if (traits.hair_color && traits.hair_style) {
    desc.push(`${traits.hair_color} ${traits.hair_style} hair`)
  } else if (traits.hair_color) {
    desc.push(`${traits.hair_color} hair`)
  } else if (traits.hair_style) {
    desc.push(`${traits.hair_style} hair`)
  }
  if (traits.eye_color) desc.push(`${traits.eye_color} eyes`)
  if (traits.facial_hair) desc.push(traits.facial_hair)
  if (traits.distinguishing_features) desc.push(traits.distinguishing_features)
  if (traits.era) desc.push(`${traits.era} era`)
  if (traits.archetype) desc.push(`${traits.archetype} archetype`)

  if (desc.length > 0) {
    parts.push(`Subject: ${desc.join(', ')}`)
  }

  if (wardrobe) {
    parts.push(`Wearing: ${wardrobe}`)
  }

  parts.push('Photorealistic, cinematic, high detail, 8K')

  return parts.join('. ')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { projectId, characterId, physical_traits, name, wardrobe, count = 4 } = await request.json()

    if (!projectId || !characterId) {
      return NextResponse.json({ error: 'Missing projectId or characterId' }, { status: 400 })
    }

    const { userId } = await requireAIPermission(supabase, projectId)

    const prompt = buildPortraitPrompt(physical_traits || {}, name || 'character', wardrobe)

    fal.config({ credentials: process.env.FAL_API_KEY! })

    const imageCount = Math.min(count, 4)
    const results: { url: string; seed: number }[] = []

    // Generate images in parallel
    const promises = Array.from({ length: imageCount }, async (_, i) => {
      const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
        input: {
          prompt,
          image_size: 'square' as const,
          num_images: 1,
        },
      })
      const data = result.data as { images: { url: string }[]; seed: number }
      return { url: data.images[0].url, seed: data.seed }
    })

    const generated = await Promise.all(promises)
    results.push(...generated)

    // Log generation
    await supabase.from('ai_generations').insert({
      project_id: projectId,
      user_id: userId,
      generation_type: 'storyboard',
      provider: 'fal',
      model: 'flux-pro-v1.1',
      input_prompt: prompt,
      output_content: JSON.stringify(results.map(r => r.url)),
      tokens_used: 0,
      cost_cents: imageCount * 3,
      duration_ms: 0,
      accepted: false,
    })

    return NextResponse.json({ portraits: results, prompt })
  } catch (error) {
    console.error('Character portrait generation error:', error)
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Portrait generation failed' }, { status: 500 })
  }
}

// Accept a portrait: download from fal.ai temp URL, upload to Supabase Storage, update character
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { projectId, characterId, imageUrl, seed } = await request.json()

    if (!projectId || !characterId || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await requireAIPermission(supabase, projectId)

    // Download image from fal.ai temp URL
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()
    const contentType = imageBlob.type || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : 'jpg'
    const fileName = `${projectId}/${characterId}.${ext}`

    const storageAdmin = getStorageAdmin()
    const { error: uploadError } = await storageAdmin.storage
      .from('character-references')
      .upload(fileName, imageBlob, {
        contentType,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = storageAdmin.storage
      .from('character-references')
      .getPublicUrl(fileName)

    // Update character record
    const { data, error } = await supabase
      .from('characters')
      .update({
        reference_image_url: publicUrl,
        reference_image_seed: seed || null,
        reference_source: 'generated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', characterId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ character: data })
  } catch (error) {
    console.error('Portrait accept error:', error)
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Failed to save portrait' }, { status: 500 })
  }
}
