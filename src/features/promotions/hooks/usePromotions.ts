import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { discountsService, promotionsService, couponsService } from '../promotionsService'
import type {
  CreateDiscountRequest,
  UpdateDiscountRequest,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  PromotionCalculationRequest,
  CreateCouponRequest,
  UpdateCouponRequest,
} from '@/types/promotions.types'

// ─── Key factories ────────────────────────────────────────────────────────────

const discountKeys = {
  all: ['discounts'] as const,
  list: (params: unknown) => [...discountKeys.all, 'list', params] as const,
  detail: (id: string) => [...discountKeys.all, 'detail', id] as const,
}

const promotionKeys = {
  all: ['promotions'] as const,
  list: (params: unknown) => [...promotionKeys.all, 'list', params] as const,
  detail: (id: string) => [...promotionKeys.all, 'detail', id] as const,
  dashboard: () => [...promotionKeys.all, 'dashboard'] as const,
}

const couponKeys = {
  all: ['coupons'] as const,
  list: (params: unknown) => [...couponKeys.all, 'list', params] as const,
  detail: (id: string) => [...couponKeys.all, 'detail', id] as const,
  usages: (id: string, params: unknown) => [...couponKeys.all, 'usages', id, params] as const,
}

// ─── Discount hooks ───────────────────────────────────────────────────────────

export function useDiscounts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: discountKeys.list(params),
    queryFn: () => discountsService.getAll(params),
  })
}

export function useDiscountDetail(id: string) {
  return useQuery({
    queryKey: discountKeys.detail(id),
    queryFn: () => discountsService.getById(id),
    enabled: !!id,
  })
}

export function useCreateDiscount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDiscountRequest) => discountsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: discountKeys.all })
      toast.success('Descuento creado')
    },
    onError: () => toast.error('Error al crear descuento'),
  })
}

export function useUpdateDiscount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDiscountRequest }) =>
      discountsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: discountKeys.all })
      toast.success('Descuento actualizado')
    },
    onError: () => toast.error('Error al actualizar descuento'),
  })
}

export function useDeleteDiscount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => discountsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: discountKeys.all })
      toast.success('Descuento eliminado')
    },
    onError: () => toast.error('Error al eliminar descuento'),
  })
}

export function useToggleDiscount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => discountsService.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: discountKeys.all })
      toast.success('Estado actualizado')
    },
    onError: () => toast.error('Error al cambiar estado'),
  })
}

// ─── Promotion hooks ──────────────────────────────────────────────────────────

export function usePromotions(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: promotionKeys.list(params),
    queryFn: () => promotionsService.getAll(params),
  })
}

export function usePromotionDetail(id: string) {
  return useQuery({
    queryKey: promotionKeys.detail(id),
    queryFn: () => promotionsService.getById(id),
    enabled: !!id,
  })
}

export function usePromotionsDashboard() {
  return useQuery({
    queryKey: promotionKeys.dashboard(),
    queryFn: () => promotionsService.getDashboard(),
  })
}

export function useCreatePromotion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePromotionRequest) => promotionsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: promotionKeys.all })
      toast.success('Promocion creada')
    },
    onError: () => toast.error('Error al crear promocion'),
  })
}

export function useUpdatePromotion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePromotionRequest }) =>
      promotionsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: promotionKeys.all })
      toast.success('Promocion actualizada')
    },
    onError: () => toast.error('Error al actualizar promocion'),
  })
}

export function useTogglePromotion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => promotionsService.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: promotionKeys.all })
      toast.success('Estado actualizado')
    },
    onError: () => toast.error('Error al cambiar estado'),
  })
}

export function useDuplicatePromotion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => promotionsService.duplicate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: promotionKeys.all })
      toast.success('Promocion duplicada')
    },
    onError: () => toast.error('Error al duplicar promocion'),
  })
}

export function useCalculatePromotion() {
  return useMutation({
    mutationFn: (data: PromotionCalculationRequest) => promotionsService.calculate(data),
    onError: () => toast.error('Error al calcular promociones'),
  })
}

// ─── Coupon hooks ─────────────────────────────────────────────────────────────

export function useCoupons(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: couponKeys.list(params),
    queryFn: () => couponsService.getAll(params),
  })
}

export function useCouponDetail(id: string) {
  return useQuery({
    queryKey: couponKeys.detail(id),
    queryFn: () => couponsService.getById(id),
    enabled: !!id,
  })
}

export function useCouponUsages(id: string, page: number, pageSize: number) {
  const params = { page, pageSize }
  return useQuery({
    queryKey: couponKeys.usages(id, params),
    queryFn: () => couponsService.getUsages(id, page, pageSize),
    enabled: !!id,
  })
}

export function useCreateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCouponRequest) => couponsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: couponKeys.all })
      toast.success('Cupon creado')
    },
    onError: () => toast.error('Error al crear cupon'),
  })
}

export function useUpdateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCouponRequest }) =>
      couponsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: couponKeys.all })
      toast.success('Cupon actualizado')
    },
    onError: () => toast.error('Error al actualizar cupon'),
  })
}

export function useToggleCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => couponsService.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: couponKeys.all })
      toast.success('Estado actualizado')
    },
    onError: () => toast.error('Error al cambiar estado'),
  })
}

export function useDeleteCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => couponsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: couponKeys.all })
      toast.success('Cupon eliminado')
    },
    onError: () => toast.error('Error al eliminar cupon'),
  })
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({
      code,
      orderTotal,
      currency,
      customerId,
    }: {
      code: string
      orderTotal: number
      currency: string
      customerId?: string
    }) => couponsService.validate(code, orderTotal, currency, customerId),
    onError: () => toast.error('Error al validar cupon'),
  })
}
