import { httpClient } from '@/services/http/httpClient'
import { privateClient } from '@/services/http/httpClient'
import type {
  SalesReport,
  InventoryReport,
  PurchasesReport,
  ExpensesReport,
  ReportFilter,
  ReportType,
  ReportFormat,
} from '@/types/report.types'

const BASE = '/reports'

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export const reportsService = {
  getSalesReport: (filter: ReportFilter = {}): Promise<SalesReport> =>
    httpClient.get<SalesReport>(`${BASE}/sales`, filter as Record<string, unknown>),

  getInventoryReport: (categoryId?: string, status?: string): Promise<InventoryReport> => {
    const params: Record<string, unknown> = {}
    if (categoryId) params.categoryId = categoryId
    if (status) params.status = status
    return httpClient.get<InventoryReport>(`${BASE}/inventory`, params)
  },

  getPurchasesReport: (filter: ReportFilter = {}): Promise<PurchasesReport> =>
    httpClient.get<PurchasesReport>(`${BASE}/purchases`, filter as Record<string, unknown>),

  getExpensesReport: (filter: ReportFilter = {}): Promise<ExpensesReport> =>
    httpClient.get<ExpensesReport>(`${BASE}/expenses`, filter as Record<string, unknown>),

  exportReport: async (
    reportType: ReportType,
    format: ReportFormat,
    filter: ReportFilter = {},
  ): Promise<void> => {
    const response = await privateClient.post(
      `${BASE}/export`,
      { reportType, format, ...filter },
      { responseType: 'blob' },
    )
    const blob = response.data as Blob
    if (format === 'pdf') {
      // El backend genera HTML imprimible: se abre en una pestaña para imprimir/guardar como PDF
      const url = URL.createObjectURL(new Blob([blob], { type: 'text/html' }))
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      return
    }
    const extension = format === 'excel' ? 'xlsx' : format
    const filename = `${reportType}-report.${extension}`
    triggerDownload(blob, filename)
  },
}
