import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesService } from '../salesService'
import type { CreateSaleRequest, GetSalesParams } from '@/types/sale.types'

export const saleKeys = {
  all: ['sales'] as const,
  lists: () => [...saleKeys.all, 'list'] as const,
  list: (params: GetSalesParams) => [...saleKeys.lists(), params] as const,
  details: () => [...saleKeys.all, 'detail'] as const,
  detail: (id: string) => [...saleKeys.details(), id] as const,
  report: (from: string, to: string) => [...saleKeys.all, 'report', from, to] as const,
}

export function useSales(params: GetSalesParams = {}) {
  return useQuery({
    queryKey: saleKeys.list(params),
    queryFn: () => salesService.getAll(params),
  })
}

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: saleKeys.detail(id!),
    queryFn: () => salesService.getById(id!),
    enabled: !!id,
  })
}

export function useCreateSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSaleRequest) => salesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: saleKeys.lists() })
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useSalesReport(from: string, to: string) {
  return useQuery({
    queryKey: saleKeys.report(from, to),
    queryFn: () => salesService.getReport(from, to),
    enabled: !!from && !!to,
  })
}
