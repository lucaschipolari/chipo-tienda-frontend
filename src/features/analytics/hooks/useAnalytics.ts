import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../analyticsService'

export function useAnalyticsDashboard(from?: string, to?: string) {
  return useQuery({
    queryKey: ['analytics', 'dashboard', from, to],
    queryFn: () => analyticsService.getDashboard(from, to),
  })
}
