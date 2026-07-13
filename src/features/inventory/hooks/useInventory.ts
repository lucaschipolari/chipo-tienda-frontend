import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryService, type GetMovementsParams } from '../inventoryService'
import type { AdjustStockRequest } from '@/types/catalog.types'

export const inventoryKeys = {
  all: ['inventory'] as const,
  movements: (params: GetMovementsParams) => [...inventoryKeys.all, 'movements', params] as const,
  lowStock: () => [...inventoryKeys.all, 'low-stock'] as const,
  valuation: () => [...inventoryKeys.all, 'valuation'] as const,
}

export function useStockValuation() {
  return useQuery({
    queryKey: inventoryKeys.valuation(),
    queryFn: () => inventoryService.getValuation(),
    staleTime: 60_000,
  })
}

export function useStockMovements(params: GetMovementsParams = {}) {
  return useQuery({
    queryKey: inventoryKeys.movements(params),
    queryFn: () => inventoryService.getMovements(params),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  })
}

export function useLowStock() {
  return useQuery({
    queryKey: inventoryKeys.lowStock(),
    queryFn: () => inventoryService.getLowStock(),
    staleTime: 30_000,
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AdjustStockRequest) => inventoryService.adjustStock(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
