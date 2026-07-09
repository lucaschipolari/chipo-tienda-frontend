import { AlertCircle, CheckCircle, Info, TriangleAlert, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/helpers/cn'
import type { ColorScheme } from '@/types/common.types'

export interface AlertProps {
  variant?: Extract<ColorScheme, 'success' | 'warning' | 'danger' | 'info' | 'default'>
  title?: string
  children: React.ReactNode
  dismissible?: boolean
  className?: string
  icon?: React.ReactNode
}

const variantClasses = {
  default: 'bg-obsidian-800 border-neutral-700 text-neutral-300',
  info:    'bg-info-500/10 border-info-500/30 text-info-300',
  success: 'bg-success-500/10 border-success-500/30 text-success-300',
  warning: 'bg-warning-500/10 border-warning-500/30 text-warning-300',
  danger:  'bg-danger-500/10 border-danger-500/30 text-danger-300',
}

const titleClasses = {
  default: 'text-neutral-200',
  info:    'text-info-200',
  success: 'text-success-200',
  warning: 'text-warning-200',
  danger:  'text-danger-200',
}

const icons = {
  default: <Info className="h-4 w-4 shrink-0 mt-0.5" />,
  info:    <Info className="h-4 w-4 shrink-0 mt-0.5" />,
  success: <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />,
  warning: <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" />,
  danger:  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />,
}

export function Alert({
  variant = 'default',
  title,
  children,
  dismissible = false,
  className,
  icon,
}: AlertProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 p-4 rounded-xl border text-sm',
        variantClasses[variant],
        className,
      )}
    >
      {/* Ícono */}
      <span aria-hidden>{icon ?? icons[variant]}</span>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn('font-semibold mb-1', titleClasses[variant])}>
            {title}
          </p>
        )}
        <div className="leading-relaxed">{children}</div>
      </div>

      {/* Botón de cerrar */}
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
          aria-label="Cerrar alerta"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
