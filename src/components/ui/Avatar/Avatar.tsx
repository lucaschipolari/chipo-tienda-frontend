import { cn } from '@/utils/helpers/cn'
import { getInitials } from '@/utils/formatters/text'

export interface AvatarProps {
  name?: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  gold?: boolean
}

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
  xl: 'h-14 w-14 text-lg',
}

export function Avatar({ name, src, size = 'md', className, gold = false }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Avatar'}
        className={cn('rounded-full object-cover shrink-0', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold shrink-0 select-none',
        gold
          ? 'bg-gold-500 text-black'
          : 'bg-obsidian-700 text-neutral-300 border border-neutral-700',
        sizes[size],
        className,
      )}
      aria-label={name}
    >
      {name ? getInitials(name) : '?'}
    </div>
  )
}
