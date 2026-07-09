import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/utils/helpers/cn'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  className?: string
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  showFirstLast = true,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  // Calcular rango de páginas visibles (máximo 5)
  const getVisiblePages = (): (number | '...')[] => {
    const delta = 2
    const range: (number | '...')[] = []
    const rangeWithDots: (number | '...')[] = []

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i)
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  const pages = getVisiblePages()

  const btnBase = cn(
    'h-8 min-w-[2rem] px-2 rounded-lg text-sm font-medium',
    'flex items-center justify-center',
    'transition-all duration-150',
    'disabled:opacity-30 disabled:pointer-events-none',
  )

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      role="navigation"
      aria-label="Paginación"
    >
      {/* Primera página */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className={cn(btnBase, 'text-neutral-500 hover:text-white hover:bg-obsidian-800')}
          aria-label="Primera página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
      )}

      {/* Anterior */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={cn(btnBase, 'text-neutral-500 hover:text-white hover:bg-obsidian-800')}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Páginas numeradas */}
      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`dots-${i}`}
            className="h-8 min-w-[2rem] flex items-center justify-center text-sm text-neutral-600"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              btnBase,
              p === page
                ? 'bg-gold-500 text-black font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-obsidian-800',
            )}
          >
            {p}
          </button>
        ),
      )}

      {/* Siguiente */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={cn(btnBase, 'text-neutral-500 hover:text-white hover:bg-obsidian-800')}
        aria-label="Página siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Última página */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className={cn(btnBase, 'text-neutral-500 hover:text-white hover:bg-obsidian-800')}
          aria-label="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
