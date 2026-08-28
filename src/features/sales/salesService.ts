import { httpClient } from '@/services/http/httpClient'
import type { PagedResult } from '@/types/api.types'
import type { Sale, SaleListItem, CreateSaleRequest, GetSalesParams, SalesReport } from '@/types/sale.types'

export interface UpdateSaleRequest {
  paymentMethod: string
  notes?: string
  customerName?: string
  saleDate?: string
}

const BASE = '/sales'

export const salesService = {
  getAll: (params: GetSalesParams = {}) =>
    httpClient.get<PagedResult<SaleListItem>>(BASE, params as Record<string, unknown>),

  getById: (id: string) =>
    httpClient.get<Sale>(`${BASE}/${id}`),

  create: (data: CreateSaleRequest) =>
    httpClient.post<{ id: string }>(BASE, data),

  update: (id: string, data: UpdateSaleRequest) =>
    httpClient.put<void>(`${BASE}/${id}`, { ...data, id }),

  remove: (id: string) =>
    httpClient.delete<void>(`${BASE}/${id}`),

  getReport: (from: string, to: string) =>
    httpClient.get<SalesReport>(`${BASE}/report`, { from, to }),
}
