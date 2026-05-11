'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShootPlan } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  ClipboardList,
  CalendarDays,
  Users,
  MapPin,
  Wrench,
  DollarSign,
} from 'lucide-react'

interface ShootPlanViewProps {
  projectId: string
  plan: ShootPlan | null
  hasScenes: boolean
  hasShots: boolean
}

export function ShootPlanView({ projectId, plan, hasScenes, hasShots }: ShootPlanViewProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/generate-shoot-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Generation failed (${res.status})`)
      }
    } catch {
      setError('Network error — could not reach the server')
    } finally {
      setGenerating(false)
    }
  }

  const canGenerate = hasScenes && hasShots

  if (!plan) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-semibold text-text-primary">Production Plan</h1>
        <div className="panel p-8 text-center">
          <ClipboardList className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
          {canGenerate ? (
            <>
              <h2 className="text-lg font-medium text-text-primary mb-2">Generate Production Plan</h2>
              <p className="text-xs text-text-tertiary mb-6">
                Create shoot schedule, call sheets, cast breakdown, location list, and equipment needs from your scenes and shots.
              </p>
              <Button onClick={handleGenerate} loading={generating} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Plan
              </Button>
              {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
            </>
          ) : (
            <>
              <h2 className="text-lg font-medium text-text-primary mb-2">Scenes & Shots Required</h2>
              <p className="text-xs text-text-tertiary">
                Generate a scene breakdown and shot list first to create a production plan.
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  const budgetLabel = { micro: 'Micro Budget', low: 'Low Budget', mid: 'Mid Budget' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-text-primary">Production Plan</h1>
        <div className="flex items-center gap-3">
          <Badge variant="accent">{plan.total_shoot_days} shoot day{plan.total_shoot_days !== 1 ? 's' : ''}</Badge>
          <Button variant="secondary" onClick={handleGenerate} loading={generating} size="sm" className="gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Budget Tier */}
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-accent" />
          <h2 className="font-medium text-text-primary text-sm">Budget Estimate</h2>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={plan.budget_tier === 'micro' ? 'default' : plan.budget_tier === 'low' ? 'accent' : 'accent'}>
            {budgetLabel[plan.budget_tier] || plan.budget_tier}
          </Badge>
        </div>
        {plan.budget_notes && (
          <p className="text-xs text-text-secondary mt-2 leading-relaxed">{plan.budget_notes}</p>
        )}
      </div>

      {/* Shoot Schedule */}
      {plan.shoot_schedule && plan.shoot_schedule.length > 0 && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-accent" />
            <h2 className="font-medium text-text-primary text-sm">Shoot Schedule</h2>
          </div>
          <div className="space-y-3">
            {plan.shoot_schedule.map((day, i) => (
              <div key={i} className="p-3 bg-canvas rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">Day {day.day_number}</span>
                  <span className="text-2xs text-text-tertiary">{day.estimated_hours}h estimated</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
                  <span>{day.interior_exterior}</span>
                  <span>·</span>
                  <span>{day.location}</span>
                  <span>·</span>
                  <span>{day.time_of_day}</span>
                </div>
                <p className="text-2xs text-text-tertiary">
                  Scenes: {day.scenes.join(', ')}
                </p>
                {day.notes && <p className="text-2xs text-text-tertiary mt-1 italic">{day.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call Sheets */}
      {plan.call_sheets && plan.call_sheets.length > 0 && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-accent" />
            <h2 className="font-medium text-text-primary text-sm">Call Sheets</h2>
          </div>
          <div className="space-y-3">
            {plan.call_sheets.map((sheet, i) => (
              <div key={i} className="p-3 bg-canvas rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">Day {sheet.day_number} — {sheet.location}</span>
                  <span className="text-2xs text-accent font-medium">Call: {sheet.call_time}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-0.5">Scenes</p>
                    <p className="text-text-secondary">{sheet.scenes.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-0.5">Cast</p>
                    <p className="text-text-secondary">{sheet.cast_needed.join(', ')}</p>
                  </div>
                </div>
                {sheet.equipment_notes && (
                  <p className="text-2xs text-text-tertiary mt-2">Equipment: {sheet.equipment_notes}</p>
                )}
                {sheet.notes && <p className="text-2xs text-text-tertiary mt-1 italic">{sheet.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cast Breakdown */}
      {plan.cast_breakdown && plan.cast_breakdown.length > 0 && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-accent" />
            <h2 className="font-medium text-text-primary text-sm">Cast Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-2xs text-text-tertiary uppercase tracking-wider border-b border-surface-border">
                  <th className="text-left py-2 pr-4">Character</th>
                  <th className="text-left py-2 pr-4">Scenes</th>
                  <th className="text-left py-2 pr-4">Shoot Days</th>
                  <th className="text-left py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {plan.cast_breakdown.map((entry, i) => (
                  <tr key={i} className="border-b border-surface-border/50">
                    <td className="py-2 pr-4 font-medium text-text-primary">{entry.character}</td>
                    <td className="py-2 pr-4 text-text-secondary">{entry.scene_count} ({entry.scenes.join(', ')})</td>
                    <td className="py-2 pr-4 text-text-secondary">{entry.shoot_days.join(', ')}</td>
                    <td className="py-2 text-text-tertiary">{entry.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Location List */}
      {plan.location_list && plan.location_list.length > 0 && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-accent" />
            <h2 className="font-medium text-text-primary text-sm">Locations</h2>
          </div>
          <div className="space-y-2">
            {plan.location_list.map((loc, i) => (
              <div key={i} className="flex items-start justify-between p-3 bg-canvas rounded-lg">
                <div>
                  <p className="text-sm font-medium text-text-primary">{loc.location}</p>
                  <p className="text-2xs text-text-secondary">
                    {loc.interior_exterior} · {loc.time_of_day.join(', ')} · {loc.scene_count} scene{loc.scene_count !== 1 ? 's' : ''}
                  </p>
                  {loc.notes && <p className="text-2xs text-text-tertiary mt-1 italic">{loc.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment List */}
      {plan.equipment_list && plan.equipment_list.length > 0 && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4 text-accent" />
            <h2 className="font-medium text-text-primary text-sm">Equipment</h2>
          </div>
          {(['camera', 'lighting', 'grip', 'special'] as const).map(category => {
            const items = plan.equipment_list.filter(e => e.category === category)
            if (items.length === 0) return null
            return (
              <div key={category} className="mb-3 last:mb-0">
                <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-1.5 capitalize">{category}</p>
                <div className="space-y-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary">{item.item}</span>
                      <span className="text-2xs text-text-tertiary">Scenes {item.scenes_needed.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Notes */}
      {plan.notes && (
        <div className="panel p-5">
          <h2 className="font-medium text-text-primary text-sm mb-2">Notes</h2>
          <p className="text-xs text-text-secondary leading-relaxed">{plan.notes}</p>
        </div>
      )}
    </div>
  )
}
