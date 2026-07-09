import { cn } from '@/utils/helpers/cn'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  id?: string
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  id,
}: SwitchProps) {
  const switchId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : 'switch')

  const trackSize = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11'
  const thumbSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5'
  const thumbTranslate = size === 'sm'
    ? checked ? 'translate-x-4' : 'translate-x-0.5'
    : checked ? 'translate-x-5' : 'translate-x-1'

  return (
    <div className="flex items-start gap-3">
      <button
        id={switchId}
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full',
          'transition-all duration-200 focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-950',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          trackSize,
          checked
            ? 'bg-gold-500'
            : 'bg-obsidian-700 border border-neutral-700',
        )}
      >
        <span
          className={cn(
            'inline-block rounded-full bg-white shadow-sm',
            'transition-transform duration-200',
            thumbSize,
            thumbTranslate,
          )}
        />
      </button>

      {(label || description) && (
        <label
          htmlFor={switchId}
          className={cn(
            'flex flex-col cursor-pointer',
            disabled && 'opacity-40 cursor-not-allowed',
          )}
        >
          {label && (
            <span className="text-sm font-medium text-white">{label}</span>
          )}
          {description && (
            <span className="text-xs text-neutral-500 mt-0.5">{description}</span>
          )}
        </label>
      )}
    </div>
  )
}
