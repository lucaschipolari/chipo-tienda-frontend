import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchasesService } from '../purchasesService'
import type {
  CreatePurchaseOrderRequest,
  ReceivePurchaseOrderRequest,
  GetPurchaseOrdersParams,
} from '@/types/purchase.types'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const purchaseKeys = {
  all: ['purchases'] as const,
  lists: () => [...purchaseKeys.all, 'list'] as const,
  list: (params: GetPurchaseOrdersParams) => [...purchaseKeys.lists(), params] as const,
  details: () => [...purchaseKeys.all, 'detail'] as const,
  detail: (id: string) => [...purchaseKeys.details(), id] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function usePurchaseOrders(params: GetPurchaseOrdersParams = {}) {
  return useQuery({
    queryKey: purchaseKeys.list(params),
    queryFn: () => purchasesService.getAll(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function usePurchaseOrder(id: string | undefined) {
  return useQuery({
    queryKey: purchaseKeys.detail(id!),
    queryFn: () => purchasesService.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreatePurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePurchaseOrderRequest) => purchasesService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: purchaseKeys.lists() }),
  })
}

export function useSendPurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => purchasesService.send(id),
    onSuccess: (_r, id) => {
      qc.invalidateQueries({ queryKey: purchaseKeys.lists() })
      qc.invalidateQueries({ queryKey: purchaseKeys.detail(id) })
    },
  })
}

export function useApprovePurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => purchasesService.approve(id),
    onSuccess: (_r, id) => {
      qc.invalidateQueries({ queryKey: purchaseKeys.lists() })
      qc.invalidateQueries({ queryKey: purchaseKeys.detail(id) })
    },
  })
}

export function useReceivePurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReceivePurchaseOrderRequest }) =>
      purchasesService.receive(id, data),
    onSuccess: (_r, { id }) => {
      qc.invalidateQueries({ queryKey: purchaseKeys.lists() })
      qc.invalidateQueries({ queryKey: purchaseKeys.detail(id) })
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useCancelPurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => purchasesService.cancel(id),
    onSuccess: (_r, id) => {
      qc.invalidateQueries({ queryKey: purchaseKeys.lists() })
      qc.invalidateQueries({ queryKey: purchaseKeys.detail(id) })
    },
  })
}
