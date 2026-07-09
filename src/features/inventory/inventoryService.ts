import { httpClient } from '@/services/http/httpClient'
import type { PagedResult } from '@/types/api.types'
import type { StockMovement, LowStockItem, AdjustStockRequest } from '@/types/catalog.types'

const BASE = '/inventory'

export interface GetMovementsParams {
  productId?: string
  variantId?: string
  page?: number
  pageSize?: number
}

export const inventoryService = {
  getMovements: (params: GetMovementsParams = {}) =>
    httpClient.get<PagedResult<StockMovement>>(`${BASE}/movements`, params as Record<string, unknown>),

  getLowStock: () =>
    httpClient.get<LowStockItem[]>(`${BASE}/low-stock`),

  adjustStock: (data: AdjustStockRequest) =>
    httpClient.post<void>(`${BASE}/adjust`, data),
}
