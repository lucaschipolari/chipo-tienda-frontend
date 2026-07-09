import { Link } from 'react-router-dom'
import { ShoppingCart, Trash2, Plus, Minus, Tag, X, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { useUiStore } from '@/store/uiStore'
import { useCartStore, selectCartItems, selectCartTotals } from '@/store/cartStore'
import { couponsService } from '@/features/promotions/promotionsService'
import { formatCurrency } from '@/utils/formatters/currency'
import { cn } from '@/utils/helpers/cn'

// ─── Item del carrito ─────────────────────────────────────────────────────────

function CartItemRow({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: {
    productId: string
    variantId: string
    productName: string
    variantName: string
    imageUrl?: string
    unitPrice: number
    currency: string
    quantity: number
    maxStock?: number
  }
  onRemove: (variantId: string) => void
  onUpdateQty: (variantId: string, qty: number) => void
}) {
  return (
    <div className="flex gap-3 py-4 border-b border-neutral-800/60 last:border-0 group">
      {/* Imagen */}
      <div className="h-18 w-16 rounded-xl overflow-hidden bg-obsidian-800 shrink-0 flex items-center justify-center">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="h-full w-full object-cover"
          />
        ) : (
          <ShoppingBag className="h-6 w-6 text-neutral-700" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white leading-tight truncate">
          {item.productName}
        </p>
        <p className="text-xs text-neutral-500 mt-0.5 truncate">{item.variantName}</p>

        {/* Precio + controles */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-semibold text-gold-400">
            {formatCurrency(item.unitPrice * item.quantity, item.currency)}
          </span>

          {/* Qty controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateQty(item.variantId, item.quantity - 1)}
              className="h-6 w-6 rounded-lg bg-obsidian-700 hover:bg-obsidian-600 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Disminuir cantidad"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-6 text-center text-sm font-medium text-white tabular-nums">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQty(item.variantId, item.quantity + 1)}
              disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
              className="h-6 w-6 rounded-lg bg-obsidian-700 hover:bg-obsidian-600 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Aumentar cantidad"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Eliminar */}
      <button
        onClick={() => onRemove(item.variantId)}
        className="self-start mt-0.5 p-1.5 rounded-lg text-neutral-700 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
        aria-label="Eliminar producto"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ─── Sección de cupón ─────────────────────────────────────────────────────────

function CouponSection() {
  const { couponCode, applyCoupon, removeCoupon } = useCartStore()
  const totals = useCartStore(selectCartTotals)
  const [input, setInput] = useState('')
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApply = async () => {
    const code = input.trim().toUpperCase()
    if (!code) return
    setApplying(true)
    setError(null)
    try {
      const result = await couponsService.validate(code, totals.subtotal, totals.currency)
      if (result.isValid && result.discountAmount > 0) {
        applyCoupon(code, result.discountAmount)
        setInput('')
      } else {
        setError(result.errorMessage || 'Cupón no válido o no aplica a tu compra.')
      }
    } catch {
      setError('No pudimos validar el cupón. Intentá de nuevo.')
    }
    setApplying(false)
  }

  if (couponCode) {
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gold-500/10 border border-gold-500/20">
        <div className="flex items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-gold-400" />
          <span className="text-sm font-medium text-gold-400">{couponCode}</span>
        </div>
        <button
          onClick={removeCoupon}
          className="text-neutral-500 hover:text-white transition-colors"
          aria-label="Quitar cupón"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(null) }}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="Código de descuento"
          className={cn(
            'flex-1 px-3 py-2 rounded-xl text-sm',
            'bg-obsidian-800 border text-white placeholder:text-neutral-600',
            'focus:outline-none focus:ring-1 focus:ring-gold-500/40',
            error ? 'border-red-500/50' : 'border-neutral-800',
          )}
        />
        <button
          onClick={handleApply}
          disabled={applying || !input.trim()}
          className="px-3 py-2 rounded-xl text-sm font-medium bg-obsidian-700 text-neutral-300 hover:text-white hover:bg-obsidian-600 transition-colors disabled:opacity-50 shrink-0"
        >
          {applying ? '...' : 'Aplicar'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 pl-1">{error}</p>}
    </div>
  )
}

// ─── Drawer principal ─────────────────────────────────────────────────────────

export function CartDrawer() {
  const isOpen = useUiStore((s) => s.cartDrawerOpen)
  const closeCartDrawer = useUiStore((s) => s.closeCartDrawer)
  const items = useCartStore(selectCartItems)
  const totals = useCartStore(selectCartTotals)
  const { removeItem, updateQuantity, clearCart } = useCartStore()

  const isEmpty = items.length === 0

  const footer = !isEmpty ? (
    <div className="w-full space-y-3">
      {/* Totales */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm text-neutral-400">
          <span>Subtotal</span>
          <span>{formatCurrency(totals.subtotal, totals.currency)}</span>
        </div>
        {totals.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-400">
            <span>Descuento</span>
            <span>-{formatCurrency(totals.discountAmount, totals.currency)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-neutral-500">
          <span>Envío</span>
          <span className="text-green-400 text-xs">Calcular en checkout</span>
        </div>
        <div className="flex justify-between font-semibold text-white border-t border-neutral-800 pt-2 mt-1">
          <span>Total</span>
          <span className="text-gold-400 text-base">
            {formatCurrency(totals.total, totals.currency)}
          </span>
        </div>
      </div>

      {/* CTA */}
      <Link
        to="/checkout"
        onClick={closeCartDrawer}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors"
      >
        Ir al checkout
      </Link>
    </div>
  ) : undefined

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeCartDrawer}
      side="right"
      size="lg"
      footer={footer}
      title={
        isEmpty
          ? 'Tu carrito'
          : `Tu carrito (${items.reduce((s, i) => s + i.quantity, 0)})`
      }
    >
      {isEmpty ? (
        /* ── Estado vacío ── */
        <div className="flex flex-col items-center justify-center h-full py-16 text-center">
          <div className="h-20 w-20 rounded-full bg-obsidian-800 flex items-center justify-center mb-5">
            <ShoppingCart className="h-9 w-9 text-neutral-600" />
          </div>
          <p className="text-white font-medium text-base mb-1">Tu carrito está vacío</p>
          <p className="text-neutral-500 text-sm mb-6">
            Agrega fragancias para comenzar
          </p>
          <Link
            to="/catalog"
            onClick={closeCartDrawer}
            className="px-5 py-2.5 rounded-2xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        /* ── Contenido ── */
        <div className="space-y-0">
          {/* Lista de items */}
          <div>
            {items.map((item) => (
              <CartItemRow
                key={item.variantId}
                item={item}
                onRemove={removeItem}
                onUpdateQty={updateQuantity}
              />
            ))}
          </div>

          {/* Cupón */}
          <div className="pt-4 pb-2">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
              ¿Tienes un cupón?
            </p>
            <CouponSection />
          </div>

          {/* Vaciar carrito */}
          <div className="pt-2">
            <button
              onClick={clearCart}
              className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Vaciar carrito
            </button>
          </div>
        </div>
      )}
    </Drawer>
  )
}
