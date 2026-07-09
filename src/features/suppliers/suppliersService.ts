import { httpClient } from '@/services/http/httpClient'
import type { PagedResult } from '@/types/api.types'
import type {
  Supplier, SupplierListItem,
  CreateSupplierRequest, UpdateSupplierRequest, GetSuppliersParams,
} from '@/types/supplier.types'

const BASE = '/suppliers'

export const suppliersService = {
  getAll: (params: GetSuppliersParams = {}) =>
    httpClient.get<PagedResult<SupplierListItem>>(BASE, params as Record<string, unknown>),

  getById: (id: string) =>
    httpClient.get<Supplier>(`${BASE}/${id}`),

  create: (data: CreateSupplierRequest) =>
    httpClient.post<{ id: string }>(BASE, data),

  update: (id: string, data: UpdateSupplierRequest) =>
    httpClient.put<void>(`${BASE}/${id}`, { ...data, id }),

  changeStatus: (id: string, isActive: boolean) =>
    httpClient.patch<void>(`${BASE}/${id}/status`, { isActive }),
}
