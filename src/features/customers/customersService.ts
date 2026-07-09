import { httpClient } from '@/services/http/httpClient'
import type { PagedResult } from '@/types/api.types'
import type {
  Customer, CustomerListItem,
  CreateCustomerRequest, UpdateCustomerRequest, GetCustomersParams,
} from '@/types/customer.types'

const BASE = '/customers'

export const customersService = {
  getAll: (params: GetCustomersParams = {}) =>
    httpClient.get<PagedResult<CustomerListItem>>(BASE, params as Record<string, unknown>),

  getById: (id: string) =>
    httpClient.get<Customer>(`${BASE}/${id}`),

  create: (data: CreateCustomerRequest) =>
    httpClient.post<{ id: string }>(BASE, data),

  update: (id: string, data: UpdateCustomerRequest) =>
    httpClient.put<void>(`${BASE}/${id}`, { ...data, id }),

  changeStatus: (id: string, isActive: boolean) =>
    httpClient.patch<void>(`${BASE}/${id}/status`, { isActive }),
}
