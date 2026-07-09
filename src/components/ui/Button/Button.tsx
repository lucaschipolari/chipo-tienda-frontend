import { forwardRef } from 'react'
import { cn } from '@/utils/helpers/cn'
import { Spinner } from '../Spinner/Spinner'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

// ─── Variantes visuales ───────────────────────────────────────────────────────

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  // Dorado — acción principal, CTAs, botones premium
  primary: cn(
    'bg-gold-500 text-black font-semibold',
    'hover:bg-gold-400 active:bg-gold-600',
    'shadow-gold hover:shadow-gold-lg',
    'disabled:bg-obsidian-700 disabled:text-obsidian-500 disabled:shadow-none',
  ),
  // Contorno dorado — acción secundaria
  secondary: cn(
    'bg-transparent text-gold-500 font-medium',
    'border border-gold-500',
    'hover:bg-gold-500/10 hover:text-gold-400 hover:border-gold-400',
    'active:bg-gold-500/20',
    'disabled:text-obsidian-600 disabled:border-obsidian-700',
  ),
  // Fantasma — acción terciaria, navegación
  ghost: cn(
    'bg-transparent text-neutral-400 font-medium',
    'hover:bg-obsidian-800 hover:text-white',
    'active:bg-obsidian-700',
    'disabled:text-obsidian-600',
  ),
  // Contorno neutro — acciones alternativas
  outline: cn(
    'bg-transparent text-white font-medium',
    'border border-neutral-700',
    'hover:border-neutral-500 hover:bg-obsidian-800',
    'active:bg-obsidian-700',
    'disabled:text-obsidian-600 disabled:border-obsidian-800',
  ),
  // Peligro — acciones destructivas
  danger: cn(
    'bg-danger-600 text-white font-semibold',
    'hover:bg-danger-500 active:bg-danger-700',
    'disabled:bg-obsidian-700 disabled:text-obsidian-500',
  ),
}

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  xs: 'h-7  px-3   text-xs   gap-1.5  rounded-lg',
  sm: 'h-8  px-4   text-sm   gap-2    rounded-lg',
  md: 'h-10 px-5   text-sm   gap-2    rounded-xl',
  lg: 'h-12 px-6   text-base gap-2.5  rounded-xl',
  xl: 'h-14 px-8   text-base gap-3    rounded-2xl',
}

// ─── Componente ──────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base
          'inline-flex items-center justify-center',
          'font-sans select-none whitespace-nowrap',
          'transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-950',
          'disabled:pointer-events-none disabled:opacity-50',
          // Variante y tamaño
          variants[variant],
          sizes[size],
          // Full width
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {/* Ícono izquierdo / Spinner de carga */}
        {loading ? (
          <Spinner
            size="sm"
            className={cn(
              variant === 'primary' ? 'text-black' : 'text-current',
            )}
          />
        ) : (
          leftIcon && (
            <span className="shrink-0 flex items-center">{leftIcon}</span>
          )
        )}

        {/* Label */}
        {children && (
          <span className={cn(loading && 'opacity-70')}>{children}</span>
        )}

        {/* Ícono derecho */}
        {rightIcon && !loading && (
          <span className="shrink-0 flex items-center">{rightIcon}</span>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'
