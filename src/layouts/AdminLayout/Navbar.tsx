import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, LogOut, Menu, User } from 'lucide-react'
import { cn } from '@/utils/helpers/cn'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useNotificationsStore } from '@/store/notificationsStore'
import { tokenStorage } from '@/services/storage/tokenStorage'
import { queryClient } from '@/app/queryClient'
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
  const logout = useAuthStore((s) => s.logout)
  const unreadCount = useNotificationsStore((s) => s.unreadCount)
  const breadcrumbs = useBreadcrumbs()
  const navigate = useNavigate()
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

  const handleLogout = () => {
    logout()
    queryClient.clear()
    tokenStorage.clearRefreshToken()
    navigate('/login', { replace: true })
  }

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-navbar h-navbar',
        'flex items-center justify-between px-4 gap-4',
        'bg-white border-b border-neutral-200 shadow-xs',
        'transition-all duration-200',
        // El ancho se calcula dinámicamente en AdminLayout para compensar el sidebar
      )}
      style={{ left: 'var(--sidebar-width, 240px)' }}
    >
      {/* ── Izquierda: hamburger + breadcrumb ── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger mobile */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Toggle sidebar (desktop) */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:block p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100"
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
                    className="text-neutral-500 hover:text-neutral-800 transition-colors truncate max-w-32"
                  >
                    {crumb.label}
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                </>
              ) : (
                <span className="font-medium text-neutral-800 truncate max-w-48">
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
        <button className="relative p-2 rounded-md text-neutral-500 hover:bg-neutral-100 transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Menú de usuario */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-primary-600 text-white text-sm font-semibold flex items-center justify-center">
              {user ? getInitials(user.fullName) : '?'}
            </div>
            <span className="hidden md:block text-sm font-medium text-neutral-700 max-w-32 truncate">
              {user?.fullName}
            </span>
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 animate-slide-in-up z-50">
              <div className="px-4 py-2 border-b border-neutral-100">
                <p className="text-sm font-medium text-neutral-800 truncate">{user?.fullName}</p>
                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
              </div>
              <Link
                to="/admin/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                onClick={() => setUserMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                Mi perfil
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 w-full text-left transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
