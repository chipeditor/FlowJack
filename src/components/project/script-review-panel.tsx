'use client'

import { useState } from 'react'
import { ScriptSuggestion } from '@/lib/ai/prompts/script-review'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  X,
  PenLine,
  MessageSquare,
  Clapperboard,
  Layers,
  Timer,
  User,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react'

interface ScriptReviewPanelProps {
  suggestions: ScriptSuggestion[]
  onApply: (accepted: ScriptSuggestion[]) => void
  onDismiss: () => void
  applying: boolean
}

const TYPE_CONFIG = {
  dialogue: { icon: MessageSquare, label: 'Dialogue', color: 'text-blue-400' },
  action: { icon: Clapperboard, label: 'Action', color: 'text-amber-400' },
  structure: { icon: Layers, label: 'Structure', color: 'text-purple-400' },
  pacing: { icon: Timer, label: 'Pacing', color: 'text-green-400' },
  character: { icon: User, label: 'Character', color: 'text-pink-400' },
}

const SEVERITY_CONFIG = {
  minor: { label: 'Minor', variant: 'default' as const },
  moderate: { label: 'Moderate', variant: 'accent' as const },
  significant: { label: 'Significant', variant: 'default' as const },
}

type Decision = 'accepted' | 'rejected' | 'edited' | null

export function ScriptReviewPanel({ suggestions, onApply, onDismiss, applying }: ScriptReviewPanelProps) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({})
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    () => Object.fromEntries(suggestions.map(s => [s.id, true]))
  )

  const decided = Object.values(decisions).filter(Boolean).length
  const accepted = Object.entries(decisions).filter(([, d]) => d === 'accepted' || d === 'edited').length

  function handleAccept(id: string) {
    setDecisions(d => ({ ...d, [id]: 'accepted' }))
  }

  function handleReject(id: string) {
    setDecisions(d => ({ ...d, [id]: 'rejected' }))
  }

  function handleEdit(id: string) {
    const suggestion = suggestions.find(s => s.id === id)
    if (!suggestion) return
    if (!edits[id]) setEdits(e => ({ ...e, [id]: suggestion.suggestedText }))
    setDecisions(d => ({ ...d, [id]: 'edited' }))
  }

  function handleApplyAll() {
    const result = suggestions
      .filter(s => decisions[s.id] === 'accepted' || decisions[s.id] === 'edited')
      .map(s => decisions[s.id] === 'edited' ? { ...s, suggestedText: edits[s.id] || s.suggestedText } : s)
    onApply(result)
  }

  function toggleExpand(id: string) {
    setExpanded(e => ({ ...e, [id]: !e[id] }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            AI Script Review
          </h3>
          <p className="text-2xs text-text-tertiary mt-0.5">
            {suggestions.length} suggestions · {decided} reviewed · {accepted} accepted
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss All
          </Button>
          <Button
            size="sm"
            onClick={handleApplyAll}
            loading={applying}
            disabled={accepted === 0}
            className="gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Apply {accepted} Change{accepted !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {suggestions.map((s) => {
          const decision = decisions[s.id]
          const isExpanded = expanded[s.id]
          const typeConf = TYPE_CONFIG[s.type]
          const sevConf = SEVERITY_CONFIG[s.severity]
          const TypeIcon = typeConf.icon

          return (
            <div
              key={s.id}
              className={`panel border transition-all ${
                decision === 'accepted' || decision === 'edited'
                  ? 'border-status-success/30 bg-status-success/5'
                  : decision === 'rejected'
                  ? 'border-surface-border/50 opacity-50'
                  : 'border-surface-border'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleExpand(s.id)}
                className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer"
              >
                <TypeIcon className={`w-4 h-4 ${typeConf.color} shrink-0`} />
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-primary">{typeConf.label}</span>
                    <Badge variant={sevConf.variant}>{sevConf.label}</Badge>
                    <span className="text-2xs text-text-tertiary">Lines {s.lineStart}–{s.lineEnd}</span>
                  </div>
                  {!isExpanded && (
                    <p className="text-2xs text-text-tertiary mt-0.5 truncate">{s.rationale}</p>
                  )}
                </div>
                {decision === 'accepted' || decision === 'edited' ? (
                  <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
                ) : decision === 'rejected' ? (
                  <XCircle className="w-4 h-4 text-text-tertiary shrink-0" />
                ) : null}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-text-tertiary shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-tertiary shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-surface-border pt-3">
                  <p className="text-xs text-text-secondary italic">{s.rationale}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-1.5">Original</p>
                      <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3">
                        <pre className="text-xs text-text-primary whitespace-pre-wrap font-mono leading-relaxed">{s.originalText}</pre>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-1.5">
                        {decision === 'edited' ? 'Your Edit' : 'Suggested'}
                      </p>
                      {decision === 'edited' ? (
                        <Textarea
                          value={edits[s.id] || s.suggestedText}
                          onChange={(e) => setEdits(prev => ({ ...prev, [s.id]: e.target.value }))}
                          className="text-xs font-mono min-h-[80px]"
                        />
                      ) : (
                        <div className="bg-status-success/5 border border-status-success/15 rounded-lg p-3">
                          <pre className="text-xs text-text-primary whitespace-pre-wrap font-mono leading-relaxed">{s.suggestedText}</pre>
                        </div>
                      )}
                    </div>
                  </div>

                  {decision !== 'rejected' && (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant={decision === 'accepted' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => handleAccept(s.id)}
                        className="gap-1.5"
                      >
                        <Check className="w-3 h-3" />
                        Accept
                      </Button>
                      <Button
                        variant={decision === 'edited' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => handleEdit(s.id)}
                        className="gap-1.5"
                      >
                        <PenLine className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReject(s.id)}
                        className="gap-1.5 text-text-tertiary"
                      >
                        <X className="w-3 h-3" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {decision === 'rejected' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDecisions(d => ({ ...d, [s.id]: null }))}
                      className="text-2xs"
                    >
                      Undo reject
                    </Button>
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
