import { Outlet } from 'react-router-dom'
import { StoreHeader } from './StoreHeader'
import { StoreFooter } from './StoreFooter'

/**
 * StoreLayout — Shell de la tienda online pública.
 *
 * Estructura: [Header sticky] [<Outlet />] [Footer]
 */
export function StoreLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <StoreHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <StoreFooter />
    </div>
  )
}
