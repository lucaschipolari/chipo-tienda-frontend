import { useLocation } from 'react-router-dom'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { useCartStore, selectCartItemCount, selectCartTotals } from '@/store/cartStore'
import { useUiStore } from '@/store/uiStore'
import { formatMoney } from '@/utils/helpers/formatMoney'

/**
 * FloatingCartBar — barra fija inferior (estilo Pency) que aparece cuando hay
 * productos en el carrito. Un toque abre el drawer para finalizar. Se oculta en
 * el checkout (donde el resumen ya está presente) y si el carrito está vacío.
 */
export function FloatingCartBar() {
  const count = useCartStore(selectCartItemCount)
  const totals = useCartStore(selectCartTotals)
  const openCartDrawer = useUiStore(s => s.openCartDrawer)
  const cartDrawerOpen = useUiStore(s => s.cartDrawerOpen)
  const { pathname } = useLocation()

  const hidden = count === 0 || cartDrawerOpen || pathname.startsWith('/checkout')
  if (hidden) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button
        onClick={openCartDrawer}
        className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-white px-5 py-3.5 text-black shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7)] ring-1 ring-black/5 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99] animate-slide-up"
      >
        <span className="flex items-center gap-2.5">
          <span className="relative">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
              {count}
            </span>
          </span>
          <span className="text-sm font-semibold">Ver pedido</span>
        </span>
        <span className="flex items-center gap-2 text-sm font-semibold tabular-nums">
          ${formatMoney(totals.total)}
          <ArrowRight className="h-4 w-4" />
        </span>
      </button>
    </div>
  )
}
