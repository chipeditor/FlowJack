'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Shield,
  User,
  FileText,
  Layers,
  Camera,
  Users,
  Palette,
  ClipboardList,
  CheckCircle2,
  Circle,
  Clock,
  Film,
} from 'lucide-react'

interface AdminProjectViewProps {
  project: {
    id: string
    title: string
    logline: string | null
    genre: string | null
    tone: string | null
    duration_target: string | null
    status: string
    idea_input: string | null
    created_at: string
    updated_at: string
  }
  owner: {
    name: string
    email: string
    tier: string
  }
  screenplay: {
    wordCount: number
    estimatedRuntime: number
    preview: string
  } | null
  scenes: {
    scene_number: number
    heading: string
    description: string | null
    characters: string[]
    mood: string | null
    interior_exterior: string | null
    time_of_day: string | null
  }[]
  characters: {
    name: string
    description: string | null
    reference_image_url: string | null
  }[]
  stats: {
    shotCount: number
    hasCreativeBrief: boolean
    hasShootPlan: boolean
    crewCount: number
  }
}

export function AdminProjectView({ project, owner, screenplay, scenes, characters, stats }: AdminProjectViewProps) {
  const pipeline = [
    { name: 'Logline', done: !!project.logline, icon: Film },
    { name: 'Screenplay', done: !!screenplay, icon: FileText, detail: screenplay ? `${screenplay.wordCount.toLocaleString()} words` : undefined },
    { name: 'Creative Brief', done: stats.hasCreativeBrief, icon: Palette },
    { name: 'Scene Breakdown', done: scenes.length > 0, icon: Layers, detail: scenes.length > 0 ? `${scenes.length} scenes` : undefined },
    { name: 'Shot List', done: stats.shotCount > 0, icon: Camera, detail: stats.shotCount > 0 ? `${stats.shotCount} shots` : undefined },
    { name: 'Production Plan', done: stats.hasShootPlan, icon: ClipboardList },
  ]

  const completedSteps = pipeline.filter(s => s.done).length

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-text-tertiary">Admin View</span>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Projects
          </Link>
        </div>

        {/* Project title + owner */}
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">{project.title}</h1>
          {project.logline && (
            <p className="text-text-secondary mt-2 text-lg leading-relaxed italic">
              &ldquo;{project.logline}&rdquo;
            </p>
          )}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 panel px-3 py-2">
              <User className="w-4 h-4 text-text-tertiary" />
              <span className="text-sm text-text-primary">{owner.name}</span>
              <span className="text-xs text-text-tertiary">{owner.email}</span>
              <Badge variant="accent">{owner.tier}</Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-tertiary">
              <Clock className="w-3 h-3" />
              Created {new Date(project.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-4 gap-4">
          {project.genre && (
            <div className="panel p-4">
              <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-1">Genre</p>
              <p className="text-sm font-medium text-text-primary">{project.genre}</p>
            </div>
          )}
          {project.tone && (
            <div className="panel p-4">
              <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-1">Tone</p>
              <p className="text-sm font-medium text-text-primary">{project.tone}</p>
            </div>
          )}
          {project.duration_target && (
            <div className="panel p-4">
              <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-1">Duration</p>
              <p className="text-sm font-medium text-text-primary capitalize">{project.duration_target}</p>
            </div>
          )}
          <div className="panel p-4">
            <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-1">Status</p>
            <Badge variant={project.status === 'complete' ? 'success' : 'default'}>{project.status}</Badge>
          </div>
        </div>

        {/* Pipeline progress */}
        <div className="panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-text-primary">Production Pipeline</h2>
            <span className="text-xs text-text-tertiary">{completedSteps}/{pipeline.length} complete</span>
          </div>
          <div className="space-y-2">
            {pipeline.map((step) => (
              <div
                key={step.name}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                  step.done ? 'bg-status-success/5' : 'opacity-40'
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-status-success" />
                ) : (
                  <Circle className="w-4.5 h-4.5 text-text-tertiary" />
                )}
                <step.icon className="w-4 h-4 text-text-secondary" />
                <span className="text-sm font-medium text-text-primary flex-1">{step.name}</span>
                {step.detail && (
                  <span className="text-xs text-text-tertiary">{step.detail}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Characters */}
        {characters.length > 0 && (
          <div className="panel p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-text-tertiary" />
              <h2 className="font-display font-semibold text-text-primary">
                Characters ({characters.length})
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {characters.map((c) => (
                <div key={c.name} className="flex items-center gap-3 p-3 rounded-xl bg-surface-hover/50">
                  {c.reference_image_url ? (
                    <img
                      src={c.reference_image_url}
                      alt={c.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-border flex items-center justify-center">
                      <User className="w-4 h-4 text-text-tertiary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
                    {c.description && (
                      <p className="text-xs text-text-tertiary line-clamp-1">{c.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scenes */}
        {scenes.length > 0 && (
          <div className="panel p-6">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-text-tertiary" />
              <h2 className="font-display font-semibold text-text-primary">
                Scenes ({scenes.length})
              </h2>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {scenes.map((s) => (
                <div key={s.scene_number} className="flex items-start gap-3 p-3 rounded-xl bg-surface-hover/50">
                  <span className="text-xs font-mono text-text-tertiary w-6 pt-0.5 text-right shrink-0">
                    {s.scene_number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">{s.heading}</p>
                    {s.description && (
                      <p className="text-xs text-text-tertiary line-clamp-2 mt-0.5">{s.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {s.characters?.map((ch: string) => (
                        <span key={ch} className="text-2xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                          {ch}
                        </span>
                      ))}
                      {s.mood && (
                        <span className="text-2xs text-text-tertiary italic">{s.mood}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Screenplay preview */}
        {screenplay && (
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-text-tertiary" />
                <h2 className="font-display font-semibold text-text-primary">Screenplay Preview</h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-tertiary">
                <span>{screenplay.wordCount.toLocaleString()} words</span>
                {screenplay.estimatedRuntime > 0 && (
                  <span>~{Math.round(screenplay.estimatedRuntime / 60)} min</span>
                )}
              </div>
            </div>
            <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto bg-canvas p-4 rounded-xl">
              {screenplay.preview}
              {screenplay.preview.length >= 2000 && '\n\n[...truncated]'}
            </pre>
          </div>
        )}

        {/* Stats footer */}
        {stats.crewCount > 0 && (
          <div className="panel p-4 flex items-center gap-4 text-sm text-text-tertiary">
            <Users className="w-4 h-4" />
            <span>{stats.crewCount} crew members</span>
          </div>
        )}
      </div>
    </div>
  )
}
