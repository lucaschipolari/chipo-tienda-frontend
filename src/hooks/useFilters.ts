import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

type FilterValue = string | number | boolean | undefined

/**
 * Sincroniza filtros arbitrarios con URL query params.
 * Los filtros son bookmarkeables, se comparten y se restauran al navegar.
 *
 * @example
 *   const { filters, setFilter, clearFilter, clearAllFilters } = useFilters()
 *   const status = filters.status as string | undefined
 *   setFilter('status', 'active')
 *   clearFilter('status')
 */
export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = Object.fromEntries(searchParams.entries())

  const setFilter = useCallback(
    (key: string, value: FilterValue) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value === undefined || value === '' || value === null) {
          next.delete(key)
        } else {
          next.set(key, String(value))
          // Reset page al cambiar filtros
          next.set('page', '1')
        }
        return next
      })
    },
    [setSearchParams],
  )

  const setFilters = useCallback(
    (newFilters: Record<string, FilterValue>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(newFilters).forEach(([key, value]) => {
          if (value === undefined || value === '' || value === null) {
            next.delete(key)
          } else {
            next.set(key, String(value))
          }
        })
        next.set('page', '1')
        return next
      })
    },
    [setSearchParams],
  )

  const clearFilter = useCallback(
    (key: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete(key)
        return next
      })
    },
    [setSearchParams],
  )

  const clearAllFilters = useCallback(() => {
    setSearchParams({})
  }, [setSearchParams])

  const hasActiveFilters = Object.keys(filters).some(
    (key) => !['page', 'pageSize', 'sortBy', 'sortDir'].includes(key),
  )

  return {
    filters,
    setFilter,
    setFilters,
    clearFilter,
    clearAllFilters,
    hasActiveFilters,
  }
}
