'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Character, PhysicalTraits } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Plus,
  X,
  Pencil,
  Trash2,
  Wand2,
  Upload,
  Check,
  Loader2,
  ImageIcon,
} from 'lucide-react'

interface CharactersViewProps {
  projectId: string
  initialCharacters: Character[]
}

interface CharacterForm {
  name: string
  description: string
  wardrobe: string
  hair_color: string
  hair_style: string
  eye_color: string
  skin_tone: string
  age_range: string
  build: string
  height: string
  facial_hair: string
  distinguishing_features: string
  era: string
  archetype: string
}

const emptyForm: CharacterForm = {
  name: '',
  description: '',
  wardrobe: '',
  hair_color: '',
  hair_style: '',
  eye_color: '',
  skin_tone: '',
  age_range: '',
  build: '',
  height: '',
  facial_hair: '',
  distinguishing_features: '',
  era: '',
  archetype: '',
}

function formToPayload(form: CharacterForm) {
  const physical_traits: PhysicalTraits = {}
  if (form.hair_color) physical_traits.hair_color = form.hair_color
  if (form.hair_style) physical_traits.hair_style = form.hair_style
  if (form.eye_color) physical_traits.eye_color = form.eye_color
  if (form.skin_tone) physical_traits.skin_tone = form.skin_tone
  if (form.age_range) physical_traits.age_range = form.age_range
  if (form.build) physical_traits.build = form.build
  if (form.height) physical_traits.height = form.height
  if (form.facial_hair) physical_traits.facial_hair = form.facial_hair
  if (form.distinguishing_features) physical_traits.distinguishing_features = form.distinguishing_features
  if (form.era) physical_traits.era = form.era
  if (form.archetype) physical_traits.archetype = form.archetype
  return {
    name: form.name,
    description: form.description || null,
    wardrobe: form.wardrobe || null,
    physical_traits,
  }
}

function characterToForm(c: Character): CharacterForm {
  const t = c.physical_traits || {}
  return {
    name: c.name,
    description: c.description || '',
    wardrobe: c.wardrobe || '',
    hair_color: t.hair_color || '',
    hair_style: t.hair_style || '',
    eye_color: t.eye_color || '',
    skin_tone: t.skin_tone || '',
    age_range: t.age_range || '',
    build: t.build || '',
    height: t.height || '',
    facial_hair: t.facial_hair || '',
    distinguishing_features: t.distinguishing_features || '',
    era: t.era || '',
    archetype: t.archetype || '',
  }
}

interface PortraitOption {
  url: string
  seed: number
}

export function CharactersView({ projectId, initialCharacters }: CharactersViewProps) {
  const router = useRouter()
  const [characters, setCharacters] = useState<Character[]>(initialCharacters)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CharacterForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Portrait generation state
  const [portraitCharId, setPortraitCharId] = useState<string | null>(null)
  const [portraits, setPortraits] = useState<PortraitOption[]>([])
  const [generatingPortraits, setGeneratingPortraits] = useState(false)
  const [acceptingPortrait, setAcceptingPortrait] = useState(false)

  function openAdd() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
    setError(null)
  }

  function openEdit(character: Character) {
    setForm(characterToForm(character))
    setEditingId(character.id)
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
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = formToPayload(form)
      if (editingId) {
        const res = await fetch('/api/characters', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, projectId, ...payload }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setCharacters((prev) => prev.map((c) => (c.id === editingId ? data.character : c)))
      } else {
        const res = await fetch('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, ...payload }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setCharacters((prev) => [...prev, data.character])
      }
      closeForm()
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this character?')) return
    try {
      const res = await fetch(`/api/characters?id=${id}&projectId=${projectId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setCharacters((prev) => prev.filter((c) => c.id !== id))
      router.refresh()
    } catch {
      setError('Failed to delete character')
    }
  }

  // Portrait generation
  async function generatePortraits(character: Character) {
    setPortraitCharId(character.id)
    setPortraits([])
    setGeneratingPortraits(true)
    try {
      const res = await fetch('/api/ai/generate-character-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          characterId: character.id,
          physical_traits: character.physical_traits,
          name: character.name,
          wardrobe: character.wardrobe,
          count: 4,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPortraits(data.portraits)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Portrait generation failed')
    } finally {
      setGeneratingPortraits(false)
    }
  }

  async function acceptPortrait(portrait: PortraitOption) {
    if (!portraitCharId) return
    setAcceptingPortrait(true)
    try {
      const res = await fetch('/api/ai/generate-character-portrait', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          characterId: portraitCharId,
          imageUrl: portrait.url,
          seed: portrait.seed,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCharacters((prev) => prev.map((c) => (c.id === portraitCharId ? data.character : c)))
      setPortraitCharId(null)
      setPortraits([])
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save portrait')
    } finally {
      setAcceptingPortrait(false)
    }
  }

  function closePortraitPicker() {
    setPortraitCharId(null)
    setPortraits([])
    setGeneratingPortraits(false)
  }

  const updateField = (field: keyof CharacterForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-display font-semibold text-text-primary">Characters</h2>
          <Badge>{characters.length}</Badge>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus className="w-4 h-4" />
          Add Character
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-status-error/10 border border-status-error/20 text-sm text-status-error">
          {error}
        </div>
      )}

      {/* Portrait Picker Modal */}
      {portraitCharId && (
        <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-text-primary">
              {generatingPortraits ? 'Generating portraits...' : 'Choose a reference portrait'}
            </h3>
            <button onClick={closePortraitPicker} className="text-text-tertiary hover:text-text-primary">
              <X className="w-5 h-5" />
            </button>
          </div>
          {generatingPortraits ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <span className="ml-3 text-sm text-text-secondary">Generating 4 portrait options...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {portraits.map((p, i) => (
                <div key={i} className="relative group">
                  <img
                    src={p.url}
                    alt={`Portrait option ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-xl border border-surface-border"
                  />
                  <button
                    onClick={() => acceptPortrait(p)}
                    disabled={acceptingPortrait}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                  >
                    {acceptingPortrait ? (
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    ) : (
                      <div className="flex items-center gap-2 text-white text-sm font-medium">
                        <Check className="w-5 h-5" />
                        Use This
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-text-primary">
              {editingId ? 'Edit Character' : 'New Character'}
            </h3>
            <button onClick={closeForm} className="text-text-tertiary hover:text-text-primary">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Name"
              placeholder="e.g. Sarah Chen"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
            <Input
              label="Age Range"
              placeholder="e.g. late 20s, middle-aged"
              value={form.age_range}
              onChange={(e) => updateField('age_range', e.target.value)}
            />
            <Input
              label="Era / Year"
              placeholder="e.g. 1920s, Victorian, modern"
              value={form.era}
              onChange={(e) => updateField('era', e.target.value)}
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Brief character description..."
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="min-h-[80px]"
          />

          <Input
            label="Archetype / Vibe"
            placeholder='e.g. rugged 1970s leading man, ethereal indie film heroine, sharp-eyed noir detective'
            value={form.archetype}
            onChange={(e) => updateField('archetype', e.target.value)}
          />

          {/* Physical Traits Grid */}
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
              Physical Traits
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Input
                placeholder="Hair color"
                value={form.hair_color}
                onChange={(e) => updateField('hair_color', e.target.value)}
              />
              <Input
                placeholder="Hair style"
                value={form.hair_style}
                onChange={(e) => updateField('hair_style', e.target.value)}
              />
              <Input
                placeholder="Eye color"
                value={form.eye_color}
                onChange={(e) => updateField('eye_color', e.target.value)}
              />
              <Input
                placeholder="Skin tone"
                value={form.skin_tone}
                onChange={(e) => updateField('skin_tone', e.target.value)}
              />
              <Input
                placeholder="Build (e.g. athletic, slim)"
                value={form.build}
                onChange={(e) => updateField('build', e.target.value)}
              />
              <Input
                placeholder="Height (e.g. tall, average)"
                value={form.height}
                onChange={(e) => updateField('height', e.target.value)}
              />
              <Input
                placeholder="Facial hair"
                value={form.facial_hair}
                onChange={(e) => updateField('facial_hair', e.target.value)}
              />
              <Input
                placeholder="Distinguishing features"
                value={form.distinguishing_features}
                onChange={(e) => updateField('distinguishing_features', e.target.value)}
                className="col-span-2"
              />
            </div>
          </div>

          <Textarea
            label="Wardrobe"
            placeholder="Typical clothing/costume description..."
            value={form.wardrobe}
            onChange={(e) => updateField('wardrobe', e.target.value)}
            className="min-h-[60px]"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={closeForm}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingId ? 'Save Changes' : 'Create Character'}
            </Button>
          </div>
        </div>
      )}

      {/* Character List */}
      {characters.length === 0 && !showForm ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <p className="text-text-secondary mb-2">No characters yet</p>
          <p className="text-sm text-text-tertiary mb-6">
            Add characters with physical descriptions to maintain visual consistency across your storyboard.
          </p>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" />
            Add Your First Character
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onEdit={() => openEdit(character)}
              onDelete={() => handleDelete(character.id)}
              onGeneratePortrait={() => generatePortraits(character)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Character Card Component
interface CharacterCardProps {
  character: Character
  onEdit: () => void
  onDelete: () => void
  onGeneratePortrait: () => void
}

function CharacterCard({ character, onEdit, onDelete, onGeneratePortrait }: CharacterCardProps) {
  const traits = character.physical_traits || {}
  const traitSummary = [
    traits.age_range,
    traits.hair_color && traits.hair_style
      ? `${traits.hair_color} ${traits.hair_style} hair`
      : traits.hair_color
        ? `${traits.hair_color} hair`
        : traits.hair_style
          ? `${traits.hair_style} hair`
          : null,
    traits.eye_color ? `${traits.eye_color} eyes` : null,
    traits.build,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="rounded-2xl bg-surface border border-surface-border overflow-hidden group hover:border-accent/30 transition-colors">
      {/* Reference Image */}
      <div className="aspect-square bg-canvas-subtle relative">
        {character.reference_image_url ? (
          <img
            src={character.reference_image_url}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-text-tertiary">
            <ImageIcon className="w-10 h-10 mb-2" />
            <span className="text-xs">No reference image</span>
          </div>
        )}
        {/* Overlay actions */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-status-error transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-text-primary truncate">{character.name}</h4>
          {character.reference_source && (
            <Badge variant="accent" className="text-[10px]">
              {character.reference_source}
            </Badge>
          )}
        </div>
        {traitSummary && (
          <p className="text-xs text-text-secondary line-clamp-2">{traitSummary}</p>
        )}
        {character.description && (
          <p className="text-xs text-text-tertiary line-clamp-2">{character.description}</p>
        )}

        {/* Generate Portrait Button */}
        <button
          onClick={onGeneratePortrait}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-accent bg-accent/5 hover:bg-accent/10 border border-accent/20 transition-colors"
        >
          <Wand2 className="w-3.5 h-3.5" />
          {character.reference_image_url ? 'Regenerate Portrait' : 'Generate Portrait'}
        </button>
      </div>
    </div>
  )
}
