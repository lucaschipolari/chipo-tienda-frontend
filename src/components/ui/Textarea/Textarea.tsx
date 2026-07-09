import { forwardRef } from 'react'
import { cn } from '@/utils/helpers/cn'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  hint?: string
  label?: string
  required?: boolean
  fullWidth?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, hint, label, required, fullWidth = true, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    const hasError = !!error

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-neutral-300 select-none">
            {label}
            {required && <span className="ml-1 text-gold-500" aria-hidden>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={hasError}
          rows={4}
          className={cn(
            'w-full rounded-xl bg-obsidian-900 text-white px-4 py-3',
            'border transition-all duration-200 resize-y',
            'placeholder:text-neutral-600 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500',
            !hasError && 'border-neutral-700 hover:border-neutral-500',
            hasError && 'border-danger-500 focus:ring-danger-500/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[80px]',
            className,
          )}
          {...props}
        />
        {hasError && (
          <p role="alert" className="text-xs text-danger-400">{error}</p>
        )}
        {!hasError && hint && (
          <p className="text-xs text-neutral-500">{hint}</p>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
