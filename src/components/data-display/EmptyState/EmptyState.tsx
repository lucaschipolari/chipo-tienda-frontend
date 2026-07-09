import { PackageOpen } from 'lucide-react'
import { cn } from '@/utils/helpers/cn'
import { Button } from '@/components/ui/Button'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className,
      )}
    >
      {/* Ícono */}
      <div className="h-14 w-14 rounded-2xl bg-obsidian-800 border border-neutral-800 flex items-center justify-center mb-4 text-neutral-600">
        {icon ?? <PackageOpen className="h-6 w-6" />}
      </div>

      {/* Texto */}
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {/* Acción */}
      {action && (
        <Button
          variant="secondary"
          size="sm"
          onClick={action.onClick}
          className="mt-5"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

/**
 * EmptyState para errores de carga
 */
export function ErrorState({
  onRetry,
  message = 'No se pudo cargar la información.',
}: {
  onRetry?: () => void
  message?: string
}) {
  return (
    <EmptyState
      icon={
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-danger-500" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      }
      title="Algo salió mal"
      description={message}
      action={onRetry ? { label: 'Reintentar', onClick: onRetry } : undefined}
    />
  )
}
