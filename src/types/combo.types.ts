export interface ComboItem {
  productId: string
  variantId: string
  productName: string
  variantLabel: string
  quantity: number
  unitPrice: number
  isDecant: boolean
  imageUrl?: string | null
}

export interface Combo {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  price: number
  originalTotal: number
  currency: string
  isActive: boolean
  itemCount: number
  items: ComboItem[]
  createdAt: string
}

export interface ComboItemRequest {
  productId: string
  variantId: string
  quantity: number
}

export interface CreateComboRequest {
  name: string
  description?: string
  imageUrl?: string
  price: number
  currency: string
  items: ComboItemRequest[]
}
