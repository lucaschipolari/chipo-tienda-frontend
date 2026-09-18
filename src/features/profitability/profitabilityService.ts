import { httpClient } from '@/services/http/httpClient'
import type {
  ProfitabilityRow, ProfitabilitySummary, ProductProfitabilityDetail,
  ProfitabilitySettings, CategoryMargin, GetProfitabilityParams,
} from '@/types/profitability.types'

const BASE = '/profitability'

export const profitabilityService = {
  getTable: (params: GetProfitabilityParams = {}): Promise<ProfitabilityRow[]> => {
    const q: Record<string, unknown> = {}
    if (params.categoryId) q.categoryId = params.categoryId
    if (params.status) q.status = params.status
    if (params.search) q.search = params.search
    if (params.costIncreased) q.costIncreased = params.costIncreased
    if (params.belowSuggested) q.belowSuggested = params.belowSuggested
    if (params.minMargin != null) q.minMargin = params.minMargin
    if (params.maxMargin != null) q.maxMargin = params.maxMargin
    if (params.sortBy) q.sortBy = params.sortBy
    if (params.sortDir) q.sortDir = params.sortDir
    return httpClient.get<ProfitabilityRow[]>(BASE, q)
  },

  getSummary: (): Promise<ProfitabilitySummary> =>
    httpClient.get<ProfitabilitySummary>(`${BASE}/summary`),

  getDetail: (productId: string): Promise<ProductProfitabilityDetail> =>
    httpClient.get<ProductProfitabilityDetail>(`${BASE}/${productId}`),

  getSettings: (): Promise<ProfitabilitySettings> =>
    httpClient.get<ProfitabilitySettings>(`${BASE}/settings`),

  setSettings: (settings: ProfitabilitySettings): Promise<void> =>
    httpClient.put<void>(`${BASE}/settings`, settings),

  setTargetMargin: (productId: string, targetMarginPct: number | null): Promise<void> =>
    httpClient.put<void>(`${BASE}/${productId}/target-margin`, { targetMarginPct }),

  getCategoryMargins: (): Promise<CategoryMargin[]> =>
    httpClient.get<CategoryMargin[]>(`${BASE}/category-margins`),

  setCategoryMargins: (items: CategoryMargin[]): Promise<void> =>
    httpClient.put<void>(`${BASE}/category-margins`, { items }),
}
