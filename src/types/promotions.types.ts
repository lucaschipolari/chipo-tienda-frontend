export type DiscountType = 'Percentage' | 'FixedAmount'
export type DiscountAppliesTo = 'Product' | 'Category' | 'Order' | 'Cart' | 'Customer'
export type PromotionType = 'Product' | 'Category' | 'BuyXGetY' | 'MinAmount' | 'Combo' | 'Flash' | 'HappyHour'
export type CouponType = 'Percentage' | 'FixedAmount' | 'FreeShipping'
export type RestrictionType = 'Product' | 'Category' | 'Customer'

export interface DiscountListItem {
  id: string
  name: string
  description?: string
  type: DiscountType
  appliesTo: DiscountAppliesTo
  value: number
  currency: string
  isActive: boolean
  isStackable: boolean
  priority: number
  startsAt?: string
  endsAt?: string
  usageCount: number
  maxUsage?: number
  createdAt: string
}

export interface DiscountDetail extends DiscountListItem {
  targetIds: string[]
  minOrderAmount?: number
  maxDiscountAmount?: number
  minQuantity?: number
  updatedAt: string
}

export interface CreateDiscountRequest {
  name: string
  type: string
  value: number
  appliesTo: string
  description?: string
  currency: string
  targetIds?: string[]
  minOrderAmount?: number
  maxDiscountAmount?: number
  minQuantity?: number
  startsAt?: string
  endsAt?: string
  isStackable: boolean
  priority: number
  maxUsage?: number
}

export type UpdateDiscountRequest = CreateDiscountRequest & { id: string }

export interface PromotionListItem {
  id: string
  name: string
  description?: string
  type: PromotionType
  badge?: string
  discountType: DiscountType
  discountValue: number
  currency: string
  isActive: boolean
  isStackable: boolean
  priority: number
  startsAt: string
  endsAt?: string
  createdAt: string
}

export interface PromotionDetail extends PromotionListItem {
  activeFrom?: string
  activeUntil?: string
  buyQuantity?: number
  getQuantity?: number
  minOrderAmount?: number
  comboPrice?: number
  productIds: string[]
  categoryIds: string[]
  updatedAt: string
}

export interface CreatePromotionRequest {
  name: string
  type: string
  discountType: string
  discountValue: number
  startsAt: string
  endsAt?: string
  description?: string
  badge?: string
  currency: string
  isStackable: boolean
  priority: number
  activeFrom?: string
  activeUntil?: string
  buyQuantity?: number
  getQuantity?: number
  minOrderAmount?: number
  comboPrice?: number
  productIds?: string[]
  categoryIds?: string[]
}

export type UpdatePromotionRequest = CreatePromotionRequest & { id: string }

export interface PromotionsDashboard {
  totalActive: number
  totalExpired: number
  totalInactive: number
  flashCount: number
  buyXGetYCount: number
  comboCount: number
  activePromotions: {
    id: string
    name: string
    type: string
    badge?: string
    endsAt?: string
    isStackable: boolean
  }[]
}

export interface CouponListItem {
  id: string
  code: string
  name: string
  description?: string
  type: CouponType
  value: number
  currency: string
  usedCount: number
  usageLimit?: number
  isActive: boolean
  isStackable: boolean
  startsAt?: string
  endsAt?: string
  createdAt: string
}

export interface CouponDetail extends CouponListItem {
  minOrderAmount?: number
  maxDiscountAmount?: number
  usageLimitPerUser?: number
  restrictions: { type: RestrictionType; entityId: string }[]
  updatedAt: string
}

export interface CouponUsage {
  id: string
  customerId?: string
  orderId: string
  discountAmount: number
  usedAt: string
}

export interface CreateCouponRequest {
  code: string
  name: string
  type: string
  value: number
  currency: string
  description?: string
  minOrderAmount?: number
  maxDiscountAmount?: number
  usageLimit?: number
  usageLimitPerUser?: number
  startsAt?: string
  endsAt?: string
  isStackable: boolean
  restrictions?: { type: string; entityId: string }[]
}

export type UpdateCouponRequest = Omit<CreateCouponRequest, 'code'> & { id: string }

export interface ValidateCouponResult {
  isValid: boolean
  errorMessage?: string
  couponType?: string
  discountValue: number
  discountAmount: number
  currency: string
}

export interface PromotionCalculationRequest {
  items: {
    productId: string
    categoryId?: string
    quantity: number
    unitPrice: number
    productName: string
  }[]
  subTotal: number
  currency: string
  couponCode?: string
  customerId?: string
}

export interface PromotionCalculationResult {
  originalTotal: number
  promotionDiscountAmount: number
  couponDiscountAmount: number
  finalTotal: number
  totalSavings: number
  appliedPromotions: {
    id: string
    name: string
    badge?: string
    savedAmount: number
  }[]
  appliedCoupon?: {
    code: string
    type: string
    savedAmount: number
  }
  isValid: boolean
  messages: string[]
}
