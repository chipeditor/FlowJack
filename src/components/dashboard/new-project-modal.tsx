'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScriptDropZone } from './script-drop-zone'
import { X, Sparkles, FileUp } from 'lucide-react'

const GENRES = ['Drama', 'Thriller', 'Sci-Fi', 'Horror', 'Comedy', 'Romance', 'Action', 'Documentary', 'Experimental']
const TONES = ['Dark', 'Uplifting', 'Melancholic', 'Tense', 'Whimsical', 'Gritty', 'Ethereal', 'Intimate']
const DURATIONS = [
  { value: 'short', label: '1-5 min' },
  { value: 'medium', label: '5-15 min' },
  { value: 'standard', label: '15-45 min' },
  { value: 'feature', label: '45-120 min' },
]

interface NewProjectModalProps {
  onClose: () => void
}

type Mode = 'idea' | 'import'

export function NewProjectModal({ onClose }: NewProjectModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<Mode>('idea')
  const [title, setTitle] = useState('')
  const [idea, setIdea] = useState('')
  const [genre, setGenre] = useState('')
  const [tone, setTone] = useState('')
  const [duration, setDuration] = useState('short')

  // Import mode state
  const [scriptContent, setScriptContent] = useState('')
  const [scriptWordCount, setScriptWordCount] = useState(0)
  const [scriptFormat, setScriptFormat] = useState('')
  const [logline, setLogline] = useState('')

  function handleScriptReady(content: string, wordCount: number, format: string) {
    setScriptContent(content)
    setScriptWordCount(wordCount)
    setScriptFormat(format)
  }

  function handleScriptClear() {
    setScriptContent('')
    setScriptWordCount(0)
    setScriptFormat('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    if (mode === 'idea') {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: title || 'Untitled Project',
          idea_input: idea,
          genre: genre || null,
          tone: tone || null,
          duration_target: duration,
          status: 'draft',
        })
        .select()
        .single()

      if (error) { setLoading(false); return }
      router.push(`/project/${data.id}`)
    } else {
      const { data: project, error: projError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: title || 'Untitled Project',
          logline: logline || null,
          genre: genre || null,
          tone: tone || null,
          duration_target: duration,
          status: 'in_progress',
          metadata: { source: 'imported' },
        })
        .select()
        .single()

      if (projError || !project) { setLoading(false); return }

      const estimatedRuntime = Math.round(scriptWordCount / 150) * 60
      await supabase.from('scripts').insert({
        project_id: project.id,
        version: 1,
        title: title || null,
        content: scriptContent,
        format: scriptFormat,
        word_count: scriptWordCount,
        estimated_runtime_seconds: estimatedRuntime,
        is_active: true,
      })

      if (!logline) {
        fetch('/api/ai/generate-logline-from-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: project.id }),
        }).catch(() => {})
      }

      router.push(`/project/${project.id}/screenplay`)
    }
  }

  const canSubmit = mode === 'idea' ? idea.trim().length > 0 : scriptContent.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg glass-elevated rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-semibold text-text-primary">New Production</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-surface rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('idea')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              mode === 'idea' ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Start from Idea
          </button>
          <button
            type="button"
            onClick={() => setMode('import')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              mode === 'import' ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <FileUp className="w-3.5 h-3.5" />
            Import Screenplay
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-5">
          <Input
            label="Project Title"
            placeholder="My Short Film"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {mode === 'idea' ? (
            <Textarea
              label="Your Idea"
              placeholder="Describe your movie idea in a few sentences. What's the story? Who are the characters? What's the feeling you want to create?"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="min-h-[140px]"
              required
            />
          ) : (
            <>
              <ScriptDropZone
                onContentReady={handleScriptReady}
                onClear={handleScriptClear}
                hasContent={scriptContent.length > 0}
                wordCount={scriptWordCount}
                format={scriptFormat}
              />
              <Textarea
                label="Logline (optional)"
                placeholder="Leave blank and we'll generate one from your script"
                value={logline}
                onChange={(e) => setLogline(e.target.value)}
                className="min-h-[60px]"
              />
            </>
          )}

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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={!canSubmit} className="flex-1 gap-2">
              {mode === 'idea' ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create Project
                </>
              ) : (
                <>
                  <FileUp className="w-4 h-4" />
                  Import & Create
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
