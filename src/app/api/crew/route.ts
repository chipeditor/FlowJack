import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { getProjectRole, requireProjectPermission, handleAuthError } from '@/lib/auth/check-permission'
import { canViewSensitive } from '@/lib/auth/role-permissions'
import { CrewMember } from '@/lib/types'

function filterCrewForRole(members: CrewMember[], role: string): Partial<CrewMember>[] {
  return members.map(m => {
    if (role === 'owner') return m
    const base: Partial<CrewMember> = {
      id: m.id, project_id: m.project_id, name: m.name, role: m.role,
      department: m.department, is_cast: m.is_cast, character_name: m.character_name,
      character_description: m.character_description,
      is_key_contact: m.is_key_contact, notes: m.notes, sort_order: m.sort_order,
      created_at: m.created_at, updated_at: m.updated_at,
    }
    if (canViewSensitive(role as 'editor' | 'contributor' | 'viewer', 'crew_pii')) {
      base.phone = m.phone
      base.email = m.email
    }
    if (canViewSensitive(role as 'editor' | 'contributor' | 'viewer', 'crew_rates')) {
      base.daily_rate = m.daily_rate
    }
    return base
  })
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const projectId = request.nextUrl.searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    const { role } = await getProjectRole(supabase, projectId)

    const { data, error } = await supabase
      .from('crew_members')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ members: filterCrewForRole(data as CrewMember[], role) })
  } catch (error) {
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Failed to fetch crew' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { projectId, name, role, department, phone, email, is_cast, character_name, character_description, is_key_contact, daily_rate, notes } = body

    if (!projectId || !name || !role || !department) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await requireProjectPermission(supabase, projectId, 'crew', 'edit')

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
        character_description: character_description || null,
        is_key_contact: is_key_contact || false,
        daily_rate: daily_rate || null,
        notes: notes || null,
        sort_order: (count || 0) + 1,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ member: data })
  } catch (error) {
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Failed to create crew member' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { id, projectId } = body

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    if (projectId) await requireProjectPermission(supabase, projectId, 'crew', 'edit')

    const updates: Record<string, unknown> = {}
    const allowed = ['name', 'role', 'department', 'phone', 'email', 'is_cast', 'character_name', 'character_description', 'is_key_contact', 'daily_rate', 'notes', 'sort_order']
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    const { data, error } = await supabase
      .from('crew_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ member: data })
  } catch (error) {
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Failed to update crew member' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const id = request.nextUrl.searchParams.get('id')
    const projectId = request.nextUrl.searchParams.get('projectId')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    if (projectId) await requireProjectPermission(supabase, projectId, 'crew', 'edit')

    const { error } = await supabase
      .from('crew_members')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Failed to delete crew member' }, { status: 500 })
  }
}
