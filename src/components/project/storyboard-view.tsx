'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Shot, Storyboard } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Image, ImagePlus, Loader2, RefreshCw } from 'lucide-react'

interface StoryboardViewProps {
  projectId: string
  shots: Shot[]
  storyboards: Storyboard[]
}

const CONCURRENCY_LIMIT = 5

export function StoryboardView({ projectId, shots, storyboards: initialStoryboards }: StoryboardViewProps) {
  const router = useRouter()
  const [storyboards, setStoryboards] = useState(initialStoryboards)
  const [generatingPrompt, setGeneratingPrompt] = useState<string | null>(null)
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set())
  const [generatingAll, setGeneratingAll] = useState(false)
  const [allProgress, setAllProgress] = useState({ done: 0, total: 0 })
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const hasGenerating = generatingImages.size > 0 || generatingAll

  const pollStatus = useCallback(async () => {
    const res = await fetch(`/api/storyboard-status?projectId=${projectId}`)
    if (!res.ok) return
    const data = await res.json()
    const updated = data.storyboards as { id: string; shot_id: string; image_url: string | null; thumbnail_url: string | null; status: string }[]

    setStoryboards(prev => prev.map(sb => {
      const fresh = updated.find(u => u.id === sb.id)
      if (!fresh) return sb
      return { ...sb, image_url: fresh.image_url, thumbnail_url: fresh.thumbnail_url, status: fresh.status as Storyboard['status'] }
    }))

    const stillGenerating = updated.some(u => u.status === 'generating')
    if (!stillGenerating && pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
      setGeneratingImages(new Set())
      setGeneratingAll(false)
    }
  }, [projectId])

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  function startPolling() {
    if (pollingRef.current) return
    pollingRef.current = setInterval(pollStatus, 3000)
  }

  async function handleGeneratePrompt(shotId: string) {
    setGeneratingPrompt(shotId)
    try {
      const res = await fetch('/api/ai/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, shotId }),
      })
      if (res.ok) {
        const data = await res.json()
        setStoryboards(prev => [...prev, data.storyboard])
      }
    } finally {
      setGeneratingPrompt(null)
    }
  }

  async function handleGenerateImage(storyboardId: string) {
    setGeneratingImages(prev => new Set(prev).add(storyboardId))
    setStoryboards(prev => prev.map(sb =>
      sb.id === storyboardId ? { ...sb, status: 'generating' as const } : sb
    ))
    startPolling()

    try {
      const res = await fetch('/api/ai/generate-storyboard-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, storyboardId }),
      })
      if (res.ok) {
        const data = await res.json()
        setStoryboards(prev => prev.map(sb =>
          sb.id === storyboardId ? { ...sb, ...data.storyboard } : sb
        ))
      }
    } catch {
      setStoryboards(prev => prev.map(sb =>
        sb.id === storyboardId ? { ...sb, status: 'failed' as const } : sb
      ))
    } finally {
      setGeneratingImages(prev => {
        const next = new Set(prev)
        next.delete(storyboardId)
        return next
      })
    }
  }

  async function handleGenerateAllPrompts() {
    for (const shot of shots) {
      const existing = storyboards.find(sb => sb.shot_id === shot.id)
      if (!existing) {
        await handleGeneratePrompt(shot.id)
      }
    }
  }

  async function handleGenerateAllImages() {
    const needImages = storyboards.filter(sb => sb.image_prompt && !sb.image_url && sb.status !== 'generating')
    if (needImages.length === 0) return

    setGeneratingAll(true)
    setAllProgress({ done: 0, total: needImages.length })
    startPolling()

    const queue = [...needImages]
    let completed = 0

    async function processNext(): Promise<void> {
      const item = queue.shift()
      if (!item) return

      setGeneratingImages(prev => new Set(prev).add(item.id))
      setStoryboards(prev => prev.map(sb =>
        sb.id === item.id ? { ...sb, status: 'generating' as const } : sb
      ))

      try {
        const res = await fetch('/api/ai/generate-storyboard-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, storyboardId: item.id }),
        })
        if (res.ok) {
          const data = await res.json()
          setStoryboards(prev => prev.map(sb =>
            sb.id === item.id ? { ...sb, ...data.storyboard } : sb
          ))
        }
      } catch {
        setStoryboards(prev => prev.map(sb =>
          sb.id === item.id ? { ...sb, status: 'failed' as const } : sb
        ))
      } finally {
        completed++
        setAllProgress({ done: completed, total: needImages.length })
        setGeneratingImages(prev => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      }

      return processNext()
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, needImages.length) }, () => processNext())
    await Promise.all(workers)

    setGeneratingAll(false)
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
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

  const promptCount = storyboards.length
  const imageCount = storyboards.filter(sb => sb.image_url).length
  const hasAllPrompts = promptCount === shots.length
  const hasPromptsWithoutImages = storyboards.some(sb => sb.image_prompt && !sb.image_url && sb.status !== 'generating')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-text-primary">Storyboard</h1>
          <p className="text-sm text-text-tertiary mt-1">
            {promptCount}/{shots.length} prompts · {imageCount}/{shots.length} images
          </p>
        </div>
        <div className="flex gap-2">
          {!hasAllPrompts && (
            <Button onClick={handleGenerateAllPrompts} size="sm" variant="secondary" className="gap-2" disabled={!!generatingPrompt}>
              <Sparkles className="w-3.5 h-3.5" />
              Generate All Prompts
            </Button>
          )}
          {hasPromptsWithoutImages && (
            <Button onClick={handleGenerateAllImages} size="sm" className="gap-2" disabled={generatingAll}>
              <ImagePlus className="w-3.5 h-3.5" />
              {generatingAll ? `Generating Images (${allProgress.done}/${allProgress.total})` : 'Generate All Images'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shots.map((shot) => {
          const storyboard = storyboards.find(sb => sb.shot_id === shot.id)
          const isGeneratingImage = storyboard && generatingImages.has(storyboard.id)
          return (
            <div key={shot.id} className="panel overflow-hidden">
              {/* Image area */}
              <div className="aspect-video bg-surface relative">
                {storyboard?.image_url ? (
                  <img
                    src={storyboard.image_url}
                    alt={`Shot ${shot.shot_number} storyboard`}
                    className="w-full h-full object-cover"
                  />
                ) : storyboard?.status === 'generating' || isGeneratingImage ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-accent animate-spin" />
                    <span className="text-2xs text-text-tertiary">Generating image...</span>
                  </div>
                ) : storyboard?.status === 'failed' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <span className="text-2xs text-status-error">Generation failed</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGenerateImage(storyboard.id)}
                      className="gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </Button>
                  </div>
                ) : storyboard ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <ImagePlus className="w-6 h-6 text-text-tertiary" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGenerateImage(storyboard.id)}
                      className="gap-1.5"
                    >
                      <Sparkles className="w-3 h-3" />
                      Generate Image
                    </Button>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <Image className="w-6 h-6 text-text-tertiary" />
                    <span className="text-2xs text-text-tertiary">No prompt yet</span>
                  </div>
                )}
              </div>

              {/* Shot info */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-accent/10 flex items-center justify-center">
                      <span className="text-2xs font-bold text-accent">{shot.shot_number}</span>
                    </div>
                    <Badge>{shot.shot_type}</Badge>
                  </div>
                  {storyboard ? (
                    storyboard.image_url ? (
                      <Badge variant="success">Complete</Badge>
                    ) : (
                      <Badge variant="accent">Prompt Ready</Badge>
                    )
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGeneratePrompt(shot.id)}
                      loading={generatingPrompt === shot.id}
                    >
                      <Sparkles className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                <p className="text-xs text-text-secondary line-clamp-2">{shot.description}</p>

                {storyboard && (
                  <div className="pt-2 border-t border-surface-border">
                    <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-1">Image Prompt</p>
                    <p className="text-xs text-text-primary leading-relaxed line-clamp-3">{storyboard.image_prompt}</p>
                    {storyboard.style_reference && (
                      <p className="text-2xs text-accent mt-1">{storyboard.style_reference}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
