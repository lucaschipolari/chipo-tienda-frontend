import { cn } from '@/utils/helpers/cn'

export interface CardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  goldBorder?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
  as?: React.ElementType
}

const paddingClasses = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
}

export function Card({
  children,
  className,
  hoverable = false,
  goldBorder = false,
  padding = 'md',
  onClick,
  as: Tag = 'div',
}: CardProps) {
  return (
    <Tag
      onClick={onClick}
      className={cn(
        // Base
        'rounded-2xl bg-obsidian-900',
        'border border-neutral-700',
        'transition-all duration-250',
        // Padding
        paddingClasses[padding],
        // Interactivo
        hoverable && [
          'cursor-pointer',
          'hover:border-neutral-500 hover:bg-obsidian-800',
          'hover:-translate-y-0.5 hover:shadow-lg',
        ],
        // Borde dorado (productos destacados, etc.)
        goldBorder && 'border-gold-500/40 hover:border-gold-500',
        // Click sin hover
        onClick && !hoverable && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

Card.Header = function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

Card.Title = function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h3 className={cn('font-semibold text-white text-base', className)}>
      {children}
    </h3>
  )
}

Card.Body = function CardBody({
  children,
  className,
  padding,
}: {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}) {
  const padMap = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' }
  return (
    <div className={cn(padding ? padMap[padding] : '', className)}>
      {children}
    </div>
  )
}

Card.Footer = function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mt-4 pt-4 border-t border-neutral-800 flex items-center gap-3',
        className,
      )}
    >
      {children}
    </div>
  )
}
