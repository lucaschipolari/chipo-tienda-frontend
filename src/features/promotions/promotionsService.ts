import { httpClient } from '@/services/http/httpClient'
import type { PagedResult } from '@/types/api.types'
import type {
  DiscountListItem,
  DiscountDetail,
  CreateDiscountRequest,
  UpdateDiscountRequest,
  PromotionListItem,
  PromotionDetail,
  PromotionsDashboard,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  PromotionCalculationRequest,
  PromotionCalculationResult,
  CouponListItem,
  CouponDetail,
  CouponUsage,
  CreateCouponRequest,
  UpdateCouponRequest,
  ValidateCouponResult,
} from '@/types/promotions.types'

const DISCOUNTS = '/discounts'
const PROMOTIONS = '/promotions'
const COUPONS = '/coupons'

export const discountsService = {
  getAll: (params?: Record<string, unknown>) =>
    httpClient.get<PagedResult<DiscountListItem>>(DISCOUNTS, params),

  getById: (id: string) =>
    httpClient.get<DiscountDetail>(`${DISCOUNTS}/${id}`),

  create: (data: CreateDiscountRequest) =>
    httpClient.post<{ id: string }>(DISCOUNTS, data),

  update: (id: string, data: UpdateDiscountRequest) =>
    httpClient.put<void>(`${DISCOUNTS}/${id}`, data),

  delete: (id: string) =>
    httpClient.delete<void>(`${DISCOUNTS}/${id}`),

  toggle: (id: string) =>
    httpClient.patch<void>(`${DISCOUNTS}/${id}/toggle`, {}),
}

export const promotionsService = {
  getAll: (params?: Record<string, unknown>) =>
    httpClient.get<PagedResult<PromotionListItem>>(PROMOTIONS, params),

  getById: (id: string) =>
    httpClient.get<PromotionDetail>(`${PROMOTIONS}/${id}`),

  getDashboard: () =>
    httpClient.get<PromotionsDashboard>(`${PROMOTIONS}/dashboard`),

  create: (data: CreatePromotionRequest) =>
    httpClient.post<{ id: string }>(PROMOTIONS, data),

  update: (id: string, data: UpdatePromotionRequest) =>
    httpClient.put<void>(`${PROMOTIONS}/${id}`, data),

  toggle: (id: string) =>
    httpClient.patch<void>(`${PROMOTIONS}/${id}/toggle`, {}),

  duplicate: (id: string) =>
    httpClient.post<{ id: string }>(`${PROMOTIONS}/${id}/duplicate`, {}),

  calculate: (data: PromotionCalculationRequest) =>
    httpClient.post<PromotionCalculationResult>(`${PROMOTIONS}/calculate`, data),
}

export const couponsService = {
  getAll: (params?: Record<string, unknown>) =>
    httpClient.get<PagedResult<CouponListItem>>(COUPONS, params),

  getById: (id: string) =>
    httpClient.get<CouponDetail>(`${COUPONS}/${id}`),

  getUsages: (id: string, page: number, pageSize: number) =>
    httpClient.get<PagedResult<CouponUsage>>(`${COUPONS}/${id}/usages`, { page, pageSize }),

  create: (data: CreateCouponRequest) =>
    httpClient.post<{ id: string }>(COUPONS, data),

  update: (id: string, data: UpdateCouponRequest) =>
    httpClient.put<void>(`${COUPONS}/${id}`, data),

  toggle: (id: string) =>
    httpClient.patch<void>(`${COUPONS}/${id}/toggle`, {}),

  delete: (id: string) =>
    httpClient.delete<void>(`${COUPONS}/${id}`),

  validate: (code: string, orderTotal: number, currency: string, customerId?: string) =>
    httpClient.post<ValidateCouponResult>(`${COUPONS}/validate`, { code, orderTotal, currency, customerId }),
}
