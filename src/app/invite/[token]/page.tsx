'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserPlus, X, CheckCircle2, AlertCircle } from 'lucide-react'

export default function InvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [invite, setInvite] = useState<{ role: string; email: string; projectTitle: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<'accepted' | 'declined' | null>(null)

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Invalid invite')
          return
        }
        setInvite(data.invite)
      })
      .catch(() => setError('Failed to load invite'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleAction(action: 'accept' | 'decline') {
    setActing(true)
    try {
      const res = await fetch(`/api/invites/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?redirect=/invite/${token}`)
          return
        }
        setError(data.error || 'Something went wrong')
        return
      }
      if (action === 'accept' && data.projectId) {
        setResult('accepted')
        setTimeout(() => router.push(`/project/${data.projectId}`), 1500)
      } else {
        setResult('declined')
        setTimeout(() => router.push('/dashboard'), 1500)
      }
    } catch {
      setError('Network error')
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md panel p-8 text-center space-y-6">
        {loading ? (
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-surface animate-pulse mx-auto" />
            <p className="text-sm text-text-secondary">Loading invite...</p>
          </div>
        ) : error ? (
          <div className="space-y-3">
            <AlertCircle className="w-10 h-10 text-status-error mx-auto" />
            <p className="text-sm text-text-primary font-medium">Invite Unavailable</p>
            <p className="text-xs text-text-tertiary">{error}</p>
            <Button onClick={() => router.push('/dashboard')} variant="secondary">
              Go to Dashboard
            </Button>
          </div>
        ) : result === 'accepted' ? (
          <div className="space-y-3">
            <CheckCircle2 className="w-10 h-10 text-status-success mx-auto" />
            <p className="text-sm text-text-primary font-medium">You&apos;re in!</p>
            <p className="text-xs text-text-tertiary">Redirecting to project...</p>
          </div>
        ) : result === 'declined' ? (
          <div className="space-y-3">
            <X className="w-10 h-10 text-text-tertiary mx-auto" />
            <p className="text-sm text-text-primary font-medium">Invite Declined</p>
            <p className="text-xs text-text-tertiary">Redirecting to dashboard...</p>
          </div>
        ) : invite ? (
          <>
            <UserPlus className="w-10 h-10 text-accent mx-auto" />
            <div>
              <p className="text-lg font-display font-semibold text-text-primary">
                You&apos;re invited to collaborate
              </p>
              <p className="text-sm text-text-secondary mt-2">
                on <span className="font-medium text-text-primary">{invite.projectTitle}</span>
              </p>
            </div>
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider">
              {invite.role}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => handleAction('decline')}
                loading={acting}
                className="flex-1"
              >
                Decline
              </Button>
              <Button
                onClick={() => handleAction('accept')}
                loading={acting}
                className="flex-1 gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Accept
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
