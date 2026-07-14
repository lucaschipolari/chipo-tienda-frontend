// ─── Products ─────────────────────────────────────────────────────────────────

export type ProductStatus = 'Draft' | 'Published' | 'Discontinued'

export interface ProductVariant {
  id: string
  productId: string
  sku: string
  barcode?: string
  attributes: Record<string, string>
  price?: number
  compareAtPrice?: number
  cost?: number
  currency: string
  stockQuantity: number
  minStockThreshold: number
  displayOrder?: number
  isActive: boolean
  isBelowMinStock: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductImage {
  id: string
  url: string
  altText?: string
  displayOrder: number
}

export interface OlfactoryProfile {
  topNotes: string[]
  heartNotes: string[]
  baseNotes: string[]
  intensity?: number | null   // 1–5
  longevity?: string | null   // ej "6-8 horas"
  seasons: string[]           // Primavera, Verano, Otoño, Invierno
  occasions: string[]         // Día, Noche, Formal, Casual
}

export interface Product {
  id: string
  categoryId: string
  categoryName?: string
  name: string
  slug: string
  description?: string
  sku: string
  basePrice: number
  compareAtPrice?: number
  currency: string
  status: ProductStatus
  isFeatured: boolean
  tags: string[]
  olfactory: OlfactoryProfile
  variants: ProductVariant[]
  images: ProductImage[]
  totalStock: number
  // Decant (por ml)
  isDecant?: boolean
  stockMl?: number
  bottleCost?: number | null
  bottleMl?: number | null
  reorderMl?: number
  costPerMl?: number | null
  createdAt: string
  updatedAt: string
}

export interface ProductListItem {
  id: string
  categoryId: string
  categoryName?: string
  name: string
  slug: string
  sku: string
  basePrice: number
  compareAtPrice?: number
  currency: string
  status: ProductStatus
  isFeatured: boolean
  totalStock: number
  variantCount: number
  defaultVariantId?: string
  defaultVariantStock: number
  mainImageUrl?: string
  description?: string
  notes?: string[]
  cost?: number
  createdAt: string
  updatedAt: string
}

// Request DTOs
export interface CreateVariantRequest {
  sku: string
  attributes: Record<string, string>
  initialStock?: number
  price?: number
  compareAtPrice?: number
  cost?: number
  minStockThreshold?: number
}

export interface CreateProductRequest {
  categoryId: string
  name: string
  slug?: string
  sku: string
  basePrice: number
  currency: string
  compareAtPrice?: number
  description?: string
  isFeatured: boolean
  tags: string[]
  initialVariants: CreateVariantRequest[]
  olfactory?: OlfactoryProfile
  imageUrls?: string[]
}

export interface UpdateProductRequest {
  id: string
  categoryId: string
  name: string
  slug: string
  basePrice: number
  currency: string
  compareAtPrice?: number
  description?: string
  isFeatured: boolean
  tags: string[]
  olfactory?: OlfactoryProfile
}

export interface AddVariantRequest {
  productId: string
  sku: string
  attributes: Record<string, string>
  initialStock: number
  price?: number
  compareAtPrice?: number
  cost?: number
  currency: string
  minStockThreshold: number
}

export interface UpdateVariantRequest {
  productId: string
  variantId: string
  price?: number
  compareAtPrice?: number
  cost?: number
  currency: string
  minStockThreshold: number
  isActive: boolean
  attributes?: Record<string, string>
  displayOrder?: number
}

// ─── Categories ───────────────────────────────────────────────────────────────

export interface Category {
  id: string
  parentCategoryId?: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  displayOrder: number
  isActive: boolean
  productCount: number
  subCategories: Category[]
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryRequest {
  name: string
  slug?: string
  parentCategoryId?: string
  description?: string
  imageUrl?: string
  displayOrder: number
}

export interface UpdateCategoryRequest {
  id: string
  name: string
  slug: string
  parentCategoryId?: string
  description?: string
  imageUrl?: string
  displayOrder: number
  isActive: boolean
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export type MovementType =
  | 'Initial'
  | 'PurchaseReceipt'
  | 'SaleOut'
  | 'OrderReservation'
  | 'OrderRelease'
  | 'ManualAdjustment'
  | 'Return'
  | 'Damage'

export interface StockMovement {
  id: string
  productId: string
  productName: string
  variantId: string
  variantSku: string
  variantAttributes: Record<string, string>
  movementType: MovementType
  quantity: number
  stockBefore: number
  stockAfter: number
  reason?: string
  referenceType?: string
  referenceId?: string
  createdByUserId?: string
  createdAt: string
}

export interface LowStockItem {
  productId: string
  productName: string
  productSlug: string
  variantId: string
  variantSku: string
  attributes: Record<string, string>
  stockQuantity: number
  minStockThreshold: number
  deficit: number
}

export interface AdjustStockRequest {
  productId: string
  variantId: string
  newQuantity: number
  reason: string
}
