'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shot, Storyboard } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Image, Camera, Film } from 'lucide-react'

interface StoryboardViewProps {
  projectId: string
  shots: Shot[]
  storyboards: Storyboard[]
}

export function StoryboardView({ projectId, shots, storyboards }: StoryboardViewProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState<string | null>(null)

  async function handleGenerateForShot(shotId: string) {
    setGenerating(shotId)
    try {
      const res = await fetch('/api/ai/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, shotId }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setGenerating(null)
    }
  }

  async function handleGenerateAll() {
    for (const shot of shots) {
      const existing = storyboards.find((sb) => sb.shot_id === shot.id)
      if (!existing) {
        await handleGenerateForShot(shot.id)
      }
    }
  }

  if (shots.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-semibold text-text-primary">Storyboard</h1>
        <div className="panel p-8 text-center">
          <Image className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
          <h2 className="text-lg font-medium text-text-primary mb-2">Shot List Required</h2>
          <p className="text-xs text-text-tertiary">
            Generate shots first, then return here to create storyboard prompts.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-text-primary">Storyboard</h1>
          <p className="text-sm text-text-tertiary mt-1">
            {storyboards.length}/{shots.length} prompts generated
          </p>
        </div>
        <Button onClick={handleGenerateAll} size="sm" className="gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          Generate All Prompts
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shots.map((shot) => {
          const storyboard = storyboards.find((sb) => sb.shot_id === shot.id)
          return (
            <div key={shot.id} className="panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-accent/10 flex items-center justify-center">
                    <span className="text-2xs font-bold text-accent">{shot.shot_number}</span>
                  </div>
                  <Badge>{shot.shot_type}</Badge>
                </div>
                {storyboard ? (
                  <Badge variant="success">Ready</Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleGenerateForShot(shot.id)}
                    loading={generating === shot.id}
                  >
                    <Sparkles className="w-3 h-3" />
                  </Button>
                )}
              </div>

              <p className="text-xs text-text-secondary">{shot.description}</p>

              {storyboard && (
                <div className="space-y-2 pt-2 border-t border-surface-border">
                  <div>
                    <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-1">Image Prompt</p>
                    <p className="text-xs text-text-primary leading-relaxed">{storyboard.image_prompt}</p>
                  </div>
                  {storyboard.video_prompt && (
                    <div>
                      <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-1">Video Prompt</p>
                      <p className="text-xs text-text-primary leading-relaxed">{storyboard.video_prompt}</p>
                    </div>
                  )}
                  {storyboard.style_reference && (
                    <div>
                      <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-1">Style</p>
                      <p className="text-xs text-accent">{storyboard.style_reference}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
