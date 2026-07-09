import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { reportsService } from '../reportsService'
import type { ReportFilter, ReportFormat, ReportType } from '@/types/report.types'

export const reportKeys = {
  all: ['reports'] as const,
  sales: (filter: ReportFilter) => [...reportKeys.all, 'sales', filter] as const,
  inventory: (categoryId?: string, status?: string) =>
    [...reportKeys.all, 'inventory', categoryId, status] as const,
  purchases: (filter: ReportFilter) => [...reportKeys.all, 'purchases', filter] as const,
  expenses: (filter: ReportFilter) => [...reportKeys.all, 'expenses', filter] as const,
}

export function useSalesReport(filter: ReportFilter = {}) {
  return useQuery({
    queryKey: reportKeys.sales(filter),
    queryFn: () => reportsService.getSalesReport(filter),
  })
}

export function useInventoryReport(categoryId?: string, status?: string) {
  return useQuery({
    queryKey: reportKeys.inventory(categoryId, status),
    queryFn: () => reportsService.getInventoryReport(categoryId, status),
  })
}

export function usePurchasesReport(filter: ReportFilter = {}) {
  return useQuery({
    queryKey: reportKeys.purchases(filter),
    queryFn: () => reportsService.getPurchasesReport(filter),
  })
}

export function useExpensesReport(filter: ReportFilter = {}) {
  return useQuery({
    queryKey: reportKeys.expenses(filter),
    queryFn: () => reportsService.getExpensesReport(filter),
  })
}

export function useExportReport() {
  return useMutation({
    mutationFn: ({
      reportType,
      format,
      filter,
    }: {
      reportType: ReportType
      format: ReportFormat
      filter?: ReportFilter
    }) => reportsService.exportReport(reportType, format, filter),
    onSuccess: () => {
      toast.success('Reporte exportado correctamente')
    },
    onError: () => {
      toast.error('Error al exportar el reporte')
    },
  })
}
