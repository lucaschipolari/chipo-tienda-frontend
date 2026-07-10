import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/helpers/cn'

/**
 * AdminLayout — Shell del panel administrativo.
 *
 * Estructura:
 *   [Sidebar fixed] [Navbar fixed top] [<Outlet /> scrollable]
 *
 * La variable CSS --sidebar-width se actualiza en tiempo real para
 * que la Navbar ajuste su posición sin duplicar lógica.
 */
export function AdminLayout() {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed)
  const sidebarWidth = sidebarCollapsed ? '60px' : '240px'

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg)', '--sidebar-width': sidebarWidth } as React.CSSProperties}
    >
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />

      {/* Navbar fija arriba — su left se sincroniza con el sidebar via CSS var */}
      <Navbar />

      {/* Contenido principal — empujado por el sidebar y la navbar */}
      <main
        className={cn(
          'transition-all duration-200',
          'pt-navbar min-h-content', // compensa altura del navbar
          'overflow-x-hidden',       // evita scroll horizontal (gráficos/tablas anchas)
          // En desktop: margen izquierdo del ancho del sidebar
          sidebarCollapsed
            ? 'lg:pl-[60px]'
            : 'lg:pl-[240px]',
        )}
      >
        <div className="min-w-0 p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
