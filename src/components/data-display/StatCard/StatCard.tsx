import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/utils/helpers/cn'

export interface StatCardProps {
  label: string
  value: string | number
  delta?: number           // porcentaje de cambio vs período anterior
  deltaLabel?: string      // "vs ayer", "vs mes anterior"
  icon?: React.ReactNode
  className?: string
  gold?: boolean           // destacar con borde dorado
  loading?: boolean
}

export function StatCard({
  label,
  value,
  delta,
  deltaLabel = 'vs período anterior',
  icon,
  className,
  gold = false,
  loading = false,
}: StatCardProps) {
  const hasPositiveDelta = delta !== undefined && delta > 0
  const hasNegativeDelta = delta !== undefined && delta < 0
  const isNeutral = delta === 0

  if (loading) {
    return (
      <div className={cn('rounded-2xl bg-obsidian-900 border border-neutral-800 p-5', className)}>
        <div className="skeleton h-4 w-24 rounded mb-3" />
        <div className="skeleton h-8 w-32 rounded mb-2" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-2xl bg-obsidian-900 p-5',
        'border transition-all duration-250',
        gold
          ? 'border-gold-500/30 hover:border-gold-500/60 hover:shadow-gold'
          : 'border-neutral-800 hover:border-neutral-700',
        className,
      )}
    >
      {/* Top row: label + icon */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              'h-8 w-8 rounded-lg flex items-center justify-center',
              gold ? 'bg-gold-500/15 text-gold-400' : 'bg-obsidian-800 text-neutral-400',
            )}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Valor principal */}
      <p
        className={cn(
          'text-3xl font-bold leading-none mb-2',
          gold ? 'text-gold-gradient' : 'text-white',
        )}
      >
        {value}
      </p>

      {/* Delta */}
      {delta !== undefined && (
        <div className="flex items-center gap-1">
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              hasPositiveDelta && 'text-success-400',
              hasNegativeDelta && 'text-danger-400',
              isNeutral && 'text-neutral-500',
            )}
          >
            {hasPositiveDelta && <TrendingUp className="h-3 w-3" />}
            {hasNegativeDelta && <TrendingDown className="h-3 w-3" />}
            {isNeutral && <Minus className="h-3 w-3" />}
            {hasPositiveDelta && '+'}
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="text-xs text-neutral-600">{deltaLabel}</span>
        </div>
      )}
    </div>
  )
}
