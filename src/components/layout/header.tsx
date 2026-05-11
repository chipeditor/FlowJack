'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase-client'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-16 border-b border-surface-border bg-canvas-subtle/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
      <div />
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
