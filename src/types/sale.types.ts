export type SaleChannel = 'InStore' | 'Phone' | 'WhatsApp' | 'Other'
export type PaymentMethod = 'Cash' | 'Card' | 'Transfer' | 'QR' | 'Mixed'

export interface SaleItem {
  id: string
  productId: string
  variantId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
  unitCost: number
  totalCost: number
  profit: number
  currency: string
}

export interface Sale {
  id: string
  saleNumber: string
  customerId?: string
  customerName?: string
  soldByUserId: string
  soldByUserName?: string
  channel: SaleChannel
  subtotal: number
  discountAmount: number
  total: number
  totalCost: number
  profit: number
  currency: string
  paymentMethod: string
  notes?: string
  items: SaleItem[]
  createdAt: string
}

export interface SaleListItem {
  id: string
  saleNumber: string
  customerId?: string
  customerName?: string
  channel: SaleChannel
  itemCount: number
  total: number
  currency: string
  paymentMethod: string
  createdAt: string
}

export interface CreateSaleItemRequest {
  productId: string
  variantId: string
  quantity: number
  unitPrice: number
  discount?: number
}

export interface CreateSaleRequest {
  customerId?: string
  customerName?: string
  items: CreateSaleItemRequest[]
  paymentMethod: string
  channel: SaleChannel
  currency: string
  notes?: string
}

export interface GetSalesParams {
  page?: number
  pageSize?: number
  customerId?: string
  from?: string
  to?: string
}

// Reportes
export interface DailyRevenue {
  date: string
  revenue: number
  salesCount: number
}

export interface TopProduct {
  productId: string
  productName: string
  totalQuantity: number
  totalRevenue: number
}

export interface TopCustomer {
  customerId: string
  customerName: string
  totalOrders: number
  totalSpent: number
}

export interface SalesReport {
  from: string
  to: string
  totalSales: number
  totalRevenue: number
  totalCost: number
  totalProfit: number
  averageTicket: number
  revenueVsPreviousPeriod: number
  byDay: DailyRevenue[]
  topProducts: TopProduct[]
  topCustomers: TopCustomer[]
}
