import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'

// ─── Tipos del carrito ────────────────────────────────────────────────────────

export interface CartItem {
  productId: string
  variantId: string
  productName: string
  variantName: string
  imageUrl?: string
  unitPrice: number
  currency: string
  quantity: number
}

export interface CartTotals {
  subtotal: number
  discountAmount: number
  shipping: number
  total: number
  currency: string
}

interface CartState {
  items: CartItem[]
  couponCode: string | null
  couponDiscount: number
  totals: CartTotals
}

interface CartActions {
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  applyCoupon: (code: string, discount: number) => void
  removeCoupon: () => void
  clearCart: () => void
}

type CartStore = CartState & CartActions

// ─── Cálculo de totales ────────────────────────────────────────────────────────

function calculateTotals(
  items: CartItem[],
  couponDiscount: number,
): CartTotals {
  const currency = items[0]?.currency ?? 'PEN'
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  )
  const shipping = subtotal > 0 ? 0 : 0 // lógica de envío se completa en checkout
  const total = Math.max(0, subtotal - couponDiscount + shipping)

  return {
    subtotal,
    discountAmount: couponDiscount,
    shipping,
    total,
    currency,
  }
}

const DEFAULT_TOTALS: CartTotals = {
  subtotal: 0,
  discountAmount: 0,
  shipping: 0,
  total: 0,
  currency: 'PEN',
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ─── State ────────────────────────────────────────────────────
        items: [],
        couponCode: null,
        couponDiscount: 0,
        totals: DEFAULT_TOTALS,

        // ─── Actions ──────────────────────────────────────────────────

        addItem: (newItem) => {
          const { items, couponDiscount } = get()
          const existing = items.find((i) => i.variantId === newItem.variantId)

          let updatedItems: CartItem[]

          if (existing) {
            updatedItems = items.map((i) =>
              i.variantId === newItem.variantId
                ? { ...i, quantity: i.quantity + (newItem.quantity ?? 1) }
                : i,
            )
          } else {
            updatedItems = [
              ...items,
              { ...newItem, quantity: newItem.quantity ?? 1 },
            ]
          }

          set(
            {
              items: updatedItems,
              totals: calculateTotals(updatedItems, couponDiscount),
            },
            false,
            'cart/addItem',
          )
        },

        removeItem: (variantId) => {
          const { couponDiscount } = get()
          const updatedItems = get().items.filter(
            (i) => i.variantId !== variantId,
          )
          set(
            {
              items: updatedItems,
              totals: calculateTotals(updatedItems, couponDiscount),
            },
            false,
            'cart/removeItem',
          )
        },

        updateQuantity: (variantId, quantity) => {
          const { couponDiscount } = get()
          if (quantity <= 0) {
            get().removeItem(variantId)
            return
          }
          const updatedItems = get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i,
          )
          set(
            {
              items: updatedItems,
              totals: calculateTotals(updatedItems, couponDiscount),
            },
            false,
            'cart/updateQuantity',
          )
        },

        applyCoupon: (code, discount) => {
          const { items } = get()
          set(
            {
              couponCode: code,
              couponDiscount: discount,
              totals: calculateTotals(items, discount),
            },
            false,
            'cart/applyCoupon',
          )
        },

        removeCoupon: () => {
          const { items } = get()
          set(
            {
              couponCode: null,
              couponDiscount: 0,
              totals: calculateTotals(items, 0),
            },
            false,
            'cart/removeCoupon',
          )
        },

        clearCart: () => {
          set(
            {
              items: [],
              couponCode: null,
              couponDiscount: 0,
              totals: DEFAULT_TOTALS,
            },
            false,
            'cart/clear',
          )
        },
      }),
      {
        name: 'chipo_cart',
        storage: createJSONStorage(() => localStorage),
        // Solo persistir items y cupón — los totales se recalculan
        partialize: (state) => ({
          items: state.items,
          couponCode: state.couponCode,
          couponDiscount: state.couponDiscount,
        }),
        // Rehidratar totales tras cargar desde storage
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.totals = calculateTotals(state.items, state.couponDiscount)
          }
        },
      },
    ),
    { name: 'CartStore' },
  ),
)

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectCartItemCount = (state: CartStore) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0)

export const selectCartTotals = (state: CartStore) => state.totals
export const selectCartItems = (state: CartStore) => state.items
