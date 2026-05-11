'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  FileText,
  Layers,
  Camera,
  Image,
  ClipboardList,
  CheckCircle2,
  Circle,
  ArrowRight,
} from 'lucide-react'

interface ProjectOverviewProps {
  project: Project
  hasScreenplay: boolean
  sceneCount: number
  shotCount: number
}

export function ProjectOverview({ project, hasScreenplay, sceneCount, shotCount }: ProjectOverviewProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)

  const pipeline = [
    { name: 'Logline', done: !!project.logline, icon: Sparkles, href: '' },
    { name: 'Screenplay', done: hasScreenplay, icon: FileText, href: `/project/${project.id}/screenplay` },
    { name: 'Scene Breakdown', done: sceneCount > 0, icon: Layers, href: `/project/${project.id}/scenes` },
    { name: 'Shot List', done: shotCount > 0, icon: Camera, href: `/project/${project.id}/shots` },
    { name: 'Storyboard', done: false, icon: Image, href: `/project/${project.id}/storyboard` },
    { name: 'Production Plan', done: false, icon: ClipboardList, href: `/project/${project.id}/production-plan` },
  ]

  const completedSteps = pipeline.filter((s) => s.done).length
  const nextStep = pipeline.find((s) => !s.done)

  async function handleGenerateLogline() {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-logline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, idea: project.idea_input, genre: project.genre, tone: project.tone }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Project header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-text-primary">{project.title}</h1>
        {project.logline && (
          <p className="text-text-secondary mt-2 text-lg leading-relaxed italic">
            &ldquo;{project.logline}&rdquo;
          </p>
        )}
        {!project.logline && project.idea_input && (
          <div className="mt-4 panel p-4">
            <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">Original Idea</p>
            <p className="text-sm text-text-secondary">{project.idea_input}</p>
            <Button onClick={handleGenerateLogline} loading={generating} size="sm" className="mt-4 gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Generate Logline
            </Button>
          </div>
        )}
      </div>

      {/* Production pipeline */}
      <div className="panel p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-text-primary">Production Pipeline</h2>
          <span className="text-xs text-text-tertiary">{completedSteps}/{pipeline.length} complete</span>
        </div>

        <div className="space-y-2">
          {pipeline.map((step, i) => (
            <div
              key={step.name}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                step.done
                  ? 'bg-status-success/5'
                  : step === nextStep
                  ? 'bg-accent/5 border border-accent/20'
                  : 'opacity-50'
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-status-success" />
              ) : (
                <Circle className="w-4.5 h-4.5 text-text-tertiary" />
              )}
              <step.icon className="w-4 h-4 text-text-secondary" />
              <span className="text-sm font-medium text-text-primary flex-1">{step.name}</span>
              {step.done && step.href && (
                <button
                  onClick={() => router.push(step.href)}
                  className="text-xs text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
                >
                  View <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {step === nextStep && !step.done && (
                <Badge variant="accent">Next</Badge>
              )}
            </div>
          ))}
        </div>

        {nextStep && nextStep.name !== 'Logline' && nextStep.href && (
          <Button
            onClick={() => router.push(nextStep.href)}
            className="mt-5 gap-2 w-full"
          >
            <Sparkles className="w-4 h-4" />
            Generate {nextStep.name}
          </Button>
        )}
      </div>

      {/* Project metadata */}
      <div className="grid grid-cols-3 gap-4">
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
      </div>
    </div>
  )
}
