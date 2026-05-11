'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NewProjectModal } from '@/components/dashboard/new-project-modal'
import { Plus, Film, Clock, Clapperboard } from 'lucide-react'

interface DashboardContentProps {
  projects: Project[]
}

export function DashboardContent({ projects }: DashboardContentProps) {
  const [showNewProject, setShowNewProject] = useState(false)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-text-primary">Your Productions</h1>
          <p className="text-sm text-text-tertiary mt-1">
            {projects.length === 0
              ? 'Start your first film project'
              : `${projects.length} project${projects.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button onClick={() => setShowNewProject(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="panel p-16 flex flex-col items-center text-center">
          <Clapperboard className="w-12 h-12 text-text-tertiary mb-4" />
          <h2 className="text-lg font-medium text-text-primary mb-2">No projects yet</h2>
          <p className="text-sm text-text-tertiary max-w-sm mb-6">
            Describe a movie idea and FlowJack will generate a complete production package — screenplay, shots, storyboards, and more.
          </p>
          <Button onClick={() => setShowNewProject(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Film
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/project/${project.id}`}>
              <div className="panel p-5 hover:border-accent/30 transition-all duration-200 cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-accent" />
                    <h3 className="font-medium text-text-primary group-hover:text-accent transition-colors">
                      {project.title}
                    </h3>
                  </div>
                  <Badge variant={project.status === 'complete' ? 'success' : 'default'}>
                    {project.status}
                  </Badge>
                </div>
                {project.logline && (
                  <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                    {project.logline}
                  </p>
                )}
                <div className="flex items-center gap-4 text-2xs text-text-tertiary">
                  {project.genre && <span>{project.genre}</span>}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} />}
    </div>
  )
}
