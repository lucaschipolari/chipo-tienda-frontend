import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import {
  X, ShoppingBag, Heart, Package, Minus, Plus, CheckCircle2, Loader2,
} from 'lucide-react'
import { useProduct } from '@/features/products/hooks/useProducts'
import { useCartStore } from '@/store/cartStore'
import { useUiStore } from '@/store/uiStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { formatMoney } from '@/utils/helpers/formatMoney'
import { cn } from '@/utils/helpers/cn'
import type { ProductVariant } from '@/types/catalog.types'

/**
 * ProductQuickView — modal de detalle de producto.
 * Permite ver toda la info y comprar sin salir del catálogo.
 */

function IntensityDots({ level }: { level: number }) {
  return (
    <span className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={cn('h-1.5 w-1.5 rounded-full', i <= level ? 'bg-white' : 'bg-white/15')} />
      ))}
    </span>
  )
}

function Content({ productId, onClose }: { productId: string; onClose: () => void }) {
  const { data: product, isLoading } = useProduct(productId)
  const addItem = useCartStore(s => s.addItem)
  const openCartDrawer = useUiStore(s => s.openCartDrawer)
  const toggleFavorite = useFavoritesStore(s => s.toggle)
  const isFavorite = useFavoritesStore(s => s.items.some(i => i.productId === productId))

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [added, setAdded] = useState(false)

  if (isLoading || !product) {
    return (
      <div className="flex h-64 flex-1 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-neutral-600" />
      </div>
    )
  }

  const olf = product.olfactory
  const hasNotes = olf.topNotes.length > 0 || olf.heartNotes.length > 0 || olf.baseNotes.length > 0
  const hasExperience = !!olf.intensity || !!olf.longevity || olf.seasons.length > 0 || olf.occasions.length > 0
  const activeVariants = product.variants.filter(v => v.isActive)
  const current = selectedVariant ?? activeVariants[0] ?? null
  const price = current?.price ?? product.basePrice
  const inStock = current ? current.stockQuantity > 0 : product.totalStock > 0
  // Descuento: usa el precio tachado de la variante seleccionada, o el del producto como fallback
  const comparePrice = current?.compareAtPrice ?? product.compareAtPrice
  const hasDiscount = !!comparePrice && comparePrice > price
  const images = product.images
  const main = images[activeImg] ?? images[0]
  const attrKeys = [...new Set(activeVariants.flatMap(v => Object.keys(v.attributes)))]

  function handleAdd() {
    if (!current) return
    addItem({
      productId: product.id,
      variantId: current.id,
      productName: product.name,
      variantName: Object.values(current.attributes).join(' / ') || current.sku,
      imageUrl: images[0]?.url,
      unitPrice: price,
      currency: current.currency ?? product.currency,
      quantity,
      maxStock: current.stockQuantity,
    })
    setAdded(true)
    setTimeout(() => { setAdded(false); onClose(); openCartDrawer() }, 700)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain md:flex-row md:overflow-hidden">
      {/* ── Galería ── */}
      <div className="shrink-0 bg-neutral-950 p-4 sm:p-5 md:w-1/2 md:p-6">
        <div className="aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-white/5 sm:aspect-square">
          {main ? (
            <img key={main.url} src={main.url} alt={main.altText ?? product.name} className="h-full w-full object-cover animate-fade-in" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-12 w-12 text-neutral-700" />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.url}
                onClick={() => setActiveImg(i)}
                className={cn('h-14 w-12 shrink-0 overflow-hidden rounded-lg ring-1 transition-all',
                  i === activeImg ? 'ring-white/60 opacity-100' : 'ring-white/10 opacity-50 hover:opacity-90')}
              >
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Info — scroll propio solo en desktop ── */}
      <div className="min-h-0 space-y-6 p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:w-1/2 md:overflow-y-auto md:overscroll-contain md:p-7">
        {/* Header */}
        <div>
          {product.categoryName && (
            <span className="mb-2 inline-block rounded-full border border-white/15 bg-white/[0.03] px-3 py-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-300">
              {product.categoryName}
            </span>
          )}
          <h2 className="font-display text-2xl font-medium leading-tight text-white">{product.name}</h2>
        </div>

        {/* Precio + stock */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-white">${formatMoney(price)}</span>
            {hasDiscount && <span className="text-sm text-neutral-600 line-through">${formatMoney(comparePrice!)}</span>}
          </div>
          <span className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span className={cn('h-1.5 w-1.5 rounded-full', inStock ? 'bg-emerald-400' : 'bg-neutral-600')} />
            {inStock ? `Disponible${current && current.stockQuantity <= 5 ? ` · ${current.stockQuantity}` : ''}` : 'Sin stock'}
          </span>
        </div>

        {/* Variantes */}
        {attrKeys.length > 0 && (
          <div className="space-y-3">
            {attrKeys.map(key => {
              const values = [...new Set(activeVariants.map(v => v.attributes[key]).filter(Boolean))]
              return (
                <div key={key}>
                  <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-neutral-500">{key}</p>
                  <div className="flex flex-wrap gap-2">
                    {values.map(val => {
                      const matching = activeVariants.filter(v => v.attributes[key] === val)
                      const allOut = matching.every(v => v.stockQuantity === 0)
                      const isSel = current && matching.some(v => v.id === current.id)
                      return (
                        <button
                          key={val}
                          disabled={allOut}
                          onClick={() => { const v = matching.find(v => v.stockQuantity > 0) ?? matching[0]; if (v) setSelectedVariant(v) }}
                          className={cn('rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition-all',
                            isSel ? 'bg-white text-black ring-white' : 'text-neutral-300 ring-white/15 hover:text-white hover:ring-white/40',
                            allOut && 'cursor-not-allowed opacity-40 line-through')}
                        >
                          {val}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Cantidad + CTA */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex shrink-0 items-center overflow-hidden rounded-full ring-1 ring-white/15">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2.5 text-neutral-400 hover:bg-white/5 hover:text-white" aria-label="Restar">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[32px] text-center text-sm font-medium tabular-nums text-white">{quantity}</span>
            <button onClick={() => setQuantity(q => current ? Math.min(q + 1, current.stockQuantity) : q + 1)} className="px-3 py-2.5 text-neutral-400 hover:bg-white/5 hover:text-white" aria-label="Sumar">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={handleAdd}
            disabled={!inStock || !current || added}
            className={cn('flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full py-3 text-sm font-semibold transition-all duration-300',
              added ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40')}
          >
            {added ? <><CheckCircle2 className="h-4 w-4 shrink-0" /> Agregado</> : <><ShoppingBag className="h-4 w-4 shrink-0" /> Agregar</>}
          </button>

          <button
            onClick={() => toggleFavorite({
              productId: product.id, name: product.name, categoryName: product.categoryName ?? undefined,
              basePrice: product.basePrice, compareAtPrice: product.compareAtPrice, currency: product.currency, imageUrl: images[0]?.url,
            })}
            className={cn('shrink-0 rounded-full p-3 ring-1 transition-all', isFavorite ? 'bg-white text-black ring-white' : 'text-neutral-400 ring-white/15 hover:text-white hover:ring-white/40')}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar'}
          >
            <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
          </button>
        </div>

        {/* Descripción (real) */}
        {product.description && (
          <div className="border-t border-white/5 pt-5">
            <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-300">{product.description}</p>
          </div>
        )}

        {/* Pirámide olfativa (real) */}
        {hasNotes && (
          <div className="border-t border-white/5 pt-5">
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-neutral-500">Pirámide olfativa</p>
            <div className="space-y-2">
              {[
                { label: 'Salida', notes: olf.topNotes },
                { label: 'Corazón', notes: olf.heartNotes },
                { label: 'Fondo', notes: olf.baseNotes },
              ].filter(l => l.notes.length > 0).map(level => (
                <div key={level.label} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs text-neutral-500">{level.label}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {level.notes.map(n => (
                      <span key={n} className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[11px] text-neutral-300 ring-1 ring-white/5">{n}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cómo se vive (real — solo bloques con datos) */}
        {hasExperience && (
          <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-5">
            {olf.intensity && (
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-500">Intensidad</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-300">{olf.intensity <= 2 ? 'Suave' : olf.intensity <= 3 ? 'Moderada' : 'Fuerte'}</span>
                  <IntensityDots level={olf.intensity} />
                </div>
              </div>
            )}
            {olf.longevity && (
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-500">Duración</p>
                <p className="text-xs text-neutral-300">{olf.longevity}</p>
              </div>
            )}
            {olf.seasons.length > 0 && (
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-500">Estación</p>
                <p className="text-xs text-neutral-300">{olf.seasons.join(' · ')}</p>
              </div>
            )}
            {olf.occasions.length > 0 && (
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-500">Momento</p>
                <p className="text-xs text-neutral-300">{olf.occasions.join(' · ')}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export function ProductQuickView() {
  const [params, setParams] = useSearchParams()
  const openId = params.get('p')

  function close() {
    const next = new URLSearchParams(params)
    next.delete('p')
    setParams(next)
  }

  useEffect(() => {
    if (!openId) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId])

  if (!openId) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={close} />

      {/* Panel — bottom-sheet en mobile, centrado en desktop */}
      <div className="relative z-10 flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-[#101010] ring-1 ring-white/10 animate-slide-up sm:max-h-[88vh] sm:rounded-3xl">
        <button
          onClick={close}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/90 ring-1 ring-white/15 backdrop-blur-md transition-all hover:bg-white hover:text-black"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
        <Content productId={openId} onClose={close} />
      </div>
    </div>,
    document.body,
  )
}
