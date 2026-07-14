import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Heart, Package, Plus, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useCartStore } from '@/store/cartStore'
import { cn } from '@/utils/helpers/cn'
import { formatMoney } from '@/utils/helpers/formatMoney'
import type { ProductListItem } from '@/types/catalog.types'

/**
 * ProductCard — card premium de fragancia con quick-add.
 *
 * Si el perfume tiene una sola variante activa, "Agregar" lo mete al
 * carrito al instante. Si tiene varias (ej. 50ml/100ml), lleva al detalle
 * para elegir. El botón está siempre visible (no depende de hover → mobile).
 */
export function ProductCard({ product }: { product: ProductListItem }) {
  const [params, setParams] = useSearchParams()
  const toggleFavorite = useFavoritesStore(s => s.toggle)
  const isFavorite = useFavoritesStore(s => s.items.some(i => i.productId === product.id))
  const addItem = useCartStore(s => s.addItem)

  // Abre el detalle como modal escribiendo ?p=<id> en la URL (compartible).
  function openModal(id: string) {
    const next = new URLSearchParams(params)
    next.set('p', id)
    setParams(next)
  }

  // Click normal → modal sin salir del catálogo.
  // Ctrl/Cmd/click-medio → deja que el navegador abra el link en otra pestaña.
  function handleCardClick(e: React.MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.button === 1) return
    e.preventDefault()
    openModal(product.id)
  }

  const [justAdded, setJustAdded] = useState(false)

  const desc = product.description?.trim()
  const notes = (product.notes ?? []).slice(0, 3)
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.basePrice
  const soldOut = product.totalStock === 0
  const canQuickAdd = !soldOut && !!product.defaultVariantId

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (soldOut) return
    // Sin variante por defecto (varios tamaños) → abrir el modal a elegir
    if (!product.defaultVariantId) {
      openModal(product.id)
      return
    }
    addItem({
      productId: product.id,
      variantId: product.defaultVariantId,
      productName: product.name,
      variantName: 'Único',
      imageUrl: product.mainImageUrl,
      unitPrice: product.basePrice,
      currency: product.currency,
      quantity: 1,
      maxStock: product.defaultVariantStock,
    })
    setJustAdded(true)
    toast.success(`${product.name} agregado`, { duration: 1500 })
    setTimeout(() => setJustAdded(false), 1400)
  }

  return (
    <Link
      to={`/product/${product.id}`}
      onClick={handleCardClick}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.8)] transition-all duration-500 hover:-translate-y-1 hover:ring-white/25 hover:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)]"
    >
      {/* Imagen — relación vertical elegante */}
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-950">
        {product.mainImageUrl ? (
          <img
            src={product.mainImageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.06] group-hover:brightness-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full ring-1 ring-white/10 transition-all duration-500 group-hover:ring-white/25">
              <Package className="h-7 w-7 text-neutral-600 transition-colors duration-500 group-hover:text-neutral-400" />
            </div>
          </div>
        )}

        {/* Luz sutil en hover */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-30" />

        {/* Favorito */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleFavorite({
              productId: product.id,
              name: product.name,
              categoryName: product.categoryName,
              basePrice: product.basePrice,
              compareAtPrice: product.compareAtPrice,
              currency: product.currency,
              imageUrl: product.mainImageUrl,
            })
          }}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          className={cn(
            'absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300',
            isFavorite
              ? 'bg-white text-black opacity-100'
              : 'bg-black/40 text-white/80 opacity-0 ring-1 ring-white/15 hover:text-white group-hover:opacity-100',
          )}
        >
          <Heart className={cn('h-3.5 w-3.5', isFavorite && 'fill-current')} />
        </button>

        {soldOut && (
          <span className="absolute right-3 top-12 rounded-full bg-black/60 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-neutral-400 backdrop-blur-md">
            Agotado
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          {product.categoryName && (
            <p className="mb-0.5 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              {product.categoryName}
            </p>
          )}
          <h3 className="font-display text-base font-medium leading-snug text-white">
            {product.name}
          </h3>
        </div>

        {desc && (
          <p className="line-clamp-2 text-xs leading-relaxed text-neutral-500">{desc}</p>
        )}

        {/* Notas — solo si el producto tiene perfil olfativo cargado */}
        {notes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {notes.map((n) => (
              <span
                key={n}
                className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-neutral-400 ring-1 ring-white/5"
              >
                {n}
              </span>
            ))}
          </div>
        )}

        {/* Precio + Agregar — en mobile se apilan (el botón va full-width abajo) */}
        <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-white">
              ${formatMoney(product.basePrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-neutral-600 line-through">
                ${formatMoney(product.compareAtPrice!)}
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={soldOut}
            aria-label={canQuickAdd ? 'Agregar al carrito' : 'Ver opciones'}
            className={cn(
              'flex w-full shrink-0 items-center justify-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 sm:w-auto',
              soldOut
                ? 'cursor-not-allowed bg-white/[0.04] text-neutral-600'
                : justAdded
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-black hover:bg-neutral-200',
            )}
          >
            {soldOut ? (
              'Agotado'
            ) : justAdded ? (
              <><Check className="h-3.5 w-3.5" /> Listo</>
            ) : canQuickAdd ? (
              <><Plus className="h-3.5 w-3.5" /> Agregar</>
            ) : (
              'Ver opciones'
            )}
          </button>
        </div>
      </div>
    </Link>
  )
}
