import { httpClient } from '@/services/http/httpClient'
import type { PagedResult } from '@/types/api.types'
import type {
  PurchaseOrder,
  PurchaseOrderListItem,
  CreatePurchaseOrderRequest,
  ReceivePurchaseOrderRequest,
  GetPurchaseOrdersParams,
} from '@/types/purchase.types'

const BASE = '/purchase-orders'

export const purchasesService = {
  getAll: (params: GetPurchaseOrdersParams = {}) =>
    httpClient.get<PagedResult<PurchaseOrderListItem>>(BASE, params as Record<string, unknown>),

  getById: (id: string) =>
    httpClient.get<PurchaseOrder>(`${BASE}/${id}`),

  create: (data: CreatePurchaseOrderRequest) =>
    httpClient.post<{ id: string }>(BASE, data),

  send: (id: string) =>
    httpClient.post<void>(`${BASE}/${id}/send`),

  approve: (id: string) =>
    httpClient.post<void>(`${BASE}/${id}/approve`),

  receive: (id: string, data: ReceivePurchaseOrderRequest) =>
    httpClient.post<void>(`${BASE}/${id}/receive`, data),

  cancel: (id: string) =>
    httpClient.delete<void>(`${BASE}/${id}`),
}
