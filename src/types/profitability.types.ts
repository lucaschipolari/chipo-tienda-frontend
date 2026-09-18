export type ProfitabilityStatus = 'Optimo' | 'Bajo' | 'Critico' | 'SinDatos'

export interface ProfitabilityRow {
  productId: string
  variantId: string
  productName: string
  categoryId: string
  brand?: string
  sku: string
  variantLabel?: string
  isDecant: boolean
  currency: string
  salePrice?: number
  lastCost?: number
  previousCost?: number
  costChangeAbs?: number
  costChangePct?: number
  profit?: number
  marginPct?: number
  targetMarginPct: number
  targetIsCustom: boolean
  targetSource: 'product' | 'category' | 'general'
  suggestedPrice?: number
  priceDifference?: number
  status: ProfitabilityStatus
}

export interface ProfitabilitySummary {
  totalAnalyzed: number
  optimo: number
  bajo: number
  critico: number
  sinDatos: number
  costIncreased: number
  needsPriceReview: number
}

export interface CostHistoryEntry {
  id: string
  unitCost: number
  currency: string
  source: string
  purchaseOrderId?: string
  recordedAt: string
  changeAbs?: number
  changePct?: number
}

export interface ProductProfitabilityDetail {
  analysis: ProfitabilityRow
  history: CostHistoryEntry[]
}

export interface CategoryMargin {
  categoryId: string
  targetMarginPct: number
}

export interface ProfitabilitySettings {
  targetMarginPct: number
  criticalBandPct: number
  roundingStep: number
  roundingMode: 'nearest' | 'up' | 'down'
}

export interface GetProfitabilityParams {
  categoryId?: string
  status?: string
  search?: string
  costIncreased?: boolean
  belowSuggested?: boolean
  minMargin?: number
  maxMargin?: number
  sortBy?: 'margin' | 'lastCost' | 'costChange' | 'priceDiff'
  sortDir?: 'asc' | 'desc'
}
