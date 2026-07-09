import { httpClient } from '@/services/http/httpClient'
import type { FinanceDashboard, CashFlow } from '@/types/finance.types'

const BASE = '/finance'

export const financeService = {
  getDashboard: (period: string, from?: string, to?: string): Promise<FinanceDashboard> => {
    const params: Record<string, unknown> = { period }
    if (from) params.from = from
    if (to) params.to = to
    return httpClient.get<FinanceDashboard>(`${BASE}/dashboard`, params)
  },

  getCashFlow: (granularity: string, from?: string, to?: string): Promise<CashFlow> => {
    const params: Record<string, unknown> = { granularity }
    if (from) params.from = from
    if (to) params.to = to
    return httpClient.get<CashFlow>(`${BASE}/cash-flow`, params)
  },
}
