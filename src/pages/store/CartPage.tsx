import { useEffect } from 'react'
import { useUiStore } from '@/store/uiStore'
import { Navigate } from 'react-router-dom'

/**
 * CartPage — Redirige al home y abre el drawer del carrito.
 *
 * La experiencia principal es el drawer lateral. Esta página existe
 * para que la URL /cart funcione (links directos, bookmarks).
 */
export default function CartPage() {
  const openCartDrawer = useUiStore((s) => s.openCartDrawer)

  useEffect(() => {
    // Abrir el drawer después del render del layout
    const timer = setTimeout(openCartDrawer, 50)
    return () => clearTimeout(timer)
  }, [openCartDrawer])

  return <Navigate to="/" replace />
}
