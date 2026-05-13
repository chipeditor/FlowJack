'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Film, Users, FolderOpen, Clock, ArrowLeft, Shield } from 'lucide-react'

interface EnrichedProject {
  id: string
  title: string
  logline: string | null
  genre: string | null
  status: string
  created_at: string
  updated_at: string
  user_id: string
  owner_name: string | null
  owner_email: string | null
  owner_tier: string
}

interface AdminDashboardProps {
  projects: EnrichedProject[]
  stats: {
    totalUsers: number
    totalProjects: number
  }
}

export function AdminDashboard({ projects, stats }: AdminDashboardProps) {
  const uniqueOwners = new Set(projects.map(p => p.user_id)).size

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-amber-500" />
            <div>
              <h1 className="text-2xl font-display font-semibold text-text-primary">
                Admin Portal
              </h1>
              <p className="text-sm text-text-tertiary mt-0.5">Beta overview — all users and projects</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="panel p-5">
            <div className="flex items-center gap-2 text-text-tertiary mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Total Users</span>
            </div>
            <p className="text-3xl font-semibold text-text-primary">{stats.totalUsers}</p>
          </div>
          <div className="panel p-5">
            <div className="flex items-center gap-2 text-text-tertiary mb-1">
              <FolderOpen className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Total Projects</span>
            </div>
            <p className="text-3xl font-semibold text-text-primary">{stats.totalProjects}</p>
          </div>
          <div className="panel p-5">
            <div className="flex items-center gap-2 text-text-tertiary mb-1">
              <Film className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Active Creators</span>
            </div>
            <p className="text-3xl font-semibold text-text-primary">{uniqueOwners}</p>
          </div>
        </div>

        {/* Projects table */}
        <div className="panel overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border">
            <h2 className="text-sm font-medium text-text-primary">
              All Projects ({projects.length})
            </h2>
          </div>
          {projects.length === 0 ? (
            <div className="p-12 text-center text-text-tertiary text-sm">
              No projects yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-text-tertiary text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-3 font-medium">Project</th>
                    <th className="text-left px-5 py-3 font-medium">Owner</th>
                    <th className="text-left px-5 py-3 font-medium">Genre</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Created</th>
                    <th className="text-left px-5 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-surface-hover transition-colors"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/project/${project.id}`}
                          className="text-text-primary hover:text-accent font-medium transition-colors"
                        >
                          {project.title}
                        </Link>
                        {project.logline && (
                          <p className="text-xs text-text-tertiary line-clamp-1 mt-0.5 max-w-sm">
                            {project.logline}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-text-secondary">
                          {project.owner_name || 'Unnamed'}
                        </div>
                        <div className="text-xs text-text-tertiary">
                          {project.owner_email}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-text-secondary">
                        {project.genre || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={project.status === 'complete' ? 'success' : 'default'}>
                          {project.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-text-tertiary text-xs">
                        {new Date(project.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-text-tertiary text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(project.updated_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
