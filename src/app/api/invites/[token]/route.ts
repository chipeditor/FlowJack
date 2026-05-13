import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/db/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const admin = await createAdminClient()

    const { data: invite } = await admin
      .from('project_invites')
      .select('id, project_id, invited_email, role, permissions, status, expires_at, projects(title)')
      .eq('token', token)
      .single()

    if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    if (invite.status !== 'pending') return NextResponse.json({ error: 'Invite is no longer valid', status: invite.status }, { status: 410 })
    if (new Date(invite.expires_at) < new Date()) {
      await admin.from('project_invites').update({ status: 'expired' }).eq('id', invite.id)
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
    }

    return NextResponse.json({
      invite: {
        role: invite.role,
        email: invite.invited_email,
        projectTitle: (invite.projects as unknown as { title: string } | null)?.title || 'Untitled Project',
      }
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch invite' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { action } = await request.json()

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in to accept this invite' }, { status: 401 })

    const admin = await createAdminClient()

    const { data: invite } = await admin
      .from('project_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (!invite) return NextResponse.json({ error: 'Invite not found or already used' }, { status: 404 })
    if (new Date(invite.expires_at) < new Date()) {
      await admin.from('project_invites').update({ status: 'expired' }).eq('id', invite.id)
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
    }

    if (action === 'decline') {
      await admin
        .from('project_invites')
        .update({ status: 'declined' })
        .eq('id', invite.id)
      return NextResponse.json({ declined: true })
    }

    const { data: project } = await admin
      .from('projects')
      .select('user_id')
      .eq('id', invite.project_id)
      .single()

    if (project?.user_id === user.id) {
      return NextResponse.json({ error: 'You are already the owner of this project' }, { status: 409 })
    }

    const { error: memberError } = await admin
      .from('project_members')
      .insert({
        project_id: invite.project_id,
        user_id: user.id,
        role: invite.role,
        permissions: invite.permissions,
        invited_by: invite.invited_by,
      })

    if (memberError) {
      if (memberError.code === '23505') {
        return NextResponse.json({ error: 'You are already a collaborator on this project' }, { status: 409 })
      }
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    await admin
      .from('project_invites')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    return NextResponse.json({ accepted: true, projectId: invite.project_id })
  } catch {
    return NextResponse.json({ error: 'Failed to process invite' }, { status: 500 })
  }
}
