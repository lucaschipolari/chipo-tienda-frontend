import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { profitabilityService } from '../profitabilityService'
import type { GetProfitabilityParams, ProfitabilitySettings } from '@/types/profitability.types'

export const profitabilityKeys = {
  all: ['profitability'] as const,
  table: (params: GetProfitabilityParams) => [...profitabilityKeys.all, 'table', params] as const,
  summary: () => [...profitabilityKeys.all, 'summary'] as const,
  detail: (id: string) => [...profitabilityKeys.all, 'detail', id] as const,
  settings: () => [...profitabilityKeys.all, 'settings'] as const,
}

export function useProfitability(params: GetProfitabilityParams = {}) {
  return useQuery({
    queryKey: profitabilityKeys.table(params),
    queryFn: () => profitabilityService.getTable(params),
  })
}

export function useProfitabilitySummary() {
  return useQuery({
    queryKey: profitabilityKeys.summary(),
    queryFn: () => profitabilityService.getSummary(),
  })
}

export function useProductProfitability(productId: string | null) {
  return useQuery({
    queryKey: profitabilityKeys.detail(productId ?? ''),
    queryFn: () => profitabilityService.getDetail(productId!),
    enabled: !!productId,
  })
}

export function useProfitabilitySettings() {
  return useQuery({
    queryKey: profitabilityKeys.settings(),
    queryFn: () => profitabilityService.getSettings(),
  })
}

export function useSetProfitabilitySettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (settings: ProfitabilitySettings) => profitabilityService.setSettings(settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profitabilityKeys.all })
      toast.success('Configuración de rentabilidad guardada.')
    },
    onError: () => toast.error('No se pudo guardar la configuración.'),
  })
}

export function useSetProductTargetMargin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, targetMarginPct }: { productId: string; targetMarginPct: number | null }) =>
      profitabilityService.setTargetMargin(productId, targetMarginPct),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profitabilityKeys.all })
      toast.success('Margen objetivo del producto actualizado.')
    },
    onError: () => toast.error('No se pudo actualizar el margen objetivo.'),
  })
}
