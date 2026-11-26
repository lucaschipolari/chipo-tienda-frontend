import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { parseErrorMessage } from '@/utils/helpers/errorParser'
import { pricingCalculatorService } from '../pricingCalculatorService'
import { profitabilityKeys } from '@/features/profitability/hooks/useProfitability'
import type {
  GetPricingCalculatorParams, UpdatePricingSettingsPayload, UpdateProductPricingPayload, SetSalePricePayload,
} from '@/types/pricingCalculator.types'

export const pricingCalculatorKeys = {
  all: ['pricing-calculator'] as const,
  overview: (params: GetPricingCalculatorParams) => [...pricingCalculatorKeys.all, 'overview', params] as const,
}

export function usePricingCalculator(params: GetPricingCalculatorParams = {}) {
  return useQuery({
    queryKey: pricingCalculatorKeys.overview(params),
    queryFn: () => pricingCalculatorService.getOverview(params),
    placeholderData: keepPreviousData,
  })
}

/** Lo que cambia la calculadora (costos y precios) también lo muestran Rentabilidad y Productos. */
function useInvalidateAll() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: pricingCalculatorKeys.all })
    qc.invalidateQueries({ queryKey: profitabilityKeys.all })
    qc.invalidateQueries({ queryKey: ['products'] })
  }
}

export function useUpdatePricingSettings() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (payload: UpdatePricingSettingsPayload) => pricingCalculatorService.updateSettings(payload),
    onSuccess: invalidate,
    onError: (e) => toast.error(parseErrorMessage(e)),
  })
}

export function useUpdateProductPricing() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: UpdateProductPricingPayload }) =>
      pricingCalculatorService.updateProduct(productId, payload),
    onSuccess: invalidate,
    onError: (e) => toast.error(parseErrorMessage(e)),
  })
}

export function useSetSalePrice() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: SetSalePricePayload }) =>
      pricingCalculatorService.setSalePrice(productId, payload),
    onSuccess: invalidate,
    onError: (e) => toast.error(parseErrorMessage(e)),
  })
}

export function useApplySuggestedPrice() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (productIds: string[]) => pricingCalculatorService.applySuggested(productIds),
    onSuccess: invalidate,
    onError: (e) => toast.error(parseErrorMessage(e)),
  })
}
