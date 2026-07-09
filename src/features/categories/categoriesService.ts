import { httpClient } from '@/services/http/httpClient'
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/catalog.types'

const BASE = '/categories'

export const categoriesService = {
  getAll: (includeInactive = false) =>
    httpClient.get<Category[]>(BASE, { params: { includeInactive } }),

  getById: (id: string) =>
    httpClient.get<Category>(`${BASE}/${id}`),

  create: (data: CreateCategoryRequest) =>
    httpClient.post<{ id: string }>(BASE, data),

  update: (id: string, data: UpdateCategoryRequest) =>
    httpClient.put<void>(`${BASE}/${id}`, { ...data, id }),

  delete: (id: string) =>
    httpClient.delete<void>(`${BASE}/${id}`),
}
