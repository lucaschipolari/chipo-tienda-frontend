import { httpClient } from '@/services/http/httpClient'
import type {
  PricingCalculatorOverview, GetPricingCalculatorParams, PricingSettings, ProductPricingItem,
  UpdatePricingSettingsPayload, UpdateProductPricingPayload, SetSalePricePayload,
} from '@/types/pricingCalculator.types'

const BASE = '/pricing-calculator'

export const pricingCalculatorService = {
  getOverview: (params: GetPricingCalculatorParams = {}): Promise<PricingCalculatorOverview> => {
    const q: Record<string, unknown> = {}
    if (params.group) q.group = params.group
    if (params.search) q.search = params.search
    return httpClient.get<PricingCalculatorOverview>(BASE, q)
  },

  updateSettings: (payload: UpdatePricingSettingsPayload): Promise<PricingSettings> =>
    httpClient.put<PricingSettings>(`${BASE}/settings`, payload),

  updateProduct: (productId: string, payload: UpdateProductPricingPayload): Promise<ProductPricingItem> =>
    httpClient.put<ProductPricingItem>(`${BASE}/products/${productId}`, payload),

  setSalePrice: (productId: string, payload: SetSalePricePayload): Promise<void> =>
    httpClient.put<void>(`${BASE}/products/${productId}/sale-price`, payload),

  applySuggested: (productIds: string[]): Promise<{ updatedProductsCount: number }> =>
    httpClient.post<{ updatedProductsCount: number }>(`${BASE}/apply-suggested-price`, { productIds }),
}
