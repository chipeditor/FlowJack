'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { Project } from '@/lib/types'
import {
  ArrowLeft,
  FileText,
  Layers,
  Camera,
  Image,
  ClipboardList,
  Settings,
  Clapperboard,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const getProjectNav = (projectId: string) => [
  { name: 'Overview', href: `/project/${projectId}`, icon: Clapperboard },
  { name: 'Screenplay', href: `/project/${projectId}/screenplay`, icon: FileText },
  { name: 'Scenes', href: `/project/${projectId}/scenes`, icon: Layers },
  { name: 'Shot List', href: `/project/${projectId}/shots`, icon: Camera },
  { name: 'Storyboard', href: `/project/${projectId}/storyboard`, icon: Image },
  { name: 'Production Plan', href: `/project/${projectId}/production-plan`, icon: ClipboardList },
  { name: 'Settings', href: `/project/${projectId}/settings`, icon: Settings },
]

interface ProjectSidebarProps {
  project: Project
}

export function ProjectSidebar({ project }: ProjectSidebarProps) {
  const pathname = usePathname()
  const nav = getProjectNav(project.id)

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-canvas-subtle border-r border-surface-border flex flex-col z-40">
      <div className="p-4 border-b border-surface-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs text-text-tertiary hover:text-text-secondary transition-colors mb-3"
        >
          <ArrowLeft className="w-3 h-3" />
          All Projects
        </Link>
        <h2 className="font-display font-semibold text-text-primary truncate">{project.title}</h2>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge>{project.status}</Badge>
          {project.genre && <Badge variant="accent">{project.genre}</Badge>}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => {
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
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
