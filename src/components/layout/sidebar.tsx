'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  Film,
  LayoutDashboard,
  FolderOpen,
  Settings,
  Clapperboard,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderOpen },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-canvas-subtle border-r border-surface-border flex flex-col z-40">
      <div className="h-16 flex items-center px-6 border-b border-surface-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Clapperboard className="w-6 h-6 text-accent" />
          <span className="font-display text-lg font-semibold text-text-primary">
            FlowJack
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              )}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-surface-border">
        <div className="flex items-center gap-2 px-3 py-2 text-2xs text-text-tertiary">
          <Film className="w-3.5 h-3.5" />
          <span>FlowJack v0.1.0</span>
        </div>
      </div>
    </aside>
  )
}
