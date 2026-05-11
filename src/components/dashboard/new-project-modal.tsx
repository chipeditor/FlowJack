'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X, Sparkles } from 'lucide-react'

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

export function NewProjectModal({ onClose }: NewProjectModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [idea, setIdea] = useState('')
  const [genre, setGenre] = useState('')
  const [tone, setTone] = useState('')
  const [duration, setDuration] = useState('short')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

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

    if (error) {
      setLoading(false)
      return
    }

    router.push(`/project/${data.id}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg glass-elevated rounded-2xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-semibold text-text-primary">New Production</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-5">
          <Input
            label="Project Title"
            placeholder="My Short Film"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            label="Your Idea"
            placeholder="Describe your movie idea in a few sentences. What's the story? Who are the characters? What's the feeling you want to create?"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className="min-h-[140px]"
            required
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
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
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
            <Button type="submit" loading={loading} className="flex-1 gap-2">
              <Sparkles className="w-4 h-4" />
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
