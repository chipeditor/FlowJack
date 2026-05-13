'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CrewMember, CrewDepartment, CREW_DEPARTMENTS } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Plus,
  X,
  Phone,
  Mail,
  Star,
  Pencil,
  Trash2,
  UserPlus,
} from 'lucide-react'

interface CrewRosterViewProps {
  projectId: string
  initialMembers: CrewMember[]
  characters: string[]
}

interface MemberForm {
  name: string
  role: string
  department: CrewDepartment
  phone: string
  email: string
  is_cast: boolean
  character_name: string
  character_description: string
  is_key_contact: boolean
  daily_rate: string
  notes: string
}

const emptyForm: MemberForm = {
  name: '',
  role: '',
  department: 'production',
  phone: '',
  email: '',
  is_cast: false,
  character_name: '',
  character_description: '',
  is_key_contact: false,
  daily_rate: '',
  notes: '',
}

export function CrewRosterView({ projectId, initialMembers, characters }: CrewRosterViewProps) {
  const router = useRouter()
  const [members, setMembers] = useState<CrewMember[]>(initialMembers)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<MemberForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const castMembers = members.filter((m) => m.is_cast)
  const crewByDept = CREW_DEPARTMENTS.map((dept) => ({
    ...dept,
    members: members.filter((m) => !m.is_cast && m.department === dept.value),
  })).filter((dept) => dept.members.length > 0)

  const unassignedCharacters = characters.filter(
    (c) => !members.some((m) => m.character_name === c)
  )

  function openAdd(isCast: boolean) {
    setForm({ ...emptyForm, is_cast: isCast, department: isCast ? 'other' : 'production' })
    setEditingId(null)
    setShowForm(true)
    setError(null)
  }

  function openEdit(member: CrewMember) {
    setForm({
      name: member.name,
      role: member.role,
      department: member.department,
      phone: member.phone || '',
      email: member.email || '',
      is_cast: member.is_cast,
      character_name: member.character_name || '',
      character_description: member.character_description || '',
      is_key_contact: member.is_key_contact,
      daily_rate: member.daily_rate ? String(member.daily_rate) : '',
      notes: member.notes || '',
    })
    setEditingId(member.id)
    setShowForm(true)
    setError(null)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.role.trim()) {
      setError('Name and role are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        projectId,
        daily_rate: form.daily_rate ? Number(form.daily_rate) : null,
        phone: form.phone || null,
        email: form.email || null,
        character_name: form.character_name || null,
        character_description: form.character_description || null,
        notes: form.notes || null,
      }

      if (editingId) {
        const res = await fetch('/api/crew', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Update failed')
        const { member } = await res.json()
        setMembers((prev) => prev.map((m) => (m.id === editingId ? member : m)))
      } else {
        const res = await fetch('/api/crew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Create failed')
        const { member } = await res.json()
        setMembers((prev) => [...prev, member])
      }
      closeForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/crew?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== id))
    }
  }

  async function quickAddCast(character: string) {
    setSaving(true)
    try {
      const res = await fetch('/api/crew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: '',
          role: 'Actor',
          department: 'other',
          is_cast: true,
          character_name: character,
        }),
      })
      if (res.ok) {
        const { member } = await res.json()
        setMembers((prev) => [...prev, member])
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-text-primary">Cast & Crew</h1>
        <div className="flex items-center gap-2">
          <Badge>{members.length} member{members.length !== 1 ? 's' : ''}</Badge>
        </div>
      </div>

      {/* Cast Section */}
      <div className="panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-accent" />
            <h2 className="font-medium text-text-primary text-sm">Cast</h2>
            {castMembers.length > 0 && (
              <span className="text-2xs text-text-tertiary">({castMembers.length})</span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => openAdd(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add Cast
          </Button>
        </div>

        {/* Unassigned characters from screenplay */}
        {unassignedCharacters.length > 0 && (
          <div className="mb-4 p-3 bg-accent/5 rounded-lg">
            <p className="text-2xs text-text-tertiary mb-2">Characters from screenplay — click to add:</p>
            <div className="flex flex-wrap gap-1.5">
              {unassignedCharacters.map((char) => (
                <button
                  key={char}
                  onClick={() => quickAddCast(char)}
                  disabled={saving}
                  className="px-2.5 py-1 text-2xs bg-surface hover:bg-surface-hover border border-surface-border rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3 h-3 inline mr-1" />
                  {char}
                </button>
              ))}
            </div>
          </div>
        )}

        {castMembers.length === 0 && unassignedCharacters.length === 0 ? (
          <p className="text-xs text-text-tertiary text-center py-4">
            No cast members yet. Generate a screenplay and scene breakdown first to see characters.
          </p>
        ) : (
          <div className="space-y-2">
            {castMembers.map((member) => (
              <MemberRow key={member.id} member={member} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Crew Section */}
      <div className="panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            <h2 className="font-medium text-text-primary text-sm">Crew</h2>
            {members.filter((m) => !m.is_cast).length > 0 && (
              <span className="text-2xs text-text-tertiary">
                ({members.filter((m) => !m.is_cast).length})
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => openAdd(false)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add Crew
          </Button>
        </div>

        {crewByDept.length === 0 ? (
          <p className="text-xs text-text-tertiary text-center py-4">
            No crew members yet. Add your team to populate call sheets.
          </p>
        ) : (
          <div className="space-y-4">
            {crewByDept.map((dept) => (
              <div key={dept.value}>
                <p className="text-2xs text-text-tertiary uppercase tracking-wider mb-2">{dept.label}</p>
                <div className="space-y-2">
                  {dept.members.map((member) => (
                    <MemberRow key={member.id} member={member} onEdit={openEdit} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas-subtle rounded-2xl border border-surface-border w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h3 className="font-medium text-text-primary">
                {editingId ? 'Edit' : 'Add'} {form.is_cast ? 'Cast' : 'Crew'} Member
              </h3>
              <button onClick={closeForm} className="text-text-tertiary hover:text-text-primary cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <Input
                label="Name"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              {form.is_cast && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Character
                    </label>
                    <select
                      value={form.character_name}
                      onChange={(e) => setForm({ ...form, character_name: e.target.value })}
                      className="flex h-11 w-full rounded-xl bg-surface border border-surface-border px-4 text-sm text-text-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
                    >
                      <option value="">Select character...</option>
                      {characters.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__custom">Other (type below)</option>
                    </select>
                    {form.character_name === '__custom' && (
                      <Input
                        placeholder="Character name"
                        value=""
                        onChange={(e) => setForm({ ...form, character_name: e.target.value })}
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Appearance (for storyboard consistency)
                    </label>
                    <textarea
                      placeholder="e.g. young woman, mid-20s, auburn hair past shoulders, green eyes, light freckles, cream knit sweater"
                      value={form.character_description}
                      onChange={(e) => setForm({ ...form, character_description: e.target.value })}
                      rows={2}
                      className="flex w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-text-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 resize-none"
                    />
                    <p className="text-2xs text-text-tertiary">Physical details used to keep this character looking consistent across all storyboard frames.</p>
                  </div>
                </>
              )}

              <Input
                label="Role"
                placeholder={form.is_cast ? 'Lead / Supporting / Featured Extra' : 'Director of Photography'}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />

              {!form.is_cast && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Department
                  </label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value as CrewDepartment })}
                    className="flex h-11 w-full rounded-xl bg-surface border border-surface-border px-4 text-sm text-text-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
                  >
                    {CREW_DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <Input
                label="Daily Rate"
                type="number"
                placeholder="0"
                value={form.daily_rate}
                onChange={(e) => setForm({ ...form, daily_rate: e.target.value })}
              />

              <Input
                label="Notes"
                placeholder="Dietary needs, availability, etc."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_key_contact}
                  onChange={(e) => setForm({ ...form, is_key_contact: e.target.checked })}
                  className="rounded border-surface-border accent-accent"
                />
                <span className="text-xs text-text-secondary">Key contact (shown on call sheet header)</span>
              </label>

              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-border">
              <Button variant="secondary" size="sm" onClick={closeForm}>Cancel</Button>
              <Button size="sm" onClick={handleSave} loading={saving}>
                {editingId ? 'Update' : 'Add'} Member
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MemberRow({
  member,
  onEdit,
  onDelete,
}: {
  member: CrewMember
  onEdit: (m: CrewMember) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-canvas rounded-lg group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-surface border border-surface-border flex items-center justify-center flex-shrink-0">
          <span className="text-2xs font-medium text-text-tertiary">
            {member.name ? member.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary truncate">
              {member.name || <span className="italic text-text-tertiary">No name yet</span>}
            </span>
            {member.is_key_contact && (
              <Star className="w-3 h-3 text-accent flex-shrink-0" fill="currentColor" />
            )}
          </div>
          <div className="flex items-center gap-2 text-2xs text-text-tertiary">
            <span>{member.role}</span>
            {member.is_cast && member.character_name && (
              <>
                <span>·</span>
                <span className="text-accent">{member.character_name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {member.phone && (
          <a href={`tel:${member.phone}`} className="text-text-tertiary hover:text-text-primary transition-colors">
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
        {member.email && (
          <a href={`mailto:${member.email}`} className="text-text-tertiary hover:text-text-primary transition-colors">
            <Mail className="w-3.5 h-3.5" />
          </a>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(member)} className="p-1 text-text-tertiary hover:text-text-primary cursor-pointer">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(member.id)} className="p-1 text-text-tertiary hover:text-red-400 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
