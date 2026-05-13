'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase-client'
import { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Save, Sparkles, AlertTriangle } from 'lucide-react'

const GENRES = ['Drama', 'Thriller', 'Sci-Fi', 'Horror', 'Comedy', 'Romance', 'Action', 'Documentary', 'Experimental']
const TONES = ['Dark', 'Uplifting', 'Melancholic', 'Tense', 'Whimsical', 'Gritty', 'Ethereal', 'Intimate']
const DURATIONS = [
  { value: 'short', label: '1-5 min' },
  { value: 'medium', label: '5-15 min' },
  { value: 'standard', label: '15-45 min' },
  { value: 'feature', label: '45-120 min' },
]

interface ProjectSettingsProps {
  project: Project
}

export function ProjectSettings({ project }: ProjectSettingsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(project.title)
  const [idea, setIdea] = useState(project.idea_input || '')
  const [genre, setGenre] = useState(project.genre || '')
  const [tone, setTone] = useState(project.tone || '')
  const [duration, setDuration] = useState(project.duration_target || 'short')
  const [aspectRatio, setAspectRatio] = useState(project.aspect_ratio || '16:9')

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)

    const { error: dbError } = await supabase
      .from('projects')
      .update({
        title,
        idea_input: idea,
        genre: genre || null,
        tone: tone || null,
        duration_target: duration,
        aspect_ratio: aspectRatio,
      })
      .eq('id', project.id)

    if (dbError) {
      setError('Failed to save settings')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }

    setSaving(false)
    router.refresh()
  }

  async function handleRegenerateAll() {
    setRegenerating(true)
    setError(null)

    try {
      // Save settings first
      await supabase
        .from('projects')
        .update({
          title,
          idea_input: idea,
          genre: genre || null,
          tone: tone || null,
          duration_target: duration,
          aspect_ratio: aspectRatio,
        })
        .eq('id', project.id)

      // Delete existing generated content
      await supabase.from('storyboards').delete().eq('project_id', project.id)
      await supabase.from('shots').delete().eq('project_id', project.id)
      await supabase.from('scenes').delete().eq('project_id', project.id)
      await supabase.from('scripts').delete().eq('project_id', project.id)
      await supabase.from('production_plans').delete().eq('project_id', project.id)

      // Regenerate logline
      const loglineRes = await fetch('/api/ai/generate-logline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, idea, genre, tone }),
      })

      if (!loglineRes.ok) {
        const data = await loglineRes.json().catch(() => ({}))
        throw new Error(data.error || 'Logline generation failed')
      }

      // Regenerate screenplay
      const screenplayRes = await fetch('/api/ai/generate-screenplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      })

      if (!screenplayRes.ok) {
        const data = await screenplayRes.json().catch(() => ({}))
        throw new Error(data.error || 'Screenplay generation failed')
      }

      router.refresh()
      router.push(`/project/${project.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Regeneration failed')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-display font-semibold text-text-primary">Project Settings</h1>

      <div className="space-y-5">
        <Input
          label="Project Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Textarea
          label="Original Idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          className="min-h-[120px]"
        />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Genre
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenre(genre === g ? '' : g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  genre === g
                    ? 'bg-accent text-white'
                    : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Tone
          </label>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(tone === t ? '' : t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tone === t
                    ? 'bg-accent text-white'
                    : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Target Duration
          </label>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDuration(d.value)}
                className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  duration === d.value
                    ? 'bg-accent text-white'
                    : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Aspect Ratio
          </label>
          <div className="flex gap-2">
            {['16:9', '9:16', '1:1', '4:3', '21:9'].map((ar) => (
              <button
                key={ar}
                type="button"
                onClick={() => setAspectRatio(ar)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  aspectRatio === ar
                    ? 'bg-accent text-white'
                    : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-status-error bg-status-error/10 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {saved && (
        <p className="text-xs text-status-success bg-status-success/10 px-3 py-2 rounded-lg">
          Settings saved
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} loading={saving} className="gap-2">
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
        <Button
          variant="secondary"
          onClick={handleRegenerateAll}
          loading={regenerating}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {regenerating ? 'Regenerating — this may take a minute...' : 'Save & Regenerate All'}
        </Button>
      </div>

      {regenerating && (
        <div className="panel p-4 border-accent/20">
          <div className="flex items-center gap-2 text-sm text-accent">
            <AlertTriangle className="w-4 h-4" />
            Regenerating will replace your existing logline, screenplay, scenes, shots, and storyboards.
          </div>
        </div>
      )}
    </div>
  )
}
