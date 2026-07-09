export type ReportFormat = 'excel' | 'csv' | 'pdf'
export type ReportType = 'sales' | 'inventory' | 'purchases' | 'expenses' | 'financial'

export interface ReportFilter {
  from?: string
  to?: string
  categoryId?: string
  status?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface SalesReportRow {
  saleNumber: string
  buyerName: string
  customerName?: string
  channel: string
  paymentMethod: string
  subtotal: number
  discount: number
  tax: number
  total: number
  currency: string
  itemCount: number
  date: string
}

export interface SalesReport {
  rows: SalesReportRow[]
  totalCount: number
  totalRevenue: number
  totalDiscount: number
  totalTax: number
  generatedAt: string
}

export interface InventoryReportRow {
  sku: string
  productName: string
  variantName: string
  category: string
  currentStock: number
  minStock: number
  unitCost: number
  totalValue: number
  status: 'OK' | 'Critical' | 'OutOfStock'
}

export interface InventoryReport {
  rows: InventoryReportRow[]
  totalProducts: number
  outOfStock: number
  critical: number
  totalValue: number
}

export interface PurchasesReportRow {
  purchaseNumber: string
  supplierName: string
  status: string
  itemCount: number
  subtotal: number
  total: number
  currency: string
  date: string
}

export interface PurchasesReport {
  rows: PurchasesReportRow[]
  totalCount: number
  totalSpent: number
}

export interface ExpensesReportRow {
  category: string
  date: string
  amount: number
  currency: string
  description: string
  status: string
}

export interface ExpensesReport {
  rows: ExpensesReportRow[]
  totalCount: number
  totalAmount: number
}

export interface ExportReportRequest {
  reportType: ReportType
  format: ReportFormat
  filter?: ReportFilter
}
