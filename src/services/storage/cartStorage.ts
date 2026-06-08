/**
 * Cart Storage
 * Persiste el carrito en localStorage para que sobreviva recargas.
 * El store de Zustand lo usa para hidratación inicial.
 */

const CART_KEY = 'chipo_cart'

export interface PersistedCartItem {
  productId: string
  variantId: string
  productName: string
  variantName: string
  imageUrl?: string
  unitPrice: number
  currency: string
  quantity: number
}

export interface PersistedCart {
  items: PersistedCartItem[]
  couponCode?: string
  savedAt: string
}

export const cartStorage = {
  get(): PersistedCart | null {
    try {
      const raw = localStorage.getItem(CART_KEY)
      if (!raw) return null
      return JSON.parse(raw) as PersistedCart
    } catch {
      return null
    }
  },

  set(cart: Omit<PersistedCart, 'savedAt'>): void {
    try {
      const data: PersistedCart = { ...cart, savedAt: new Date().toISOString() }
      localStorage.setItem(CART_KEY, JSON.stringify(data))
    } catch {
      // localStorage puede estar lleno o bloqueado
    }
  },

  clear(): void {
    localStorage.removeItem(CART_KEY)
  },
}
