'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProductionPlan } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Sparkles, ClipboardList, Music, Mic, Palette, Film } from 'lucide-react'

interface CreativeBriefViewProps {
  projectId: string
  plan: ProductionPlan | null
  hasScreenplay: boolean
}

export function CreativeBriefView({ projectId, plan, hasScreenplay }: CreativeBriefViewProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-production-plan', {
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

  if (!plan) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-semibold text-text-primary">Creative Brief</h1>
        <div className="panel p-8 text-center">
          <ClipboardList className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
          {hasScreenplay ? (
            <>
              <h2 className="text-lg font-medium text-text-primary mb-2">Generate Creative Brief</h2>
              <p className="text-xs text-text-tertiary mb-6">
                Create voiceover direction, music cues, SFX notes, color palette, and visual style guidance.
              </p>
              <Button onClick={handleGenerate} loading={generating} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Brief
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-medium text-text-primary mb-2">Screenplay Required</h2>
              <p className="text-xs text-text-tertiary">
                Generate a screenplay first to create a production plan.
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-text-primary">Creative Brief</h1>
        <Button variant="secondary" onClick={handleGenerate} loading={generating} size="sm" className="gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          Regenerate
        </Button>
      </div>

      {/* Color Palette */}
      {plan.color_palette && plan.color_palette.length > 0 && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-accent" />
            <h2 className="font-medium text-text-primary text-sm">Color Palette</h2>
          </div>
          <div className="flex gap-2">
            {plan.color_palette.map((color, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="w-12 h-12 rounded-lg border border-surface-border"
                  style={{ backgroundColor: color }}
                />
                <span className="text-2xs text-text-tertiary font-mono">{color}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Style */}
      {plan.visual_style && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <Film className="w-4 h-4 text-accent" />
            <h2 className="font-medium text-text-primary text-sm">Visual Style</h2>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{plan.visual_style}</p>
        </div>
      )}

      {/* Music Direction */}
      {plan.music_direction && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <Music className="w-4 h-4 text-accent" />
            <h2 className="font-medium text-text-primary text-sm">Music Direction</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-1">Genre</p>
              <p className="text-text-primary">{plan.music_direction.genre}</p>
            </div>
            <div>
              <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-1">Tempo</p>
              <p className="text-text-primary">{plan.music_direction.tempo}</p>
            </div>
            <div>
              <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-1">Mood</p>
              <p className="text-text-primary">{plan.music_direction.mood}</p>
            </div>
            <div>
              <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-1">Instruments</p>
              <p className="text-text-primary">{plan.music_direction.instruments?.join(', ')}</p>
            </div>
          </div>
          {plan.music_direction.reference_tracks && plan.music_direction.reference_tracks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-surface-border">
              <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-1">Reference Tracks</p>
              <ul className="space-y-1">
                {plan.music_direction.reference_tracks.map((track, i) => (
                  <li key={i} className="text-xs text-text-secondary">{track}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Voiceover Direction */}
      {plan.voiceover_direction && plan.voiceover_direction.length > 0 && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <Mic className="w-4 h-4 text-accent" />
            <h2 className="font-medium text-text-primary text-sm">Voiceover Direction</h2>
          </div>
          <div className="space-y-3">
            {plan.voiceover_direction.map((vo, i) => (
              <div key={i} className="p-3 bg-canvas rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xs text-text-tertiary">Scene {vo.scene_number}</span>
                  {vo.character && <span className="text-2xs text-accent">{vo.character}</span>}
                  {vo.tone && <span className="text-2xs text-text-tertiary">({vo.tone})</span>}
                </div>
                <p className="text-xs text-text-secondary">{vo.direction}</p>
                {vo.text && <p className="text-xs text-text-primary italic mt-1">&ldquo;{vo.text}&rdquo;</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reference Films */}
      {plan.reference_films && plan.reference_films.length > 0 && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <Film className="w-4 h-4 text-accent" />
            <h2 className="font-medium text-text-primary text-sm">Reference Films</h2>
          </div>
          <ul className="space-y-1.5">
            {plan.reference_films.map((film, i) => (
              <li key={i} className="text-sm text-text-secondary">{film}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
