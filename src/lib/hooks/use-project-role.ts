'use client'

import { useState, useEffect } from 'react'
import { ProjectRole, ModuleSlug } from '@/lib/types'

interface ProjectRoleState {
  role: ProjectRole
  permissions: ModuleSlug[]
  loading: boolean
}

export function useProjectRole(projectId: string): ProjectRoleState {
  const [state, setState] = useState<ProjectRoleState>({
    role: 'viewer',
    permissions: [],
    loading: true,
  })

  useEffect(() => {
    fetch(`/api/project-role?projectId=${projectId}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          setState({ role: data.role, permissions: data.permissions, loading: false })
        } else {
          setState(prev => ({ ...prev, loading: false }))
        }
      })
      .catch(() => setState(prev => ({ ...prev, loading: false })))
  }, [projectId])

  return state
}
