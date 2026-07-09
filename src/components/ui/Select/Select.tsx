import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/helpers/cn'
import type { SelectOption } from '@/types/common.types'

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[]
  size?: 'sm' | 'md' | 'lg'
  error?: string
  hint?: string
  label?: string
  required?: boolean
  placeholder?: string
  fullWidth?: boolean
}

const sizeClasses = {
  sm: 'h-8  text-sm  pl-3 pr-9',
  md: 'h-10 text-sm  pl-4 pr-9',
  lg: 'h-12 text-base pl-4 pr-9',
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      size = 'md',
      error,
      hint,
      label,
      required,
      placeholder,
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
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-neutral-300 select-none">
            {label}
            {required && <span className="ml-1 text-gold-500" aria-hidden>*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            aria-invalid={hasError}
            className={cn(
              'w-full appearance-none rounded-xl bg-obsidian-900 text-white',
              'border transition-all duration-200 cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500',
              !hasError && 'border-neutral-700 hover:border-neutral-500',
              hasError && 'border-danger-500 focus:ring-danger-500/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              sizeClasses[size],
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={String(opt.value)}
                value={String(opt.value)}
                disabled={opt.disabled}
                className="bg-obsidian-900 text-white"
              >
                {opt.label}
              </option>
            ))}
          </select>

          {/* Ícono de chevron */}
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none"
            aria-hidden
          />
        </div>

        {hasError && <p role="alert" className="text-xs text-danger-400">{error}</p>}
        {!hasError && hint && <p className="text-xs text-neutral-500">{hint}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
