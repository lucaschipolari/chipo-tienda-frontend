import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface UsePaginationOptions {
  defaultPage?: number
  defaultPageSize?: number
  pageKey?: string
  pageSizeKey?: string
}

export interface UsePaginationReturn {
  page: number
  pageSize: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  resetPage: () => void
}

/**
 * Sincroniza el estado de paginación con los URL query params.
 * Esto permite que los filtros/páginas sean bookmarkeables y se restauren.
 */
export function usePagination({
  defaultPage = 1,
  defaultPageSize = 20,
  pageKey = 'page',
  pageSizeKey = 'pageSize',
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = parseInt(searchParams.get(pageKey) ?? String(defaultPage), 10)
  const pageSize = parseInt(
    searchParams.get(pageSizeKey) ?? String(defaultPageSize),
    10,
  )

  const setPage = useCallback(
    (newPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set(pageKey, String(newPage))
        return next
      })
    },
    [pageKey, setSearchParams],
  )

  const setPageSize = useCallback(
    (size: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set(pageSizeKey, String(size))
        next.set(pageKey, '1') // reset page cuando cambia el tamaño
        return next
      })
    },
    [pageKey, pageSizeKey, setSearchParams],
  )

  const resetPage = useCallback(() => {
    setPage(defaultPage)
  }, [defaultPage, setPage])

  return { page, pageSize, setPage, setPageSize, resetPage }
}
