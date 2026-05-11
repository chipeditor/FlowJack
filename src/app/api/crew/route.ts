import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = request.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

  const { data, error } = await supabase
    .from('crew_members')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ members: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { projectId, name, role, department, phone, email, is_cast, character_name, is_key_contact, daily_rate, notes } = body

  if (!projectId || !name || !role || !department) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { count } = await supabase
    .from('crew_members')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  const { data, error } = await supabase
    .from('crew_members')
    .insert({
      project_id: projectId,
      name,
      role,
      department,
      phone: phone || null,
      email: email || null,
      is_cast: is_cast || false,
      character_name: character_name || null,
      is_key_contact: is_key_contact || false,
      daily_rate: daily_rate || null,
      notes: notes || null,
      sort_order: (count || 0) + 1,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ member: data })
}

export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data, error } = await supabase
    .from('crew_members')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ member: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('crew_members')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
