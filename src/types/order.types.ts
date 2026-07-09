export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Paid'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded'

export type DeliveryMethod = 'Delivery' | 'Pickup'

export type PaymentMethod = 'Cash' | 'Card' | 'Transfer' | 'QR' | 'Mixed'

export interface OrderAddress {
  street: string
  city: string
  state?: string
  postalCode?: string
  country: string
}

export interface OrderItem {
  id: string
  productId: string
  variantId: string
  productName: string
  variantDescription: string
  sku: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
  currency: string
}

export interface OrderStatusHistoryEntry {
  fromStatus?: OrderStatus
  toStatus: OrderStatus
  note?: string
  changedByUserId?: string
  changedAt: string
}

export interface Order {
  id: string
  orderNumber: string
  customerId?: string
  customerName?: string
  buyerName: string
  buyerEmail: string
  buyerPhone?: string
  status: OrderStatus
  shippingAddress: OrderAddress
  billingAddress?: OrderAddress
  subtotal: number
  discountAmount: number
  shippingCost: number
  taxAmount: number
  total: number
  currency: string
  paymentMethod?: PaymentMethod
  deliveryMethod?: DeliveryMethod
  couponCode?: string
  notes?: string
  cancelReason?: string
  paidAt?: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
  items: OrderItem[]
  statusHistory: OrderStatusHistoryEntry[]
  createdAt: string
  updatedAt: string
}

export interface OrderListItem {
  id: string
  orderNumber: string
  customerId?: string
  buyerName: string
  buyerEmail: string
  status: OrderStatus
  itemCount: number
  total: number
  currency: string
  paymentMethod?: PaymentMethod
  createdAt: string
}

export interface CreateOrderItemRequest {
  productId: string
  variantId: string
  quantity: number
  unitPriceOverride?: number
  discount?: number
}

export interface CreateOrderAddressRequest {
  street: string
  city: string
  state?: string
  postalCode?: string
  country: string
}

export interface CreateOrderRequest {
  customerId?: string
  buyerName: string
  buyerEmail: string
  buyerPhone?: string
  items: CreateOrderItemRequest[]
  shippingAddress: CreateOrderAddressRequest
  billingAddress?: CreateOrderAddressRequest
  shippingCost?: number
  currency: string
  paymentMethod?: PaymentMethod
  deliveryMethod?: DeliveryMethod
  notes?: string
}

export interface GetOrdersParams {
  page?: number
  pageSize?: number
  customerId?: string
  status?: OrderStatus | string
  from?: string
  to?: string
  search?: string
  email?: string
}
