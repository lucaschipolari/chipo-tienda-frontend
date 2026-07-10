import { Outlet } from 'react-router-dom'
import { StoreHeader } from './StoreHeader'
import { StoreFooter } from './StoreFooter'
import { CartDrawer } from '@/features/cart/CartDrawer'
import { FloatingCartBar } from '@/features/cart/FloatingCartBar'
import { ProductQuickView } from '@/components/store/ProductQuickView'

/**
 * StoreLayout — Shell de la tienda online pública.
 *
 * Estructura: [Header sticky] [<Outlet />] [Footer] + CartDrawer (portal)
 */
export function StoreLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <StoreHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <StoreFooter />

      {/* Cart Drawer — montado aquí para estar disponible en toda la tienda */}
      <CartDrawer />

      {/* Barra de carrito flotante (estilo Pency) */}
      <FloatingCartBar />

      {/* Modal de detalle de producto (quick-view) */}
      <ProductQuickView />
    </div>
  )
}
