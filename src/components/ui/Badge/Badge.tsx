import { cn } from '@/utils/helpers/cn'
import type { ColorScheme } from '@/types/common.types'

export interface BadgeProps {
  children: React.ReactNode
  variant?: ColorScheme | 'gold'
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}

const variants: Record<string, string> = {
  default: 'bg-obsidian-800 text-neutral-300 border border-neutral-700',
  gold:    'bg-gold-500/15 text-gold-400 border border-gold-500/30',
  primary: 'bg-gold-500/15 text-gold-400 border border-gold-500/30',
  success: 'bg-success-500/15 text-success-400 border border-success-500/30',
  warning: 'bg-warning-500/15 text-warning-400 border border-warning-500/30',
  danger:  'bg-danger-500/15 text-danger-400 border border-danger-500/30',
  info:    'bg-info-500/15 text-info-400 border border-info-500/30',
  secondary:'bg-obsidian-800 text-neutral-400 border border-neutral-700',
}

const dotColors: Record<string, string> = {
  default:  'bg-neutral-400',
  gold:     'bg-gold-500',
  primary:  'bg-gold-500',
  success:  'bg-success-500',
  warning:  'bg-warning-500',
  danger:   'bg-danger-500',
  info:     'bg-info-500',
  secondary:'bg-neutral-500',
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium leading-none',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        variants[variant] ?? variants.default,
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0',
            dotColors[variant] ?? dotColors.default,
          )}
          aria-hidden
        />
      )}
      {children}
    </span>
  )
}
