import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tag, Warehouse, ArrowLeftRight,
  ShoppingCart, Truck, Users, DollarSign, BarChart2,
  Percent, Ticket, Settings, ChevronLeft, Menu, CreditCard,
  ClipboardList, Building2, UserCheck,
} from 'lucide-react'
import { cn } from '@/utils/helpers/cn'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { Avatar } from '@/components/ui/Avatar/Avatar'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  /** Si se especifica, solo se muestra cuando el flag de permiso es true */
  permission?: keyof ReturnType<typeof usePermissions>
}

interface NavGroup {
  title?: string
  items: NavItem[]
  /** Si se especifica, todo el grupo se oculta si el flag es false */
  permission?: keyof ReturnType<typeof usePermissions>
}

// ─── Definición de navegación ─────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Catálogo',
    permission: 'canManageProducts',
    items: [
      { label: 'Productos',   href: '/admin/products',            icon: Package },
      { label: 'Categorías',  href: '/admin/categories',          icon: Tag },
    ],
  },
  {
    title: 'Inventario',
    permission: 'canManageInventory',
    items: [
      { label: 'Stock & Alertas', href: '/admin/inventory',           icon: Warehouse },
      { label: 'Movimientos',     href: '/admin/inventory/movements', icon: ArrowLeftRight },
    ],
  },
  {
    title: 'Ventas',
    items: [
      { label: 'Pedidos',   href: '/admin/orders',         icon: ClipboardList },
      { label: 'Ventas',    href: '/admin/sales',          icon: ShoppingCart },
      { label: 'Reportes',  href: '/admin/sales/reports',  icon: BarChart2, permission: 'canViewFinances' },
      { label: 'Clientes',  href: '/admin/customers',      icon: UserCheck },
    ],
  },
  {
    title: 'Compras',
    permission: 'canManageProducts',
    items: [
      { label: 'Órdenes',     href: '/admin/purchases', icon: Truck },
      { label: 'Proveedores', href: '/admin/suppliers', icon: Building2 },
    ],
  },
  {
    title: 'Finanzas',
    permission: 'canViewFinances',
    items: [
      { label: 'Gastos',   href: '/admin/expenses', icon: CreditCard },
      { label: 'Finanzas', href: '/admin/finance',  icon: DollarSign },
      { label: 'Reportes', href: '/admin/reports',  icon: BarChart2 },
    ],
  },
  {
    title: 'Promociones',
    permission: 'canManageProducts',
    items: [
      { label: 'Descuentos',  href: '/admin/discounts',   icon: Percent },
      { label: 'Promociones', href: '/admin/promotions', icon: Tag },
      { label: 'Cupones',     href: '/admin/coupons',    icon: Ticket },
    ],
  },
  {
    title: 'Configuración',
    permission: 'canManageUsers',
    items: [
      { label: 'Usuarios', href: '/admin/users', icon: Users },
      { label: 'Roles',    href: '/admin/roles', icon: Settings },
    ],
  },
]

// ─── Componente ───────────────────────────────────────────────────────────────

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const permissions = usePermissions()

  const isActive = (href: string) =>
    location.pathname === href ||
    (href !== '/admin/dashboard' && location.pathname.startsWith(href))

  // Filtrar grupos por permisos del usuario
  const visibleGroups = NAV_GROUPS.filter((g) => {
    if (!g.permission) return true
    return !!permissions[g.permission]
  })

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen fixed top-0 left-0 z-sidebar',
        'border-r border-neutral-800',
        'transition-all duration-200',
        sidebarCollapsed ? 'w-[60px]' : 'w-[240px]',
      )}
      style={{ background: 'var(--surface)' }}
    >
      {/* ── Logo ── */}
      <div
        className={cn(
          'flex items-center h-[64px] border-b border-neutral-800 shrink-0',
          sidebarCollapsed ? 'justify-center px-3' : 'px-5',
        )}
      >
        {!sidebarCollapsed && (
          <img src="/chipo-logo.svg" alt="Chipo" className="h-8 w-auto" />
        )}
        {sidebarCollapsed && (
          <span className="font-display text-lg font-medium text-white">C</span>
        )}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="ml-auto p-1.5 rounded-lg text-neutral-600 hover:text-white hover:bg-obsidian-800 transition-colors"
            aria-label="Colapsar sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Toggle colapsado ── */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mt-2 p-1.5 rounded-lg text-neutral-600 hover:text-white hover:bg-obsidian-800 transition-colors"
          aria-label="Expandir sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
      )}

      {/* ── Navegación ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin">
        {visibleGroups.map((group, gIdx) => (
          <div key={gIdx} className="mb-1">
            {/* Título del grupo */}
            {group.title && !sidebarCollapsed && (
              <p className="px-5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600 select-none">
                {group.title}
              </p>
            )}
            {group.title && sidebarCollapsed && (
              <div className="my-1 mx-3 h-px bg-neutral-800" />
            )}

            {group.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              // Filtrar ítems individuales con permiso propio
              if (item.permission && !permissions[item.permission]) return null

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 mx-2 px-3 py-2 rounded-xl',
                    'text-sm transition-all duration-150 select-none',
                    active
                      ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                      : 'text-neutral-500 hover:text-neutral-200 hover:bg-obsidian-800/80 border border-transparent',
                    sidebarCollapsed && 'justify-center px-0 py-2.5',
                  )}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        'shrink-0',
                        sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4',
                        active && 'text-gold-400',
                      )}
                    />
                  )}
                  {!sidebarCollapsed && (
                    <span className={cn('truncate font-medium', active && 'text-gold-400')}>
                      {item.label}
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
        <div
          className={cn(
            'shrink-0 border-t border-neutral-800 p-3',
            'flex items-center gap-3',
            sidebarCollapsed && 'justify-center',
          )}
        >
          <Avatar name={user.fullName} size="sm" gold />
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate leading-tight">
                {user.fullName}
              </p>
              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
