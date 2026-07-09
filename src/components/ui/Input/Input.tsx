import { forwardRef } from 'react'
import { cn } from '@/utils/helpers/cn'

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg'
  error?: string
  hint?: string
  label?: string
  required?: boolean
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
  fullWidth?: boolean
}

const sizeClasses = {
  sm: 'h-8  text-sm  px-3',
  md: 'h-10 text-sm  px-4',
  lg: 'h-12 text-base px-4',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      error,
      hint,
      label,
      required,
      leftElement,
      rightElement,
      fullWidth = true,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    const hasError = !!error

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-neutral-300 select-none"
          >
            {label}
            {required && (
              <span className="ml-1 text-gold-500" aria-hidden>*</span>
            )}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative flex items-center">
          {/* Elemento izquierdo (ícono, prefix) */}
          {leftElement && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none flex items-center">
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            className={cn(
              // Base
              'w-full rounded-xl bg-obsidian-900 text-white',
              'border transition-all duration-200',
              'placeholder:text-neutral-600',
              'focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500',
              // Estado normal
              !hasError && 'border-neutral-700 hover:border-neutral-500',
              // Estado error
              hasError && 'border-danger-500 focus:ring-danger-500/50 focus:border-danger-500',
              // Disabled
              'disabled:opacity-50 disabled:cursor-not-allowed',
              // Tamaño
              sizeClasses[size],
              // Padding para elementos laterales
              leftElement && 'pl-10',
              rightElement && 'pr-10',
              className,
            )}
            {...props}
          />

          {/* Elemento derecho (ícono, suffix, boton) */}
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {/* Mensaje de error */}
        {hasError && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-danger-400 flex items-center gap-1"
          >
            {error}
          </p>
        )}

        {/* Hint */}
        {!hasError && hint && (
          <p
            id={`${inputId}-hint`}
            className="text-xs text-neutral-500"
          >
            {hint}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
