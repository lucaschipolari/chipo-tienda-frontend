import { useQuery } from '@tanstack/react-query'
import { financeService } from '../financeService'

export const financeKeys = {
  all: ['finance'] as const,
  dashboard: (period: string, from?: string, to?: string) =>
    [...financeKeys.all, 'dashboard', period, from, to] as const,
  cashFlow: (granularity: string, from?: string, to?: string) =>
    [...financeKeys.all, 'cash-flow', granularity, from, to] as const,
}

export function useFinanceDashboard(period: string, from?: string, to?: string) {
  return useQuery({
    queryKey: financeKeys.dashboard(period, from, to),
    queryFn: () => financeService.getDashboard(period, from, to),
    enabled: !!period,
  })
}

export function useCashFlow(granularity: string, from?: string, to?: string) {
  return useQuery({
    queryKey: financeKeys.cashFlow(granularity, from, to),
    queryFn: () => financeService.getCashFlow(granularity, from, to),
    enabled: !!granularity,
  })
}
