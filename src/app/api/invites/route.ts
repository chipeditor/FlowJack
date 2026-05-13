import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { getProjectRole, handleAuthError } from '@/lib/auth/check-permission'
import { canManageCollaborators } from '@/lib/auth/role-permissions'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const projectId = request.nextUrl.searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    const { role } = await getProjectRole(supabase, projectId)
    if (!canManageCollaborators(role)) {
      return NextResponse.json({ error: 'Only the project owner can manage collaborators' }, { status: 403 })
    }

    const { data: members } = await supabase
      .from('project_members')
      .select('*, profile:profiles(id, display_name, avatar_url)')
      .eq('project_id', projectId)
      .order('joined_at')

    const { data: invites } = await supabase
      .from('project_invites')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    return NextResponse.json({ members: members || [], invites: invites || [] })
  } catch (error) {
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { projectId, email, role, permissions } = await request.json()

    if (!projectId || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { userId, role: callerRole } = await getProjectRole(supabase, projectId)
    if (!canManageCollaborators(callerRole)) {
      return NextResponse.json({ error: 'Only the project owner can invite collaborators' }, { status: 403 })
    }

    const { count } = await supabase
      .from('project_invites')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('invited_email', email)
      .eq('status', 'pending')

    if (count && count > 0) {
      return NextResponse.json({ error: 'An invite is already pending for this email' }, { status: 409 })
    }

    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', (await supabase.from('profiles').select('id').eq('id', email).single()).data?.id || '')
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json({ error: 'This user is already a collaborator' }, { status: 409 })
    }

    const { data: invite, error } = await supabase
      .from('project_invites')
      .insert({
        project_id: projectId,
        invited_email: email,
        role,
        permissions: permissions || [],
        invited_by: userId,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ invite })
  } catch (error) {
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const id = request.nextUrl.searchParams.get('id')
    const projectId = request.nextUrl.searchParams.get('projectId')
    const type = request.nextUrl.searchParams.get('type')

    if (!id || !projectId) return NextResponse.json({ error: 'Missing id or projectId' }, { status: 400 })

    const { role } = await getProjectRole(supabase, projectId)
    if (!canManageCollaborators(role)) {
      return NextResponse.json({ error: 'Only the project owner can manage collaborators' }, { status: 403 })
    }

    if (type === 'invite') {
      await supabase
        .from('project_invites')
        .update({ status: 'revoked' })
        .eq('id', id)
    } else {
      await supabase
        .from('project_members')
        .delete()
        .eq('id', id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 })
  }
}
