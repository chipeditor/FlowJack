'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scene, Shot } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Camera, Video, Move, Aperture } from 'lucide-react'

interface ShotsViewProps {
  projectId: string
  scenes: Scene[]
  shots: Shot[]
}

export function ShotsView({ projectId, scenes, shots }: ShotsViewProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState<string | null>(null)

  async function handleGenerateForScene(sceneId: string) {
    setGenerating(sceneId)
    try {
      const res = await fetch('/api/ai/generate-shots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, sceneId }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setGenerating(null)
    }
  }

  if (scenes.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-semibold text-text-primary">Shot List</h1>
        <div className="panel p-8 text-center">
          <Camera className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
          <h2 className="text-lg font-medium text-text-primary mb-2">Scenes Required</h2>
          <p className="text-xs text-text-tertiary">
            Generate a scene breakdown first, then return here to design shots.
          </p>
        </div>
      </div>
    )
  }

  const shotsByScene = scenes.map((scene) => ({
    scene,
    shots: shots.filter((s) => s.scene_id === scene.id),
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-semibold text-text-primary">Shot List</h1>
        <p className="text-sm text-text-tertiary mt-1">
          {shots.length} shots across {scenes.length} scenes
        </p>
      </div>

      {shotsByScene.map(({ scene, shots: sceneShots }) => (
        <div key={scene.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xs text-text-tertiary uppercase tracking-wider">
                Scene {scene.scene_number}
              </span>
              <h2 className="font-mono text-sm font-medium text-text-primary">{scene.heading}</h2>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleGenerateForScene(scene.id)}
              loading={generating === scene.id}
              className="gap-1.5"
            >
              <Sparkles className="w-3 h-3" />
              {sceneShots.length > 0 ? 'Regenerate' : 'Generate Shots'}
            </Button>
          </div>

          {sceneShots.length > 0 ? (
            <div className="space-y-2">
              {sceneShots.map((shot) => (
                <div key={shot.id} className="panel p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-accent">{shot.shot_number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="accent">{shot.shot_type}</Badge>
                        {shot.camera_movement && (
                          <span className="flex items-center gap-1 text-2xs text-text-tertiary">
                            <Move className="w-3 h-3" />
                            {shot.camera_movement}
                          </span>
                        )}
                        {shot.lens && (
                          <span className="flex items-center gap-1 text-2xs text-text-tertiary">
                            <Aperture className="w-3 h-3" />
                            {shot.lens}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-primary">{shot.description}</p>
                      {shot.dialogue && (
                        <p className="text-xs text-text-secondary italic mt-1.5">
                          &ldquo;{shot.dialogue}&rdquo;
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-2xs text-text-tertiary">
                        {shot.lighting && <span>{shot.lighting}</span>}
                        {shot.duration_seconds && <span>{shot.duration_seconds}s</span>}
                        {shot.transition !== 'cut' && <span>{shot.transition}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel p-6 text-center border-dashed">
              <Video className="w-6 h-6 text-text-tertiary mx-auto mb-2" />
              <p className="text-xs text-text-tertiary">No shots generated yet</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
