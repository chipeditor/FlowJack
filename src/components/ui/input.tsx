'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          className={cn(
            'flex h-11 w-full rounded-xl bg-surface border border-surface-border px-4 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-status-error/50 focus:ring-status-error/30',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-status-error">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
