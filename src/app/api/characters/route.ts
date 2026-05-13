import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { requireProjectPermission, handleAuthError } from '@/lib/auth/check-permission'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const projectId = request.nextUrl.searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    await requireProjectPermission(supabase, projectId, 'characters', 'view')

    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ characters: data || [] })
  } catch (error) {
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { projectId, name, description, physical_traits, wardrobe } = body

    if (!projectId || !name) {
      return NextResponse.json({ error: 'Missing projectId or name' }, { status: 400 })
    }

    await requireProjectPermission(supabase, projectId, 'characters', 'edit')

    const { count } = await supabase
      .from('characters')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)

    const { data, error } = await supabase
      .from('characters')
      .insert({
        project_id: projectId,
        name,
        description: description || null,
        physical_traits: physical_traits || {},
        wardrobe: wardrobe || null,
        sort_order: (count || 0) + 1,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ character: data })
  } catch (error) {
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { id, projectId } = body

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    if (projectId) await requireProjectPermission(supabase, projectId, 'characters', 'edit')

    const updates: Record<string, unknown> = {}
    const allowed = [
      'name', 'description', 'physical_traits', 'wardrobe',
      'reference_image_url', 'reference_image_seed', 'reference_source',
      'actor_id', 'sort_order',
    ]
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('characters')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ character: data })
  } catch (error) {
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Failed to update character' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const id = request.nextUrl.searchParams.get('id')
    const projectId = request.nextUrl.searchParams.get('projectId')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    if (projectId) await requireProjectPermission(supabase, projectId, 'characters', 'edit')

    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 })
  }
}
