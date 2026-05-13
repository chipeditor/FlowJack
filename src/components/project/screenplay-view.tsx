'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Project, Script } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  FileText,
  Clock,
  Hash,
  BookOpen,
  Lock,
  Unlock,
  PenLine,
  ArrowRight,
  History,
  CheckCircle2,
  Search,
} from 'lucide-react'
import { ScriptReviewPanel } from './script-review-panel'
import { ScriptSuggestion } from '@/lib/ai/prompts/script-review'

interface ScreenplayViewProps {
  project: Pick<Project, 'id' | 'title' | 'logline' | 'genre' | 'tone' | 'duration_target' | 'metadata'>
  script: Script | null
}

const DURATION_LABELS: Record<string, string> = {
  short: 'Short (1-5 min)',
  medium: 'Medium (5-15 min)',
  standard: 'Standard (15-45 min)',
  feature: 'Feature (45-120 min)',
}

export function ScreenplayView({ project, script }: ScreenplayViewProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [revising, setRevising] = useState(false)
  const [locking, setLocking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [showRevisionPanel, setShowRevisionPanel] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [applyingReview, setApplyingReview] = useState(false)
  const [suggestions, setSuggestions] = useState<ScriptSuggestion[] | null>(null)

  const isMultiPass = project.duration_target === 'standard' || project.duration_target === 'feature'
  const isLocked = !!(project.metadata as Record<string, unknown>)?.screenplay_locked

  useEffect(() => {
    if (!generating && !revising && !reviewing) {
      setElapsed(0)
      return
    }
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [generating, revising, reviewing])

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/generate-screenplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Generation failed (${res.status})`)
      }
    } catch (e) {
      setError('Request failed — check your network connection and API keys')
    } finally {
      setGenerating(false)
    }
  }

  async function handleRevise() {
    if (!revisionNotes.trim()) return
    setRevising(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/revise-screenplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, revisionNotes }),
      })
      if (res.ok) {
        setRevisionNotes('')
        setShowRevisionPanel(false)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Revision failed (${res.status})`)
      }
    } catch (e) {
      setError('Request failed — check your network connection and API keys')
    } finally {
      setRevising(false)
    }
  }

  async function handleLock() {
    setLocking(true)
    try {
      const res = await fetch('/api/projects/lock-screenplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLocking(false)
    }
  }

  async function handleReview() {
    setReviewing(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/review-screenplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Review failed')
        return
      }
      setSuggestions(data.suggestions)
    } catch {
      setError('Network error — could not reach the server')
    } finally {
      setReviewing(false)
    }
  }

  async function handleApplyReview(accepted: ScriptSuggestion[]) {
    setApplyingReview(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/apply-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, suggestions: accepted }),
      })
      if (res.ok) {
        setSuggestions(null)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to apply changes')
      }
    } catch {
      setError('Network error — could not reach the server')
    } finally {
      setApplyingReview(false)
    }
  }

  const estimatedPages = script?.word_count ? Math.round(script.word_count / 250) : null
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // ── No script yet ──
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
            <p className="text-xs text-text-tertiary mb-2">
              Target: {DURATION_LABELS[project.duration_target || 'short']}
            </p>
            {isMultiPass && (
              <p className="text-xs text-accent mb-4">
                Multi-pass generation — this will take a few minutes for feature-length
              </p>
            )}

            {generating ? (
              <GeneratingIndicator elapsed={elapsed} isMultiPass={isMultiPass} />
            ) : (
              <Button onClick={handleGenerate} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Screenplay
              </Button>
            )}

            {error && <ErrorMessage message={error} />}
          </div>
        )}
      </div>
    )
  }

  // ── Script exists ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-text-primary">Screenplay</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge>v{script.version}</Badge>
            {isLocked && (
              <Badge variant="success">
                <Lock className="w-2.5 h-2.5 mr-1" />
                Locked
              </Badge>
            )}
            {script.word_count && (
              <span className="flex items-center gap-1 text-xs text-text-tertiary">
                <Hash className="w-3 h-3" />
                {script.word_count.toLocaleString()} words
              </span>
            )}
            {estimatedPages && (
              <span className="flex items-center gap-1 text-xs text-text-tertiary">
                <BookOpen className="w-3 h-3" />
                ~{estimatedPages} pages
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
      </div>

      {/* Action bar — revision workflow */}
      {!isLocked ? (
        <div className="panel p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              Review the screenplay. Request revisions or lock it to proceed.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReview}
                loading={reviewing}
                disabled={!!suggestions}
                className="gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                {reviewing ? `Reviewing... ${formatTime(elapsed)}` : 'AI Review'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRevisionPanel(!showRevisionPanel)}
                className="gap-1.5"
              >
                <PenLine className="w-3.5 h-3.5" />
                Revise
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerate}
                loading={generating}
                className="gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Regenerate
              </Button>
              <Button
                size="sm"
                onClick={handleLock}
                loading={locking}
                className="gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                Lock &amp; Generate Scenes
              </Button>
            </div>
          </div>

          {/* Revision notes input */}
          {showRevisionPanel && (
            <div className="border-t border-surface-border pt-4 space-y-3">
              <Textarea
                label="Director's Notes"
                placeholder="Describe what you want changed. Examples:&#10;• Make the opening scene more tense&#10;• Add a scene where Sarah discovers the letter&#10;• Cut the bar scene — it slows the pacing&#10;• Make Michael more sympathetic in Act 2&#10;• The ending feels rushed — expand the final confrontation"
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                className="min-h-[120px]"
              />
              <div className="flex items-center justify-between">
                <p className="text-2xs text-text-tertiary">
                  Each revision creates a new version. You can revise as many times as needed.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { setShowRevisionPanel(false); setRevisionNotes('') }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRevise}
                    loading={revising}
                    disabled={!revisionNotes.trim()}
                    className="gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {revising ? `Revising... ${formatTime(elapsed)}` : 'Apply Revision'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {generating && (
            <div className="border-t border-surface-border pt-4">
              <GeneratingIndicator elapsed={elapsed} isMultiPass={isMultiPass} />
            </div>
          )}
        </div>
      ) : (
        <div className="panel p-4 border-status-success/20 bg-status-success/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              <p className="text-sm text-status-success font-medium">
                Screenplay locked — ready to generate scenes
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => router.push(`/project/${project.id}/scenes`)}
              className="gap-1.5"
            >
              Generate Scenes
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {/* AI Review panel */}
      {suggestions && suggestions.length > 0 && (
        <div className="panel p-5">
          <ScriptReviewPanel
            suggestions={suggestions}
            onApply={handleApplyReview}
            onDismiss={() => setSuggestions(null)}
            applying={applyingReview}
          />
        </div>
      )}

      {/* Screenplay content */}
      <div className="panel p-8">
        <pre className="font-mono text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
          {script.content}
        </pre>
      </div>
    </div>
  )
}

function GeneratingIndicator({ elapsed, isMultiPass }: { elapsed: number; isMultiPass: boolean }) {
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center justify-center gap-3">
        <svg className="animate-spin h-5 w-5 text-accent" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-text-primary">
          {isMultiPass ? 'Writing screenplay in multiple passes...' : 'Generating screenplay...'}
        </span>
      </div>
      <p className="text-xs text-text-tertiary text-center">
        Elapsed: {formatTime(elapsed)}
        {isMultiPass && ' — feature screenplays take 3-8 minutes'}
      </p>
      {isMultiPass && (
        <div className="max-w-xs mx-auto">
          <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(95, (elapsed / 360) * 100)}%` }}
            />
          </div>
          <p className="text-2xs text-text-tertiary text-center mt-1.5">
            {elapsed < 20 ? 'Building scene outline...' :
             elapsed < 40 ? 'Outline complete — writing scenes in batches...' :
             `Writing scene batches — please wait`}
          </p>
        </div>
      )}
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="text-xs text-status-error bg-status-error/10 px-3 py-2 rounded-lg">
      {message}
    </p>
  )
}
