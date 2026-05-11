import { cn } from '@/lib/utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-medium uppercase tracking-wider',
        {
          'bg-surface text-text-secondary': variant === 'default',
          'bg-status-success/10 text-status-success': variant === 'success',
          'bg-status-warning/10 text-status-warning': variant === 'warning',
          'bg-status-error/10 text-status-error': variant === 'error',
          'bg-accent/10 text-accent': variant === 'accent',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
