import { cn } from '@/utils/helpers/cn'

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-7 w-7 border-2',
  xl: 'h-9 w-9 border-[3px]',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Cargando..."
      className={cn(
        'inline-block rounded-full border-current border-t-transparent',
        'animate-spin-smooth shrink-0',
        sizes[size],
        className,
      )}
    />
  )
}
