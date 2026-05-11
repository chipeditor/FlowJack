'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Project, Script } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, FileText, Clock, Hash } from 'lucide-react'

interface ScreenplayViewProps {
  project: Pick<Project, 'id' | 'title' | 'logline' | 'genre' | 'tone' | 'duration_target'>
  script: Script | null
}

export function ScreenplayView({ project, script }: ScreenplayViewProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-screenplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setGenerating(false)
    }
  }

  if (!script) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-semibold text-text-primary">Screenplay</h1>

        {!project.logline ? (
          <div className="panel p-8 text-center">
            <FileText className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-secondary mb-2">Generate a logline first</p>
            <p className="text-xs text-text-tertiary">
              Return to the project overview to generate a logline before writing the screenplay.
            </p>
          </div>
        ) : (
          <div className="panel p-8 text-center">
            <FileText className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
            <h2 className="text-lg font-medium text-text-primary mb-2">Ready to Write</h2>
            <p className="text-sm text-text-secondary mb-1 italic">&ldquo;{project.logline}&rdquo;</p>
            <p className="text-xs text-text-tertiary mb-6">
              FlowJack will generate a professional short screenplay based on your logline.
            </p>
            <Button onClick={handleGenerate} loading={generating} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Screenplay
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-text-primary">Screenplay</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge>v{script.version}</Badge>
            {script.word_count && (
              <span className="flex items-center gap-1 text-xs text-text-tertiary">
                <Hash className="w-3 h-3" />
                {script.word_count} words
              </span>
            )}
            {script.estimated_runtime_seconds && (
              <span className="flex items-center gap-1 text-xs text-text-tertiary">
                <Clock className="w-3 h-3" />
                ~{Math.round(script.estimated_runtime_seconds / 60)} min
              </span>
            )}
          </div>
        </div>
        <Button variant="secondary" onClick={handleGenerate} loading={generating} size="sm" className="gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          Regenerate
        </Button>
      </div>

      <div className="panel p-8">
        <pre className="font-mono text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
          {script.content}
        </pre>
      </div>
    </div>
  )
}
