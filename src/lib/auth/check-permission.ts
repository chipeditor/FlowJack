import { SupabaseClient } from '@supabase/supabase-js'
import { ProjectRole, ModuleSlug } from '@/lib/types'
import { canAccess, canTriggerAI } from './role-permissions'
import { NextResponse } from 'next/server'

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 403) {
    super(message)
    this.status = status
  }
}

interface PermissionResult {
  userId: string
  role: ProjectRole
  permissions: ModuleSlug[]
}

export async function getProjectRole(
  supabase: SupabaseClient,
  projectId: string,
): Promise<PermissionResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new AuthError('Not authenticated', 401)

  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (project?.user_id === user.id) {
    return { userId: user.id, role: 'owner', permissions: [] }
  }

  const { data: membership } = await supabase
    .from('project_members')
    .select('role, permissions')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!membership) throw new AuthError('No access to this project')

  return {
    userId: user.id,
    role: membership.role as ProjectRole,
    permissions: (membership.permissions || []) as ModuleSlug[],
  }
}

export async function requireProjectPermission(
  supabase: SupabaseClient,
  projectId: string,
  module: ModuleSlug,
  action: 'view' | 'edit',
): Promise<PermissionResult> {
  const result = await getProjectRole(supabase, projectId)

  if (!canAccess(result.role, module, action, result.permissions)) {
    throw new AuthError(
      action === 'edit'
        ? 'You do not have permission to edit this module'
        : 'You do not have permission to view this module'
    )
  }

  return result
}

export async function requireAIPermission(
  supabase: SupabaseClient,
  projectId: string,
): Promise<PermissionResult> {
  const result = await getProjectRole(supabase, projectId)

  if (!canTriggerAI(result.role)) {
    throw new AuthError('Only owners and editors can trigger AI generation')
  }

  return result
}

export function handleAuthError(error: unknown): NextResponse | null {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  return null
}
