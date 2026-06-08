import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { SortingState, SortDirection } from '@/types/common.types'

export interface UseSortReturn {
  sorting: SortingState | null
  setSorting: (field: string, direction?: SortDirection) => void
  clearSorting: () => void
}

/**
 * Sincroniza el estado de ordenamiento con URL query params.
 *
 * @param defaultField     Campo por defecto
 * @param defaultDirection Dirección por defecto
 */
export function useSort(
  defaultField?: string,
  defaultDirection: SortDirection = 'desc',
): UseSortReturn {
  const [searchParams, setSearchParams] = useSearchParams()

  const sortBy = searchParams.get('sortBy') ?? defaultField
  const sortDirection = (searchParams.get('sortDir') as SortDirection) ?? defaultDirection

  const sorting: SortingState | null = sortBy
    ? { field: sortBy, direction: sortDirection }
    : null

  const setSorting = useCallback(
    (field: string, direction?: SortDirection) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('sortBy', field)
        // Toggle direction si se hace click en el mismo campo
        if (!direction && sorting?.field === field) {
          next.set('sortDir', sorting.direction === 'asc' ? 'desc' : 'asc')
        } else {
          next.set('sortDir', direction ?? defaultDirection)
        }
        return next
      })
    },
    [defaultDirection, setSearchParams, sorting],
  )

  const clearSorting = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('sortBy')
      next.delete('sortDir')
      return next
    })
  }, [setSearchParams])

  return { sorting, setSorting, clearSorting }
}
