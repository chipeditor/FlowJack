import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generateImage } from '@/lib/ai/generate-image'
import { requireAIPermission, handleAuthError } from '@/lib/auth/check-permission'

function getStorageAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { projectId, storyboardId } = await request.json()

    if (!projectId || !storyboardId) {
      return NextResponse.json({ error: 'Missing projectId or storyboardId' }, { status: 400 })
    }

    const { userId } = await requireAIPermission(supabase, projectId)

    const { data: storyboard } = await supabase
      .from('storyboards')
      .select('id, image_prompt, status')
      .eq('id', storyboardId)
      .eq('project_id', projectId)
      .single()

    if (!storyboard) {
      return NextResponse.json({ error: 'Storyboard not found' }, { status: 404 })
    }

    if (!storyboard.image_prompt) {
      return NextResponse.json({ error: 'No image prompt — generate prompts first' }, { status: 400 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('aspect_ratio, genre, tone')
      .eq('id', projectId)
      .single()

    const { data: plan } = await supabase
      .from('production_plans')
      .select('visual_style, color_palette')
      .eq('project_id', projectId)
      .maybeSingle()

    // Fetch characters with physical traits for visual consistency
    const { data: characters } = await supabase
      .from('characters')
      .select('name, physical_traits, wardrobe, reference_image_url')
      .eq('project_id', projectId)

    let stylePrefix = 'cinematic storyboard frame, photorealistic'
    if (plan?.visual_style) stylePrefix = `cinematic storyboard frame, ${plan.visual_style}`
    if (plan?.color_palette?.length) stylePrefix += `, color palette: ${plan.color_palette.join(', ')}`
    if (project?.tone) stylePrefix += `, ${project.tone} mood`

    // Build character context by matching names in the image prompt
    let characterContext = ''
    if (characters && characters.length > 0) {
      const prompt = storyboard.image_prompt.toLowerCase()
      const matched = characters.filter(c =>
        c.name && prompt.includes(c.name.toLowerCase())
      )
      if (matched.length > 0) {
        characterContext = ' Characters: ' + matched.map(c => {
          const traits = c.physical_traits || {}
          const desc: string[] = []
          if (traits.age_range) desc.push(traits.age_range)
          if (traits.skin_tone) desc.push(`${traits.skin_tone} skin`)
          if (traits.build) desc.push(`${traits.build} build`)
          if (traits.hair_color && traits.hair_style) {
            desc.push(`${traits.hair_color} ${traits.hair_style} hair`)
          } else if (traits.hair_color) {
            desc.push(`${traits.hair_color} hair`)
          }
          if (traits.eye_color) desc.push(`${traits.eye_color} eyes`)
          if (traits.facial_hair) desc.push(traits.facial_hair)
          if (traits.distinguishing_features) desc.push(traits.distinguishing_features)
          if (traits.era) desc.push(`${traits.era} era`)
          if (traits.archetype) desc.push(`${traits.archetype} archetype`)
          if (c.wardrobe) desc.push(`wearing ${c.wardrobe}`)
          return `${c.name} (${desc.join(', ') || 'no description'})`
        }).join('; ') + '.'
      }
    }

    const fullPrompt = `${stylePrefix}.${characterContext} ${storyboard.image_prompt}`

    await supabase
      .from('storyboards')
      .update({ status: 'generating' })
      .eq('id', storyboardId)

    console.log('[storyboard-image] Starting fal.ai generation for', storyboardId)
    console.log('[storyboard-image] Prompt length:', fullPrompt.length, 'Aspect:', project?.aspect_ratio)

    let result
    try {
      result = await generateImage({
        prompt: fullPrompt,
        aspectRatio: project?.aspect_ratio || '16:9',
      })
      console.log('[storyboard-image] fal.ai success, URL:', result.imageUrl.substring(0, 80))
    } catch (falError) {
      console.error('[storyboard-image] fal.ai FAILED:', falError)
      await supabase.from('storyboards').update({ status: 'failed' }).eq('id', storyboardId)
      return NextResponse.json({ error: 'Image generation failed at fal.ai' }, { status: 500 })
    }

    const imageResponse = await fetch(result.imageUrl)
    const imageBlob = await imageResponse.blob()
    const contentType = imageBlob.type || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : 'jpg'
    const fileName = `${projectId}/${storyboardId}.${ext}`

    const storageAdmin = getStorageAdmin()
    const { error: uploadError } = await storageAdmin.storage
      .from('storyboard-images')
      .upload(fileName, imageBlob, {
        contentType,
        upsert: true,
      })

    if (uploadError) {
      console.error('[storyboard-image] Upload FAILED:', uploadError)
      await supabase.from('storyboards').update({ status: 'failed' }).eq('id', storyboardId)
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }
    console.log('[storyboard-image] Upload success:', fileName)

    const { data: { publicUrl } } = storageAdmin.storage
      .from('storyboard-images')
      .getPublicUrl(fileName)

    const thumbUrl = `${publicUrl}?width=400&height=225`

    await supabase
      .from('storyboards')
      .update({
        image_url: publicUrl,
        thumbnail_url: thumbUrl,
        status: 'complete',
      })
      .eq('id', storyboardId)

    await supabase.from('ai_generations').insert({
      project_id: projectId,
      user_id: userId,
      generation_type: 'storyboard',
      provider: 'fal',
      model: 'flux-pro-v1.1',
      input_prompt: fullPrompt,
      output_content: publicUrl,
      tokens_used: 0,
      cost_cents: 3,
      duration_ms: result.durationMs,
      accepted: true,
    })

    return NextResponse.json({
      storyboard: {
        id: storyboardId,
        image_url: publicUrl,
        thumbnail_url: thumbUrl,
        status: 'complete',
      },
    })
  } catch (error) {
    console.error('Storyboard image generation error:', error)

    // Mark storyboard as failed if we have the ID
    try {
      const body = await request.clone().json().catch(() => ({}))
      if (body.storyboardId) {
        const supabase = await createServerSupabaseClient()
        await supabase.from('storyboards').update({ status: 'failed' }).eq('id', body.storyboardId)
      }
    } catch { /* best effort */ }

    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
  }
}
