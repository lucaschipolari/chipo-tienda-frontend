import { httpClient } from '@/services/http/httpClient'
import type { PagedResult } from '@/types/api.types'
import type {
  Order,
  OrderListItem,
  CreateOrderRequest,
  GetOrdersParams,
} from '@/types/order.types'

const BASE = '/orders'

export const ordersService = {
  getAll: (params: GetOrdersParams = {}) =>
    httpClient.get<PagedResult<OrderListItem>>(BASE, params as Record<string, unknown>),

  getById: (id: string) =>
    httpClient.get<Order>(`${BASE}/${id}`),

  getByNumber: (number: string) =>
    httpClient.get<Order>(`${BASE}/number/${number}`),

  create: (data: CreateOrderRequest) =>
    httpClient.post<{ id: string }>(BASE, data),

  changeStatus: (id: string, newStatus: string, note?: string) =>
    httpClient.patch<void>(`${BASE}/${id}/status`, { newStatus, note }),
}
