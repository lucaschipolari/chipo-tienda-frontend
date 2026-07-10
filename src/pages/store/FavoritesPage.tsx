import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Package, X } from 'lucide-react'
import { useFavoritesStore } from '@/store/favoritesStore'
import { formatMoney } from '@/utils/helpers/formatMoney'
import { Reveal } from '@/components/store/Reveal'

/**
 * FavoritesPage — las fragancias guardadas por el comprador.
 * Persisten en el dispositivo (localStorage).
 */

function EmptyFavorites() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <div className="relative mb-7">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/10">
          <Heart className="h-11 w-11 text-neutral-700" />
        </div>
      </div>

      <h2 className="mb-2 text-xl font-semibold text-white">Aún no tenés favoritos</h2>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-neutral-500">
        Tocá el corazón en cualquier fragancia para guardarla acá y volver
        a encontrarla cuando quieras.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition-colors hover:bg-neutral-200"
      >
        <ShoppingBag className="h-4 w-4" />
        Explorar la colección
      </Link>
    </div>
  )
}

export default function FavoritesPage() {
  const favorites = useFavoritesStore(s => s.items)
  const remove = useFavoritesStore(s => s.remove)

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-10">
          <p className="mb-2 text-[11px] uppercase tracking-[0.35em] text-neutral-500">
            Tu colección personal
          </p>
          <h1 className="font-display text-3xl font-medium text-white">Favoritos</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {favorites.length === 0
              ? 'Ninguna fragancia guardada todavía'
              : `${favorites.length} fragancia${favorites.length !== 1 ? 's' : ''} guardada${favorites.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {favorites.length === 0 ? (
          <EmptyFavorites />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {favorites.map((fav, i) => {
              return (
                <Reveal key={fav.productId} delay={(i % 4) * 70}>
                  <Link
                    to={`/product/${fav.productId}`}
                    className="group relative flex flex-col overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 transition-all duration-500 hover:-translate-y-1 hover:ring-white/25"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-neutral-950">
                      {fav.imageUrl ? (
                        <img
                          src={fav.imageUrl}
                          alt={fav.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-8 w-8 text-neutral-600" />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          remove(fav.productId)
                        }}
                        aria-label="Quitar de favoritos"
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/80 ring-1 ring-white/15 backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-black"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-4">
                      {fav.categoryName && (
                        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                          {fav.categoryName}
                        </p>
                      )}
                      <h3 className="font-display text-base font-medium text-white">{fav.name}</h3>
                      <div className="mt-auto flex items-baseline gap-2 pt-2">
                        <span className="text-sm font-semibold text-white">
                          ${formatMoney(fav.basePrice)}
                        </span>
                        {fav.compareAtPrice && fav.compareAtPrice > fav.basePrice && (
                          <span className="text-xs text-neutral-600 line-through">
                            ${formatMoney(fav.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </Reveal>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
