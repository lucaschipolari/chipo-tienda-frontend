import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, User, LogOut, ShoppingBag, ChevronDown, LayoutDashboard, Plus } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils/helpers/cn'
import { useAuthStore } from '@/store/authStore'
import { useCartStore, selectCartItemCount } from '@/store/cartStore'
import { useUiStore } from '@/store/uiStore'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { usePermissions } from '@/hooks/usePermissions'
import { getInitials } from '@/utils/formatters/text'

// ─── Dropdown usuario autenticado ─────────────────────────────────────────────

function UserDropdown() {
  const user = useAuthStore((s) => s.user)
  const { canAccessAdmin } = usePermissions()
  const { logout, isLoggingOut } = useLogout()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 p-1.5 rounded-xl text-neutral-500 hover:text-white hover:bg-obsidian-800 transition-colors"
        aria-label="Mi cuenta"
        aria-expanded={open}
      >
        <div className="h-7 w-7 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center shrink-0">
          {getInitials(user.fullName)}
        </div>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform hidden sm:block', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl z-50"
          style={{ background: 'var(--surface)' }}
        >
          <div className="px-4 py-3 border-b border-neutral-800">
            <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
            <p className="text-xs text-neutral-500 truncate mt-0.5">{user.email}</p>
          </div>

          {canAccessAdmin && (
            <div className="border-b border-neutral-800 py-1">
              <DropdownLink to="/admin/dashboard" icon={LayoutDashboard} label="Panel de administración" onClick={() => setOpen(false)} />
            </div>
          )}

          <div className="py-1">
            <DropdownLink to="/account" icon={User} label="Mi perfil" onClick={() => setOpen(false)} />
            <DropdownLink to="/account/orders" icon={ShoppingBag} label="Mis pedidos" onClick={() => setOpen(false)} />
            <DropdownLink to="/account/favorites" icon={Heart} label="Favoritos" onClick={() => setOpen(false)} />
          </div>

          <div className="border-t border-neutral-800 py-1">
            <button
              onClick={() => { setOpen(false); logout() }}
              disabled={isLoggingOut}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-400 hover:text-red-400 hover:bg-red-500/5 transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DropdownLink({
  to, icon: Icon, label, onClick,
}: {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-400 hover:text-white hover:bg-obsidian-800 transition-colors"
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function StoreHeader() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { canAccessAdmin } = usePermissions()
  const cartItemCount = useCartStore(selectCartItemCount)
  const openCartDrawer = useUiStore((s) => s.openCartDrawer)

  return (
    <header
      className="sticky top-0 z-navbar border-b border-neutral-800"
      style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16">

          {/* ── Logo ── */}
          <Link to="/" className="shrink-0 select-none">
            <img src="/chipo-logo.svg" alt="Chipo" className="h-9 w-auto" />
          </Link>

          {/* ── Acciones ── */}
          <div className="flex items-center gap-1 ml-auto">
            {canAccessAdmin && (
              <>
                <Link
                  to="/admin/sales/new"
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  title="Registrar una venta"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Venta</span>
                </Link>
                <Link
                  to="/admin/dashboard"
                  className="hidden sm:flex items-center gap-1.5 mr-1 rounded-xl border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-xs font-semibold text-gold-400 hover:bg-gold-500/20 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Admin
                </Link>
              </>
            )}

            <Link
              to={isAuthenticated ? '/account/favorites' : '/login'}
              className="p-2 rounded-xl text-neutral-500 hover:text-white hover:bg-obsidian-800 transition-colors"
              aria-label="Favoritos"
            >
              <Heart className="h-5 w-5" />
            </Link>

            <button
              onClick={openCartDrawer}
              className="relative p-2 rounded-xl text-neutral-500 hover:text-white hover:bg-obsidian-800 transition-colors"
              aria-label={`Carrito (${cartItemCount} items)`}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-white text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <UserDropdown />
            ) : (
              <Link
                to="/login"
                className="p-2 rounded-xl text-neutral-500 hover:text-white hover:bg-obsidian-800 transition-colors"
                aria-label="Iniciar sesión"
              >
                <User className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
