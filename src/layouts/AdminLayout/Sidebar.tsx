import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tag, Warehouse, ArrowLeftRight,
  ShoppingCart, Truck, Users, UserCheck, DollarSign, BarChart2,
  Percent, Ticket, Settings, ChevronLeft, Menu, CreditCard,
  ClipboardList, Building2,
} from 'lucide-react'
import { cn } from '@/utils/helpers/cn'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { getInitials } from '@/utils/formatters/text'
import type { NavGroup } from '@/types/common.types'

// ─── Definición de navegación ─────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { label: 'Productos',   href: '/admin/products',  icon: Package },
      { label: 'Categorías',  href: '/admin/categories', icon: Tag },
      { label: 'Inventario',  href: '/admin/inventory',  icon: Warehouse },
      { label: 'Movimientos', href: '/admin/inventory/movements', icon: ArrowLeftRight },
    ],
  },
  {
    title: 'Ventas',
    items: [
      { label: 'Pedidos',   href: '/admin/orders',    icon: ClipboardList },
      { label: 'Ventas',    href: '/admin/sales',     icon: ShoppingCart },
      { label: 'Clientes',  href: '/admin/customers', icon: UserCheck },
    ],
  },
  {
    title: 'Compras',
    items: [
      { label: 'Órdenes de Compra', href: '/admin/purchases', icon: Truck },
      { label: 'Proveedores',       href: '/admin/suppliers', icon: Building2 },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { label: 'Gastos',    href: '/admin/expenses',  icon: CreditCard },
      { label: 'Finanzas',  href: '/admin/finances',  icon: DollarSign },
      { label: 'Reportes',  href: '/admin/reports',   icon: BarChart2 },
    ],
  },
  {
    title: 'Promociones',
    items: [
      { label: 'Descuentos', href: '/admin/discounts', icon: Percent },
      { label: 'Cupones',    href: '/admin/coupons',   icon: Ticket },
    ],
  },
  {
    title: 'Configuración',
    items: [
      { label: 'Usuarios',      href: '/admin/users',     icon: Users },
      { label: 'Roles',         href: '/admin/roles',     icon: Settings },
      { label: 'Configuración', href: '/admin/settings',  icon: Settings },
    ],
  },
]

// ─── Componente ───────────────────────────────────────────────────────────────

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  const isActive = (href: string) =>
    location.pathname === href ||
    (href !== '/admin/dashboard' && location.pathname.startsWith(href))

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen fixed top-0 left-0 z-sidebar',
        'bg-secondary-900 text-secondary-100',
        'transition-all duration-200',
        sidebarCollapsed ? 'w-[60px]' : 'w-[240px]',
      )}
    >
      {/* ── Logo / Brand ── */}
      <div className="flex items-center h-navbar border-b border-secondary-700 px-4 shrink-0">
        {!sidebarCollapsed && (
          <span className="text-xl font-bold text-white tracking-tight">
            Chipo
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-1.5 rounded-md text-secondary-400 hover:text-white hover:bg-secondary-700',
            'transition-colors ml-auto',
          )}
          aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {sidebarCollapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* ── Navegación ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-thin">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="mb-2">
            {/* Título del grupo */}
            {group.title && !sidebarCollapsed && (
              <p className="px-4 py-1 text-xs font-semibold uppercase tracking-widest text-secondary-500 select-none">
                {group.title}
              </p>
            )}
            {group.title && sidebarCollapsed && (
              <div className="my-1 mx-3 h-px bg-secondary-700" />
            )}

            {/* Items del grupo */}
            {group.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 mx-2 rounded-lg',
                    'text-sm font-medium transition-colors duration-150',
                    'hover:bg-secondary-700 hover:text-white',
                    active
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-secondary-300',
                    sidebarCollapsed && 'justify-center px-0',
                  )}
                >
                  {Icon && (
                    <Icon className={cn('shrink-0', sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4')} />
                  )}
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {item.badge !== undefined && !sidebarCollapsed && (
                    <span className="ml-auto bg-danger-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Usuario ── */}
      {user && (
        <div className={cn(
          'shrink-0 border-t border-secondary-700 p-3',
          'flex items-center gap-3',
          sidebarCollapsed && 'justify-center',
        )}>
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-600 text-white text-xs font-semibold shrink-0">
            {getInitials(user.fullName)}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
              <p className="text-xs text-secondary-400 truncate">{user.email}</p>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
