import { Link, useLocation } from 'react-router-dom'
import { Bell, ChevronRight, LogOut, Menu, User } from 'lucide-react'
import { cn } from '@/utils/helpers/cn'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useNotificationsStore } from '@/store/notificationsStore'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { getInitials } from '@/utils/formatters/text'
import { useState, useRef, useEffect } from 'react'

// ─── Breadcrumb automático ─────────────────────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  products: 'Productos',
  categories: 'Categorías',
  inventory: 'Inventario',
  movements: 'Movimientos',
  orders: 'Pedidos',
  sales: 'Ventas',
  customers: 'Clientes',
  purchases: 'Compras',
  suppliers: 'Proveedores',
  expenses: 'Gastos',
  finances: 'Finanzas',
  reports: 'Reportes',
  discounts: 'Descuentos',
  coupons: 'Cupones',
  users: 'Usuarios',
  roles: 'Roles',
  settings: 'Configuración',
  new: 'Nuevo',
  edit: 'Editar',
}

function useBreadcrumbs() {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)

  return parts
    .map((part, idx) => ({
      label: ROUTE_LABELS[part] ?? part,
      href: '/' + parts.slice(0, idx + 1).join('/'),
      isLast: idx === parts.length - 1,
    }))
    .filter((b) => b.label !== 'Admin') // ocultar el segmento "admin"
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function Navbar() {
  const { toggleSidebar, toggleMobileMenu } = useUiStore()
  const user = useAuthStore((s) => s.user)
  const unreadCount = useNotificationsStore((s) => s.unreadCount)
  const breadcrumbs = useBreadcrumbs()
  const { logout: handleLogout, isLoggingOut } = useLogout()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-navbar h-navbar',
        'flex items-center justify-between px-4 gap-4',
        'border-b border-neutral-800',
        'transition-all duration-200',
      )}
      style={{ left: 'var(--sidebar-width, 240px)', background: 'var(--bg)' }}
    >
      {/* ── Izquierda: hamburger + breadcrumb ── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger mobile */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-neutral-600 hover:text-white hover:bg-obsidian-800 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Toggle sidebar (desktop) */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:block p-1.5 rounded-lg text-neutral-600 hover:text-white hover:bg-obsidian-800 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb */}
        <nav className="hidden sm:flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {!crumb.isLast ? (
                <>
                  <Link
                    to={crumb.href}
                    className="text-neutral-500 hover:text-neutral-300 transition-colors truncate max-w-32"
                  >
                    {crumb.label}
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-700 shrink-0" />
                </>
              ) : (
                <span className="font-medium text-white truncate max-w-48">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* ── Derecha: notificaciones + usuario ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notificaciones */}
        <button className="relative p-2 rounded-xl text-neutral-500 hover:text-white hover:bg-obsidian-800 transition-colors">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-gold-500" />
          )}
        </button>

        {/* Menú de usuario */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl text-neutral-300 hover:bg-obsidian-800 transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-gold-500 text-black text-xs font-semibold flex items-center justify-center">
              {user ? getInitials(user.fullName) : '?'}
            </div>
            <span className="hidden md:block text-sm font-medium max-w-32 truncate">
              {user?.fullName}
            </span>
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-neutral-800 overflow-hidden shadow-lg z-50"
              style={{ background: 'var(--surface)' }}
            >
              <div className="px-4 py-3 border-b border-neutral-800">
                <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  to="/admin/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-400 hover:text-white hover:bg-obsidian-800 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Mi perfil
                </Link>
                <button
                  onClick={() => handleLogout()}
                  disabled={isLoggingOut}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-400 hover:text-danger-400 hover:bg-obsidian-800 w-full text-left transition-colors disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
