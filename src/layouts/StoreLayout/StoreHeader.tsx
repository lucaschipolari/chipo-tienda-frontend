import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, User, Search, Menu } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/helpers/cn'
import { useAuthStore } from '@/store/authStore'
import { useCartStore, selectCartItemCount } from '@/store/cartStore'
import { useDebounce } from '@/hooks/useDebounce'

export function StoreHeader() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const cartItemCount = useCartStore(selectCartItemCount)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const debouncedQuery = useDebounce(searchQuery, 300)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (debouncedQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(debouncedQuery.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-navbar bg-white border-b border-neutral-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 h-16">

          {/* ── Logo ── */}
          <Link to="/" className="text-2xl font-bold text-primary-600 shrink-0">
            Chipo
          </Link>

          {/* ── Buscador (desktop) ── */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-4 py-2 rounded-lg text-sm',
                  'border border-neutral-300 bg-neutral-50',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  'transition-all placeholder-neutral-400',
                )}
              />
            </div>
          </form>

          {/* ── Acciones ── */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            {/* Favoritos */}
            <Link
              to={isAuthenticated ? '/account/favorites' : '/login'}
              className="p-2 rounded-md text-neutral-600 hover:bg-neutral-100 transition-colors"
              aria-label="Favoritos"
            >
              <Heart className="h-5 w-5" />
            </Link>

            {/* Carrito */}
            <Link
              to="/cart"
              className="relative p-2 rounded-md text-neutral-600 hover:bg-neutral-100 transition-colors"
              aria-label={`Carrito (${cartItemCount} items)`}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </Link>

            {/* Usuario */}
            <Link
              to={isAuthenticated ? '/account' : '/login'}
              className="p-2 rounded-md text-neutral-600 hover:bg-neutral-100 transition-colors"
              aria-label={isAuthenticated ? 'Mi cuenta' : 'Iniciar sesión'}
            >
              <User className="h-5 w-5" />
            </Link>

            {/* Hamburger mobile */}
            <button
              className="md:hidden p-2 rounded-md text-neutral-600 hover:bg-neutral-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menú"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Buscador mobile ── */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </form>
        </div>
      </div>

      {/* ── Nav de categorías ── */}
      <nav className="hidden md:block border-t border-neutral-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-6 h-10 text-sm">
            <Link to="/catalog" className="text-neutral-600 hover:text-primary-600 font-medium transition-colors">
              Todo
            </Link>
            <Link to="/catalog?new=true" className="text-neutral-600 hover:text-primary-600 transition-colors">
              Novedades
            </Link>
            <Link to="/catalog?discount=true" className="text-danger-600 hover:text-danger-700 font-medium transition-colors">
              Ofertas
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
