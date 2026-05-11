'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scene } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Layers, MapPin, Clock, Users } from 'lucide-react'

interface ScenesViewProps {
  projectId: string
  scenes: Scene[]
  hasScreenplay: boolean
}

export function ScenesView({ projectId, scenes, hasScreenplay }: ScenesViewProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setGenerating(false)
    }
  }

  if (scenes.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-semibold text-text-primary">Scene Breakdown</h1>
        <div className="panel p-8 text-center">
          <Layers className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
          {hasScreenplay ? (
            <>
              <h2 className="text-lg font-medium text-text-primary mb-2">Break Down Scenes</h2>
              <p className="text-xs text-text-tertiary mb-6">
                Extract individual scenes from your screenplay with locations, characters, and production notes.
              </p>
              <Button onClick={handleGenerate} loading={generating} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Scene Breakdown
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-medium text-text-primary mb-2">Screenplay Required</h2>
              <p className="text-xs text-text-tertiary">
                Generate a screenplay first, then return here to break it into scenes.
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  const totalDuration = scenes.reduce((sum, s) => sum + (s.estimated_duration_seconds || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-text-primary">Scene Breakdown</h1>
          <p className="text-sm text-text-tertiary mt-1">
            {scenes.length} scenes &middot; ~{Math.round(totalDuration / 60)} min estimated
          </p>
        </div>
        <Button variant="secondary" onClick={handleGenerate} loading={generating} size="sm" className="gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          Regenerate
        </Button>
      </div>

      <div className="space-y-3">
        {scenes.map((scene) => (
          <div key={scene.id} className="panel p-5 hover:border-accent/20 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-2xs text-text-tertiary uppercase tracking-wider">
                  Scene {scene.scene_number}
                </span>
                <h3 className="font-mono text-sm font-medium text-text-primary mt-0.5">
                  {scene.heading}
                </h3>
              </div>
              {scene.mood && <Badge variant="accent">{scene.mood}</Badge>}
            </div>

            {scene.description && (
              <p className="text-sm text-text-secondary mb-3">{scene.description}</p>
            )}

            <div className="flex items-center gap-4 text-2xs text-text-tertiary">
              {scene.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {scene.location}
                </span>
              )}
              {scene.characters && scene.characters.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {scene.characters.join(', ')}
                </span>
              )}
              {scene.estimated_duration_seconds && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {scene.estimated_duration_seconds}s
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
