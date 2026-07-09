export type PurchaseOrderStatus =
  | 'Draft'
  | 'Sent'
  | 'Approved'
  | 'PartiallyReceived'
  | 'Received'
  | 'Cancelled'

export interface PurchaseOrderItem {
  id: string
  productId: string
  productName?: string
  variantId: string
  variantSku?: string
  quantity: number
  quantityReceived: number
  unitCost: number
  total: number
  currency: string
  isFullyReceived: boolean
}

export interface PurchaseOrder {
  id: string
  purchaseNumber: string
  supplierId: string
  supplierName?: string
  status: PurchaseOrderStatus
  expectedDeliveryDate?: string
  subtotal: number
  taxAmount: number
  total: number
  currency: string
  notes?: string
  items: PurchaseOrderItem[]
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrderListItem {
  id: string
  purchaseNumber: string
  supplierId: string
  supplierName?: string
  status: PurchaseOrderStatus
  itemCount: number
  total: number
  currency: string
  expectedDeliveryDate?: string
  createdAt: string
}

export interface CreatePurchaseOrderItemRequest {
  productId: string
  variantId: string
  quantity: number
  unitCost: number
}

export interface CreatePurchaseOrderRequest {
  supplierId: string
  expectedDeliveryDate?: string
  currency: string
  notes?: string
  items: CreatePurchaseOrderItemRequest[]
}

export interface ReceivePurchaseOrderRequest {
  itemReceipts: Record<string, number>
}

export interface GetPurchaseOrdersParams {
  page?: number
  pageSize?: number
  supplierId?: string
  status?: PurchaseOrderStatus
}
