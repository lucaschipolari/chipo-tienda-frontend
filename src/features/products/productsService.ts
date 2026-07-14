import { httpClient } from '@/services/http/httpClient'
import type { PagedResult } from '@/types/api.types'
import type {
  Product,
  ProductListItem,
  CreateProductRequest,
  UpdateProductRequest,
  AddVariantRequest,
  UpdateVariantRequest,
  ProductStatus,
} from '@/types/catalog.types'

const BASE = '/products'

export interface GetProductsParams {
  page?: number
  pageSize?: number
  categoryId?: string
  search?: string
  status?: ProductStatus | ''
}

export const productsService = {
  getAll: (params: GetProductsParams = {}) =>
    httpClient.get<PagedResult<ProductListItem>>(BASE, params as Record<string, unknown>),

  getById: (id: string) =>
    httpClient.get<Product>(`${BASE}/${id}`),

  getBySlug: (slug: string) =>
    httpClient.get<Product>(`${BASE}/slug/${slug}`),

  create: (data: CreateProductRequest) =>
    httpClient.post<{ id: string }>(BASE, data),

  update: (id: string, data: UpdateProductRequest) =>
    httpClient.put<void>(`${BASE}/${id}`, { ...data, id }),

  changeStatus: (id: string, status: string) =>
    httpClient.patch<void>(`${BASE}/${id}/status`, { status }),

  addVariant: (data: AddVariantRequest) =>
    httpClient.post<{ variantId: string }>(`${BASE}/${data.productId}/variants`, data),

  updateVariant: (data: UpdateVariantRequest) =>
    httpClient.put<void>(`${BASE}/${data.productId}/variants/${data.variantId}`, data),

  addImage: (productId: string, url: string) =>
    httpClient.post<{ imageId: string }>(`${BASE}/${productId}/images`, { url }),

  removeImage: (productId: string, imageId: string) =>
    httpClient.delete<void>(`${BASE}/${productId}/images/${imageId}`),

  configureDecant: (productId: string, data: { bottleCost?: number | null; bottleMl?: number | null; stockMl: number; reorderMl: number }) =>
    httpClient.put<void>(`${BASE}/${productId}/decant`, data),

  deleteProduct: (id: string) =>
    httpClient.delete<void>(`${BASE}/${id}`),

  deleteVariant: (productId: string, variantId: string) =>
    httpClient.delete<void>(`${BASE}/${productId}/variants/${variantId}`),
}
