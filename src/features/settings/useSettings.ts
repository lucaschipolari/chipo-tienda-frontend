import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService, type VialCost, type VialProduct } from './settingsService'

const vialKey = ['settings', 'vial-costs'] as const
const vialProductsKey = ['settings', 'vial-products'] as const

export function useVialCosts() {
  return useQuery({
    queryKey: vialKey,
    queryFn: () => settingsService.getVialCosts(),
    staleTime: 60_000,
  })
}

export function useSetVialCosts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: VialCost[]) => settingsService.setVialCosts(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: vialKey }),
  })
}

export function useVialProducts() {
  return useQuery({
    queryKey: vialProductsKey,
    queryFn: () => settingsService.getVialProducts(),
    staleTime: 60_000,
  })
}

export function useSetVialProducts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: VialProduct[]) => settingsService.setVialProducts(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: vialProductsKey }),
  })
}
