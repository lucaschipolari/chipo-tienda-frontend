import { cn } from '@/utils/helpers/cn'

/**
 * FormField — Wrapper semántico que encapsula label + control + error.
 * Diseñado para usarse con React Hook Form.
 *
 * @example
 * <FormField label="Email" required error={errors.email?.message}>
 *   <Input {...register('email')} />
 * </FormField>
 */
export interface FormFieldProps {
  label?: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
  id?: string
}

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  className,
  id,
}: FormFieldProps) {
  const fieldId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const hasError = !!error

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="text-sm font-medium text-neutral-300 select-none"
        >
          {label}
          {required && (
            <span className="ml-1 text-gold-500 text-xs" aria-hidden>*</span>
          )}
        </label>
      )}

      {/* Clona el children pasando el id si es un input directo */}
      {children}

      {hasError && (
        <p
          role="alert"
          aria-live="polite"
          className="text-xs text-danger-400 flex items-center gap-1"
        >
          {error}
        </p>
      )}

      {!hasError && hint && (
        <p className="text-xs text-neutral-500">{hint}</p>
      )}
    </div>
  )
}
