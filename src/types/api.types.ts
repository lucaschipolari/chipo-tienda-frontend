// ─── Respuestas genéricas del backend ─────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  succeeded: boolean
  message?: string
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// ─── Error normalizado ─────────────────────────────────────────────────────────

export interface ApiError {
  status: number
  message: string
  errors?: Record<string, string[]>
  traceId?: string
}

// ─── Parámetros de consulta ────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface SortParams {
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

export interface SearchParams {
  search?: string
}

export type BaseQueryParams = PaginationParams & SortParams & SearchParams

// ─── Respuesta de mutación ─────────────────────────────────────────────────────

export interface MutationResult<T = void> {
  data?: T
  message?: string
}
