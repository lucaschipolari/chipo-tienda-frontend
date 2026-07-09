import { cn } from '@/utils/helpers/cn'

export interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle' | 'card'
  width?: string | number
  height?: string | number
  lines?: number
  className?: string
}

export function Skeleton({
  variant = 'rect',
  width,
  height,
  lines = 1,
  className,
}: SkeletonProps) {
  const style: React.CSSProperties = {
    ...(width !== undefined && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height !== undefined && { height: typeof height === 'number' ? `${height}px` : height }),
  }

  if (variant === 'text') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            style={{ ...style, width: i === lines - 1 && lines > 1 ? '70%' : style.width ?? '100%' }}
            className="skeleton h-4 rounded"
          />
        ))}
      </div>
    )
  }

  if (variant === 'circle') {
    return (
      <div
        className={cn('skeleton rounded-full', className)}
        style={{ width: width ?? 40, height: height ?? 40, ...style }}
      />
    )
  }

  if (variant === 'card') {
    return (
      <div className={cn('rounded-2xl bg-obsidian-900 border border-neutral-800 overflow-hidden', className)}>
        <div className="skeleton h-48 rounded-none" />
        <div className="p-4 flex flex-col gap-2">
          <div className="skeleton h-4 rounded w-3/4" />
          <div className="skeleton h-3 rounded w-1/2" />
          <div className="skeleton h-8 rounded-xl mt-2" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('skeleton', className)}
      style={style}
    />
  )
}

/**
 * Versión que imita una fila de tabla
 */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-neutral-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 rounded w-full max-w-[140px]" />
        </td>
      ))}
    </tr>
  )
}
