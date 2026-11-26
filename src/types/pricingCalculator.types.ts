// Espejo de los DTOs de la Calculadora de precios (backend: Features/PricingCalculator).

export type MarginType = 'Percentage' | 'FixedAmount'
export type PricingGroup = 'arabes' | 'disenador' | 'nicho' | 'decants'

export interface GroupMargin {
  group: PricingGroup
  label: string
  marginType: MarginType
  marginValue: number
}

export interface PackagingExtra {
  name: string
  cost: number
}

export interface VialCost {
  ml: number
  cost: number
}

export interface PricingSettings {
  usdtRate: number
  commissionPercentage: number
  commissionFixedStandard: number
  commissionFixedCheap: number
  shippingCost: number
  margins: GroupMargin[]
  /** Costo del frasquito por tamaño: sale de Inventario, la calculadora solo lo lee. */
  vialCosts: VialCost[]
  decantPackagingExtras: PackagingExtra[]
}

export interface DecantVariantPricing {
  variantId: string
  sku: string
  ml: number
  liquidCostArs: number
  packagingArs: number
  costArs: number
  suggestedPriceArs: number
  currentPriceArs: number
  hasPriceDifference: boolean
  profitArs: number
}

export interface ProductPricingItem {
  productId: string
  productName: string
  sku: string
  imageUrl: string | null
  categoryId: string
  categoryName: string
  group: PricingGroup
  isDecant: boolean
  /** false = nunca se cargó en la calculadora: el USD es una estimación desde el costo en pesos. */
  hasEntry: boolean
  currency: string
  costUsdOrigin: number
  percentageCommission: number
  fixedCommission: number
  shippingCost: number
  totalCostUsd: number
  totalCostArs: number
  marginType: MarginType
  marginValue: number
  suggestedPriceArs: number
  currentPriceArs: number
  hasPriceDifference: boolean
  profitArs: number
  updatedAt: string
  bottleCostArs: number | null
  bottleMl: number | null
  costPerMl: number | null
  decantVariants: DecantVariantPricing[]
}

export interface PricingCalculatorOverview {
  settings: PricingSettings
  items: ProductPricingItem[]
}

export interface GetPricingCalculatorParams {
  group?: PricingGroup
  search?: string
}

export interface UpdateProductPricingPayload {
  costUsdOrigin: number
  percentageCommission: number
  fixedCommission: number
  shippingCost: number
  marginType: MarginType
  marginValue: number
}

export interface UpdatePricingSettingsPayload {
  usdtRate?: number
  commissionPercentage?: number
  commissionFixedStandard?: number
  commissionFixedCheap?: number
  shippingCost?: number
  margins?: Pick<GroupMargin, 'group' | 'label' | 'marginType' | 'marginValue'>[]
  decantPackagingExtras?: PackagingExtra[]
}

export interface SetSalePricePayload {
  priceArs?: number
  variantPrices?: { variantId: string; price: number }[]
}
