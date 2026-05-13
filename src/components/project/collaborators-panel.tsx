'use client'

import { useState, useEffect } from 'react'
import { ProjectMember, ProjectInvite, ProjectRole, ModuleSlug } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  UserPlus,
  Trash2,
  Mail,
  Clock,
  Copy,
  Check,
  Crown,
} from 'lucide-react'

interface CollaboratorsPanelProps {
  projectId: string
  isOwner: boolean
}

const ROLE_OPTIONS: { value: Exclude<ProjectRole, 'owner'>; label: string; desc: string }[] = [
  { value: 'editor', label: 'Editor', desc: 'Full creative + production editing. No financials.' },
  { value: 'contributor', label: 'Contributor', desc: 'Edit only assigned modules.' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access.' },
]

const MODULE_OPTIONS: { value: ModuleSlug; label: string }[] = [
  { value: 'screenplay', label: 'Screenplay' },
  { value: 'creative_brief', label: 'Creative Brief' },
  { value: 'shoot_plan', label: 'Production Plan' },
  { value: 'crew', label: 'Cast & Crew' },
  { value: 'call_sheets', label: 'Call Sheets' },
]

export function CollaboratorsPanel({ projectId, isOwner }: CollaboratorsPanelProps) {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [invites, setInvites] = useState<ProjectInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Exclude<ProjectRole, 'owner'>>('viewer')
  const [permissions, setPermissions] = useState<ModuleSlug[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (!isOwner) return
    fetch(`/api/invites?projectId=${projectId}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          setMembers(data.members || [])
          setInvites(data.invites || [])
        }
      })
      .finally(() => setLoading(false))
  }, [projectId, isOwner])

  async function handleInvite() {
    if (!email.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          email: email.trim(),
          role,
          permissions: role === 'contributor' ? permissions : [],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send invite')
        return
      }
      setInvites(prev => [data.invite, ...prev])
      setEmail('')
      setPermissions([])
    } catch {
      setError('Network error')
    } finally {
      setSending(false)
    }
  }

  async function handleRemove(id: string, type: 'member' | 'invite') {
    const res = await fetch(`/api/invites?id=${id}&projectId=${projectId}&type=${type}`, { method: 'DELETE' })
    if (res.ok) {
      if (type === 'member') {
        setMembers(prev => prev.filter(m => m.id !== id))
      } else {
        setInvites(prev => prev.filter(i => i.id !== id))
      }
    }
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  function togglePermission(mod: ModuleSlug) {
    setPermissions(prev =>
      prev.includes(mod) ? prev.filter(p => p !== mod) : [...prev, mod]
    )
  }

  if (!isOwner) return null

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-display font-semibold text-text-primary flex items-center gap-2">
        <UserPlus className="w-5 h-5" />
        Collaborators
      </h2>

      {/* Invite form */}
      <div className="panel p-5 space-y-4">
        <p className="text-sm text-text-secondary">
          Invite people by email. They&apos;ll receive a link to join this project.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="colleague@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Exclude<ProjectRole, 'owner'>)}
            className="bg-surface text-text-primary text-xs rounded-lg px-3 py-2 border border-surface-border"
          >
            {ROLE_OPTIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <Button onClick={handleInvite} loading={sending} size="sm" className="gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            Invite
          </Button>
        </div>

        {role === 'contributor' && (
          <div className="space-y-1.5">
            <p className="text-2xs text-text-tertiary uppercase tracking-wider">Module Access</p>
            <div className="flex flex-wrap gap-2">
              {MODULE_OPTIONS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => togglePermission(m.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    permissions.includes(m.value)
                      ? 'bg-accent text-white'
                      : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-2xs text-text-tertiary">
          {ROLE_OPTIONS.find(r => r.value === role)?.desc}
        </p>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Current members */}
      {loading ? (
        <p className="text-xs text-text-tertiary">Loading collaborators...</p>
      ) : (
        <div className="space-y-2">
          {/* Owner row */}
          <div className="flex items-center gap-3 px-4 py-3 panel">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-text-primary flex-1">You</span>
            <Badge variant="accent">Owner</Badge>
          </div>

          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 panel">
              <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-2xs font-medium text-text-secondary">
                {(m.profile?.display_name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {m.profile?.display_name || 'User'}
                </p>
              </div>
              <Badge>{m.role}</Badge>
              <button
                onClick={() => handleRemove(m.id, 'member')}
                className="text-text-tertiary hover:text-status-error transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {invites.map(inv => (
            <div key={inv.id} className="flex items-center gap-3 px-4 py-3 panel opacity-60">
              <Clock className="w-4 h-4 text-text-tertiary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-secondary truncate">{inv.invited_email}</p>
              </div>
              <Badge>{inv.role}</Badge>
              <button
                onClick={() => copyInviteLink(inv.token)}
                className="text-text-tertiary hover:text-accent transition-colors cursor-pointer"
                title="Copy invite link"
              >
                {copied === inv.token ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => handleRemove(inv.id, 'invite')}
                className="text-text-tertiary hover:text-status-error transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {members.length === 0 && invites.length === 0 && (
            <p className="text-xs text-text-tertiary text-center py-4">
              No collaborators yet. Invite your team above.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
