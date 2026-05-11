'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CallSheet, ShootPlan, CastStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  CalendarDays,
  MapPin,
  Users,
  Camera,
  Phone,
  Clock,
  Sunrise,
  Sunset,
  UtensilsCrossed,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Pencil,
  Check,
} from 'lucide-react'

interface CallSheetViewProps {
  projectId: string
  shootPlan: ShootPlan
  callSheets: CallSheet[]
  keyContacts: { name: string; role: string; phone: string | null }[]
}

function EditableField({
  value,
  placeholder,
  onSave,
  className = '',
}: {
  value: string | null
  placeholder: string
  onSave: (val: string) => void
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const inputRef = useRef<HTMLInputElement>(null)

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onSave(draft); setEditing(false) }
            if (e.key === 'Escape') setEditing(false)
          }}
          onBlur={() => { onSave(draft); setEditing(false) }}
          className={`bg-surface border border-accent/30 rounded px-1.5 py-0.5 text-text-primary outline-none focus:ring-1 focus:ring-accent/50 ${className}`}
          autoFocus
        />
      </span>
    )
  }

  return (
    <span
      onClick={() => { setDraft(value || ''); setEditing(true) }}
      className={`cursor-pointer hover:bg-surface-hover rounded px-1 -mx-1 transition-colors group inline-flex items-center gap-1 ${className}`}
    >
      {value || <span className="text-text-tertiary italic">{placeholder}</span>}
      <Pencil className="w-2.5 h-2.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
    </span>
  )
}

function StatusBadge({ status }: { status: CastStatus | null }) {
  const styles: Record<string, string> = {
    S: 'bg-green-500/15 text-green-400 border-green-500/20',
    W: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    F: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    H: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  }
  const labels: Record<string, string> = { S: 'Start', W: 'Work', F: 'Finish', H: 'Hold' }

  if (!status) return <span className="text-2xs text-text-tertiary">—</span>
  return (
    <span className={`inline-flex px-1.5 py-0.5 text-2xs font-medium rounded border ${styles[status] || ''}`}>
      {labels[status] || status}
    </span>
  )
}

export function CallSheetView({ projectId, shootPlan, callSheets, keyContacts }: CallSheetViewProps) {
  const router = useRouter()
  const [activeDayNum, setActiveDayNum] = useState(
    callSheets.length > 0 ? callSheets[0].day_number : (shootPlan.shoot_schedule[0]?.day_number || 1)
  )
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sheets, setSheets] = useState<CallSheet[]>(callSheets)
  const printRef = useRef<HTMLDivElement>(null)

  const activeSheet = sheets.find((s) => s.day_number === activeDayNum) || null
  const totalDays = shootPlan.total_shoot_days

  async function handleGenerate(dayNumber: number) {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/generate-call-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, dayNumber }),
      })
      if (res.ok) {
        const { callSheet } = await res.json()
        setSheets((prev) => {
          const filtered = prev.filter((s) => s.day_number !== dayNumber)
          return [...filtered, callSheet].sort((a, b) => a.day_number - b.day_number)
        })
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

  async function updateField(field: string, value: unknown) {
    if (!activeSheet) return
    const res = await fetch('/api/call-sheets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: activeSheet.id, [field]: value }),
    })
    if (res.ok) {
      const { callSheet } = await res.json()
      setSheets((prev) => prev.map((s) => (s.id === callSheet.id ? callSheet : s)))
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Day Navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-text-primary">Call Sheets</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" size="icon"
            disabled={activeDayNum <= 1}
            onClick={() => setActiveDayNum(activeDayNum - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Badge variant="accent">Day {activeDayNum} of {totalDays}</Badge>
          <Button
            variant="ghost" size="icon"
            disabled={activeDayNum >= totalDays}
            onClick={() => setActiveDayNum(activeDayNum + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
          const hasSheet = sheets.some((s) => s.day_number === day)
          return (
            <button
              key={day}
              onClick={() => setActiveDayNum(day)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
                day === activeDayNum
                  ? 'bg-accent text-white'
                  : hasSheet
                    ? 'bg-surface text-text-primary hover:bg-surface-hover border border-surface-border'
                    : 'bg-surface/50 text-text-tertiary hover:bg-surface-hover border border-dashed border-surface-border'
              }`}
            >
              Day {day}
            </button>
          )
        })}
      </div>

      {error && <p className="text-xs text-red-400 bg-red-400/10 p-3 rounded-lg">{error}</p>}

      {!activeSheet ? (
        <div className="panel p-8 text-center">
          <CalendarDays className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
          <h2 className="text-lg font-medium text-text-primary mb-2">Generate Call Sheet</h2>
          <p className="text-xs text-text-tertiary mb-6">
            Create a detailed call sheet for Day {activeDayNum} from your production plan.
          </p>
          <Button onClick={() => handleGenerate(activeDayNum)} loading={generating} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Generate Day {activeDayNum}
          </Button>
        </div>
      ) : (
        <div ref={printRef} className="space-y-4 print:space-y-2">
          {/* HEADER BAR */}
          <div className="panel p-5 print:p-3 print:border-b-2 print:border-black">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-display font-semibold text-text-primary print:text-xl">
                  Day {activeSheet.day_number} of {totalDays}
                </h2>
                <EditableField
                  value={activeSheet.date}
                  placeholder="Set date..."
                  onSave={(v) => updateField('date', v)}
                  className="text-xs text-text-secondary"
                />
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-2xs text-text-tertiary uppercase tracking-wider">Crew Call</p>
                  <p className="text-lg font-semibold text-accent">{activeSheet.crew_call}</p>
                </div>
                {activeSheet.shooting_call && (
                  <div>
                    <p className="text-2xs text-text-tertiary uppercase tracking-wider">Shooting Call</p>
                    <p className="text-lg font-semibold text-text-primary">{activeSheet.shooting_call}</p>
                  </div>
                )}
                <div className="print:hidden flex gap-1.5">
                  <Button variant="secondary" size="sm" onClick={handlePrint} className="gap-1.5">
                    <FileDown className="w-3.5 h-3.5" />
                    PDF
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleGenerate(activeDayNum)} loading={generating} className="gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Regen
                  </Button>
                </div>
              </div>
            </div>

            {/* Key Contacts */}
            {keyContacts.length > 0 && (
              <div className="flex flex-wrap gap-4 pt-3 border-t border-surface-border">
                {keyContacts.map((c, i) => (
                  <div key={i} className="text-xs">
                    <span className="text-text-tertiary">{c.role}:</span>{' '}
                    <span className="text-text-primary font-medium">{c.name}</span>
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="ml-1.5 text-accent hover:underline print:no-underline">
                        {c.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCTION INFO */}
          <div className="panel p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sunrise className="w-3.5 h-3.5 text-text-tertiary" />
              <span className="text-text-tertiary">Sunrise:</span>
              <span className="text-text-secondary">{activeSheet.sunrise || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sunset className="w-3.5 h-3.5 text-text-tertiary" />
              <span className="text-text-tertiary">Sunset:</span>
              <span className="text-text-secondary">{activeSheet.sunset || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-3.5 h-3.5 text-text-tertiary" />
              <span className="text-text-tertiary">Breakfast:</span>
              <EditableField value={activeSheet.breakfast_time} placeholder="Set..." onSave={(v) => updateField('breakfast_time', v)} className="text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-3.5 h-3.5 text-text-tertiary" />
              <span className="text-text-tertiary">Lunch:</span>
              <EditableField value={activeSheet.lunch_time} placeholder="Set..." onSave={(v) => updateField('lunch_time', v)} className="text-xs" />
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <Building2 className="w-3.5 h-3.5 text-text-tertiary" />
              <span className="text-text-tertiary">Hospital:</span>
              <EditableField value={activeSheet.nearest_hospital} placeholder="Set nearest hospital..." onSave={(v) => updateField('nearest_hospital', v)} className="text-xs" />
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <Clock className="w-3.5 h-3.5 text-text-tertiary" />
              <span className="text-text-tertiary">Weather:</span>
              <EditableField value={activeSheet.weather_forecast} placeholder="Set forecast..." onSave={(v) => updateField('weather_forecast', v)} className="text-xs" />
            </div>
          </div>

          {/* LOCATIONS */}
          {activeSheet.locations && activeSheet.locations.length > 0 && (
            <div className="panel p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-accent" />
                <h3 className="font-medium text-text-primary text-sm">Locations</h3>
              </div>
              <div className="space-y-2">
                {activeSheet.locations.map((loc, i) => (
                  <div key={i} className="p-3 bg-canvas rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-text-primary">{loc.location_name}</span>
                        <span className="text-2xs text-text-tertiary ml-2">{loc.interior_exterior}</span>
                      </div>
                    </div>
                    <EditableField
                      value={loc.address}
                      placeholder="Add address..."
                      onSave={(v) => {
                        const locs = [...activeSheet.locations]
                        locs[i] = { ...locs[i], address: v }
                        updateField('locations', locs)
                      }}
                      className="text-2xs text-text-secondary"
                    />
                    {i < activeSheet.locations.length - 1 && (
                      <div className="mt-2 pt-2 border-t border-dashed border-surface-border">
                        <span className="text-2xs font-medium text-accent uppercase tracking-wider">Company Move</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCENE TABLE */}
          <div className="panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-accent" />
              <h3 className="font-medium text-text-primary text-sm">Scenes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-2xs text-text-tertiary uppercase tracking-wider border-b border-surface-border">
                    <th className="text-left py-2 pr-3">#</th>
                    <th className="text-left py-2 pr-3">I/E</th>
                    <th className="text-left py-2 pr-3">Set / Description</th>
                    <th className="text-left py-2 pr-3">D/N</th>
                    <th className="text-left py-2 pr-3">Pgs</th>
                    <th className="text-left py-2 pr-3">Shots</th>
                    <th className="text-left py-2 pr-3">Est.</th>
                    <th className="text-left py-2 pr-3">Cast</th>
                    <th className="text-left py-2">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeSheet.scenes || []).map((scene, i) => (
                    <tr key={i} className="border-b border-surface-border/50">
                      <td className="py-2 pr-3 font-medium text-text-primary">{scene.scene_number}</td>
                      <td className="py-2 pr-3 text-text-secondary">{scene.interior_exterior}</td>
                      <td className="py-2 pr-3 text-text-primary max-w-[200px] truncate">{scene.set_description}</td>
                      <td className="py-2 pr-3 text-text-secondary">{scene.time_of_day}</td>
                      <td className="py-2 pr-3 text-text-secondary">{scene.page_count || '—'}</td>
                      <td className="py-2 pr-3 text-text-secondary">{scene.shot_count}</td>
                      <td className="py-2 pr-3 text-text-secondary">{scene.estimated_duration_minutes ? `${scene.estimated_duration_minutes}m` : '—'}</td>
                      <td className="py-2 pr-3 text-text-secondary">{scene.characters?.join(', ')}</td>
                      <td className="py-2 text-text-tertiary">{scene.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CAST TABLE */}
          <div className="panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-accent" />
              <h3 className="font-medium text-text-primary text-sm">Cast</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-2xs text-text-tertiary uppercase tracking-wider border-b border-surface-border">
                    <th className="text-left py-2 pr-3">Character</th>
                    <th className="text-left py-2 pr-3">Actor</th>
                    <th className="text-left py-2 pr-3">Status</th>
                    <th className="text-left py-2 pr-3">Call</th>
                    <th className="text-left py-2 pr-3">MU/Ward</th>
                    <th className="text-left py-2 pr-3">On Set</th>
                    <th className="text-left py-2 pr-3">Scenes</th>
                    <th className="text-left py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeSheet.cast_list || []).map((entry, i) => (
                    <tr key={i} className="border-b border-surface-border/50">
                      <td className="py-2 pr-3 font-medium text-text-primary">{entry.character_name}</td>
                      <td className="py-2 pr-3 text-text-secondary">{entry.actor_name || <span className="italic text-text-tertiary">TBD</span>}</td>
                      <td className="py-2 pr-3"><StatusBadge status={entry.status} /></td>
                      <td className="py-2 pr-3 text-accent font-medium">{entry.call_time || '—'}</td>
                      <td className="py-2 pr-3 text-text-secondary">{entry.makeup_time || '—'}</td>
                      <td className="py-2 pr-3 text-text-secondary">{entry.on_set_time || '—'}</td>
                      <td className="py-2 pr-3 text-text-secondary">{entry.scenes_today?.join(', ')}</td>
                      <td className="py-2 text-text-tertiary">{entry.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DEPARTMENT NOTES */}
          {activeSheet.department_notes && activeSheet.department_notes.length > 0 && (
            <div className="panel p-4">
              <h3 className="font-medium text-text-primary text-sm mb-3">Department Notes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeSheet.department_notes.map((dn, i) => (
                  <div key={i} className="p-3 bg-canvas rounded-lg">
                    <p className="text-2xs text-accent font-medium uppercase tracking-wider mb-1">{dn.department}</p>
                    <p className="text-xs text-text-secondary leading-relaxed">{dn.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IMPORTANT NOTES */}
          <div className="panel p-4 bg-amber-500/5 border-amber-500/20">
            <h3 className="font-medium text-text-primary text-sm mb-2">Important Notes</h3>
            <EditableField
              value={activeSheet.important_notes}
              placeholder="Add safety notes, parking instructions, social media policy..."
              onSave={(v) => updateField('important_notes', v)}
              className="text-xs text-text-secondary"
            />
          </div>

          {/* ADVANCE SCHEDULE */}
          {activeSheet.advance_schedule_note && (
            <div className="panel p-4 opacity-80">
              <h3 className="font-medium text-text-primary text-sm mb-1">Tomorrow</h3>
              <p className="text-xs text-text-secondary">{activeSheet.advance_schedule_note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
