import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService, type VialCost } from './settingsService'

const vialKey = ['settings', 'vial-costs'] as const

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
