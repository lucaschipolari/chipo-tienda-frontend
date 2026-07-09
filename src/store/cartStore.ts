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
  /** Stock disponible al momento de agregar — tope para los controles de cantidad */
  maxStock?: number
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

const HARD_QTY_CAP = 99

function clampQty(quantity: number, maxStock?: number): number {
  const cap = Math.min(HARD_QTY_CAP, maxStock ?? HARD_QTY_CAP)
  return Math.min(Math.max(1, quantity), Math.max(1, cap))
}

// ─── Cálculo de totales ────────────────────────────────────────────────────────

function calculateTotals(
  items: CartItem[],
  couponDiscount: number,
): CartTotals {
  const currency = items[0]?.currency ?? 'ARS'
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
  currency: 'ARS',
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
                ? {
                    ...i,
                    maxStock: newItem.maxStock ?? i.maxStock,
                    quantity: clampQty(i.quantity + (newItem.quantity ?? 1), newItem.maxStock ?? i.maxStock),
                  }
                : i,
            )
          } else {
            updatedItems = [
              ...items,
              { ...newItem, quantity: clampQty(newItem.quantity ?? 1, newItem.maxStock) },
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
            i.variantId === variantId ? { ...i, quantity: clampQty(quantity, i.maxStock) } : i,
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
