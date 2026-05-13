import { ProjectRole, ModuleSlug } from '@/lib/types'

type Action = 'view' | 'edit'

const ROLE_MATRIX: Record<ProjectRole, Record<Action, ModuleSlug[] | '*'>> = {
  owner: {
    view: '*',
    edit: '*',
  },
  editor: {
    view: '*',
    edit: [
      'screenplay', 'scenes', 'shots', 'storyboard',
      'creative_brief', 'shoot_plan', 'crew', 'characters', 'call_sheets',
    ],
  },
  contributor: {
    view: [
      'screenplay', 'scenes', 'shots', 'storyboard',
      'creative_brief', 'shoot_plan', 'crew', 'characters', 'call_sheets',
    ],
    edit: [],
  },
  viewer: {
    view: [
      'screenplay', 'scenes', 'shots', 'storyboard',
      'creative_brief', 'shoot_plan', 'characters', 'call_sheets',
    ],
    edit: [],
  },
}

const SENSITIVE_VIEW_ROLES: Record<string, ProjectRole[]> = {
  crew_pii: ['owner', 'editor'],
  crew_rates: ['owner'],
  budget: ['owner'],
}

export function canAccess(
  role: ProjectRole,
  module: ModuleSlug,
  action: Action,
  contributorPermissions?: ModuleSlug[],
): boolean {
  const allowed = ROLE_MATRIX[role][action]
  if (allowed === '*') return true
  if (role === 'contributor' && action === 'edit') {
    return (contributorPermissions || []).includes(module)
  }
  return allowed.includes(module)
}

export function canViewSensitive(role: ProjectRole, field: keyof typeof SENSITIVE_VIEW_ROLES): boolean {
  return SENSITIVE_VIEW_ROLES[field].includes(role)
}

export function canManageCollaborators(role: ProjectRole): boolean {
  return role === 'owner'
}

export function canTriggerAI(role: ProjectRole): boolean {
  return role === 'owner' || role === 'editor'
}

export function canDeleteProject(role: ProjectRole): boolean {
  return role === 'owner'
}
