/**
 * Nueva Venta — Punto de Venta (POS)
 *
 * Flujo:
 *  1. Buscar cliente (opcional) por nombre o número de documento
 *  2. Buscar productos por nombre o SKU — seleccionar variante
 *  3. Ajustar cantidades, aplicar descuento por ítem
 *  4. Ver totales en tiempo real: Subtotal / Descuento / IGV 18% / Total
 *  5. Elegir canal y método de pago
 *  6. Confirmar venta → toast éxito + navigate a lista
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft, ShoppingCart, Search, Plus, Minus, Trash2,
  User, X, CreditCard, Banknote, Smartphone, QrCode,
  Tag, Package, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button }  from '@/components/ui/Button/Button'
import { Input }   from '@/components/ui/Input/Input'
import { Badge }   from '@/components/ui/Badge/Badge'
import { cn }      from '@/utils/helpers/cn'
import { useCustomers } from '@/features/customers/hooks/useCustomers'
import { useProducts, useProduct } from '@/features/products/hooks/useProducts'
import { useCreateSale } from '@/features/sales/hooks/useSales'
import type { CustomerListItem }    from '@/types/customer.types'
import type { ProductListItem, ProductVariant } from '@/types/catalog.types'
import type { CreateSaleRequest, CreateSaleItemRequest, PaymentMethod, SaleChannel } from '@/types/sale.types'
import { formatMoney } from '@/utils/helpers/formatMoney'

// ─── Constantes ───────────────────────────────────────────────────────────────

const CURRENCIES: { value: string; label: string }[] = [
  { value: 'ARS', label: 'ARS — Peso argentino' },
  { value: 'USD', label: 'USD — Dólar' },
]

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'Cash',     label: 'Efectivo',        icon: <Banknote     className="h-5 w-5" /> },
  { value: 'Card',     label: 'Tarjeta',          icon: <CreditCard   className="h-5 w-5" /> },
  { value: 'Transfer', label: 'Transferencia',    icon: <Smartphone   className="h-5 w-5" /> },
  { value: 'QR',       label: 'QR / Billetera',   icon: <QrCode       className="h-5 w-5" /> },
]

const CHANNEL_OPTIONS: { value: SaleChannel; label: string }[] = [
  { value: 'InStore',  label: 'Tienda física' },
  { value: 'Phone',    label: 'Teléfono' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Other',    label: 'Otro' },
]

// ─── Tipos del carrito ────────────────────────────────────────────────────────

interface CartItem {
  key:          string        // productId + variantId
  productId:    string
  variantId:    string
  productName:  string
  sku:          string
  attributes:   Record<string, string>
  unitPrice:    number
  quantity:     number
  discount:     number        // % descuento por ítem 0..100
  stockAvailable: number
}

// ─── Hook de búsqueda con debounce ────────────────────────────────────────────

function useDebounceValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ─── Subcomponente: buscador de clientes ──────────────────────────────────────

function CustomerSearch({
  selected,
  onSelect,
  onClear,
}: {
  selected: CustomerListItem | null
  onSelect: (c: CustomerListItem) => void
  onClear: () => void
}) {
  const [query, setQuery] = useState('')
  const [open,  setOpen]  = useState(false)
  const debounced = useDebounceValue(query)
  const wrapRef   = useRef<HTMLDivElement>(null)

  const { data } = useCustomers({
    search: debounced || undefined,
    isActive: true,
    pageSize: 8,
  })

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (selected) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gold-500/30 bg-gold-500/5">
        <User className="h-4 w-4 text-gold-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{selected.fullName}</p>
          <p className="text-xs text-neutral-500">
            {selected.documentType} {selected.documentNumber}
            {selected.email ? ` · ${selected.email}` : ''}
          </p>
        </div>
        <button
          onClick={onClear}
          className="p-1 rounded-lg hover:bg-obsidian-800 text-neutral-500 hover:text-white transition-colors"
          title="Quitar cliente"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar cliente por nombre o documento (opcional)…"
          className="w-full pl-9 pr-4 py-2.5 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
      </div>

      {open && data && data.items.length > 0 && (
        <div className="absolute z-10 top-full mt-1 w-full rounded-xl border border-neutral-800 overflow-hidden shadow-xl"
          style={{ background: 'var(--surface)' }}>
          {data.items.map(c => (
            <button
              key={c.id}
              onClick={() => { onSelect(c); setQuery(''); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-obsidian-800 transition-colors border-b border-neutral-800/50 last:border-0"
            >
              <User className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{c.fullName}</p>
                <p className="text-xs text-neutral-500">
                  {c.documentType} {c.documentNumber}
                  {c.email ? ` · ${c.email}` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Subcomponente: buscador de productos ─────────────────────────────────────
// Flujo: búsqueda en lista → seleccionar → carga detalle con variantes → elegir variante

function ProductSearch({ onAdd, currency }: { onAdd: (item: CartItem) => void; currency: string }) {
  const [query,       setQuery]       = useState('')
  const [open,        setOpen]        = useState(false)
  const [selectedId,  setSelectedId]  = useState<string | null>(null)   // ID del producto elegido
  const [selectedBase, setSelectedBase] = useState<ProductListItem | null>(null)
  const debounced = useDebounceValue(query)
  const wrapRef   = useRef<HTMLDivElement>(null)

  // Búsqueda de productos (lista). Sin filtro de estado: el admin puede vender
  // también productos en borrador (ej. accesorios de empaque ocultos de la tienda).
  const { data: prodData } = useProducts({
    search: debounced || undefined,
    pageSize: 10,
  })

  // Detalle completo del producto (con variantes y stock actualizado)
  const { data: prodDetail, isLoading: loadingDetail } = useProduct(selectedId ?? undefined)

  // Auto-add cuando hay exactamente 1 variante activa con atributos vacíos ("variante única")
  useEffect(() => {
    if (!prodDetail || !selectedBase || loadingDetail) return
    const activeVariants = prodDetail.variants.filter(v => v.isActive)
    if (activeVariants.length === 1 && Object.keys(activeVariants[0].attributes).length === 0) {
      handleAddVariant(activeVariants[0])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prodDetail])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSelectProduct(p: ProductListItem) {
    setSelectedId(p.id)
    setSelectedBase(p)
    setQuery(p.name)
    setOpen(false)
  }

  function handleAddVariant(variant: ProductVariant) {
    if (!selectedBase) return
    onAdd({
      key:            `${selectedBase.id}-${variant.id}`,
      productId:      selectedBase.id,
      variantId:      variant.id,
      productName:    selectedBase.name,
      sku:            variant.sku,
      attributes:     variant.attributes,
      unitPrice:      variant.price ?? selectedBase.basePrice,
      quantity:       1,
      discount:       0,
      stockAvailable: variant.stockQuantity,
    })
    clearSelection()
  }

  function clearSelection() {
    setSelectedId(null)
    setSelectedBase(null)
    setQuery('')
    setOpen(false)
  }

  const variants: ProductVariant[] = prodDetail?.variants ?? []

  return (
    <div ref={wrapRef} className="relative">
      {/* Input de búsqueda */}
      <div className="relative">
        <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <input
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setSelectedId(null)
            setSelectedBase(null)
            setOpen(true)
          }}
          onFocus={() => !selectedId && setOpen(true)}
          placeholder="Buscar producto por nombre o SKU…"
          className="w-full pl-9 pr-9 py-2.5 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
        {query && (
          <button
            onClick={clearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown: lista de productos */}
      {open && !selectedId && prodData && prodData.items.length > 0 && (
        <div
          className="absolute z-10 top-full mt-1 w-full rounded-xl border border-neutral-800 overflow-hidden shadow-xl"
          style={{ background: 'var(--surface)' }}
        >
          {prodData.items.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectProduct(p)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-obsidian-800 transition-colors border-b border-neutral-800/50 last:border-0"
            >
              <Package className="h-4 w-4 text-neutral-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{p.name}</p>
                <p className="text-xs text-neutral-500">SKU: {p.sku}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-gold-400">
                  {currency} {formatMoney(p.basePrice)}
                </p>
                <p className="text-xs text-neutral-600">Stock: {p.totalStock}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selector de variante — se muestra cuando tenemos el detalle */}
      {selectedId && (
        <div
          className="absolute z-10 top-full mt-1 w-full rounded-xl border border-neutral-800 overflow-hidden shadow-xl"
          style={{ background: 'var(--surface)' }}
        >
          <div className="px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              {loadingDetail ? 'Cargando variantes…' : `Variantes — ${selectedBase?.name}`}
            </p>
            <button onClick={clearSelection} className="text-neutral-500 hover:text-white transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {loadingDetail ? (
            <div className="px-4 py-6 text-center text-neutral-600 text-sm">Cargando…</div>
          ) : variants.length === 0 ? (
            <div className="px-4 py-6 text-center text-neutral-600 text-sm">
              Este producto no tiene variantes activas con stock.
            </div>
          ) : (
            variants.filter(v => v.isActive).map(v => {
              const attrs = Object.entries(v.attributes)
                .map(([k, val]) => `${k}: ${val}`).join(' / ')
              return (
                <button
                  key={v.id}
                  onClick={() => handleAddVariant(v)}
                  disabled={v.stockQuantity === 0}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-neutral-800/50 last:border-0',
                    v.stockQuantity > 0
                      ? 'hover:bg-obsidian-800 cursor-pointer'
                      : 'opacity-40 cursor-not-allowed',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{attrs || 'Variante única'}</p>
                    <p className="text-xs text-neutral-500">SKU: {v.sku}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-sm font-medium text-gold-400">
                      {currency} {(v.price ?? (selectedBase?.basePrice ?? 0)).toFixed(2)}
                    </p>
                    <Badge
                      variant={v.stockQuantity === 0 ? 'danger' : v.isBelowMinStock ? 'warning' : 'success'}
                      size="sm"
                    >
                      {v.stockQuantity === 0 ? 'Sin stock' : `${v.stockQuantity} disp.`}
                    </Badge>
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function NewSalePage() {
  const navigate      = useNavigate()
  const createMutation = useCreateSale()

  const [customer,    setCustomer]    = useState<CustomerListItem | null>(null)
  const [cart,        setCart]        = useState<CartItem[]>([])
  const [payMethod,   setPayMethod]   = useState<PaymentMethod>('Cash')
  const [channel,     setChannel]     = useState<SaleChannel>('InStore')
  const [currency,    setCurrency]    = useState('ARS')
  const [globalDisc,  setGlobalDisc]  = useState(0)   // % descuento global 0..100
  const [notes,       setNotes]       = useState('')

  // ── Carrito: agregar / actualizar ─────────────────────────────────────────

  function addToCart(item: CartItem) {
    setCart(prev => {
      const existing = prev.find(i => i.key === item.key)
      if (existing) {
        return prev.map(i =>
          i.key === item.key
            ? { ...i, quantity: Math.min(i.quantity + 1, i.stockAvailable) }
            : i
        )
      }
      return [...prev, item]
    })
    toast.success(`${item.productName} agregado al carrito.`, { duration: 1500 })
  }

  function removeFromCart(key: string) {
    setCart(prev => prev.filter(i => i.key !== key))
  }

  function setQty(key: string, qty: number) {
    if (qty < 1) { removeFromCart(key); return }
    setCart(prev =>
      prev.map(i => i.key === key ? { ...i, quantity: Math.min(qty, i.stockAvailable) } : i)
    )
  }

  function setItemDiscount(key: string, disc: number) {
    setCart(prev =>
      prev.map(i => i.key === key ? { ...i, discount: Math.max(0, Math.min(100, disc)) } : i)
    )
  }

  // ── Cálculos ──────────────────────────────────────────────────────────────

  const subtotalBruto = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  const itemDiscountAmt = cart.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity * (i.discount / 100), 0
  )

  const afterItemDisc   = subtotalBruto - itemDiscountAmt
  const globalDiscAmt   = afterItemDisc * (globalDisc / 100)
  const subtotal        = afterItemDisc - globalDiscAmt
  const total           = subtotal   // sin impuestos adicionales
  const totalDiscAmt    = itemDiscountAmt + globalDiscAmt

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (cart.length === 0) {
      toast.error('El carrito está vacío. Agrega al menos un producto.')
      return
    }

    const items: CreateSaleItemRequest[] = cart.map(i => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity:  i.quantity,
      unitPrice: i.unitPrice,
      discount:  i.unitPrice * i.quantity * (i.discount / 100),
    }))

    const req: CreateSaleRequest = {
      customerId:    customer?.id,
      items,
      paymentMethod: payMethod,
      channel,
      currency,
      notes:         notes.trim() || undefined,
    }

    createMutation.mutate(req, {
      onSuccess: () => {
        toast.success('¡Venta registrada correctamente!')
        navigate('/admin/sales')
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.detail || err?.message || 'Error al registrar la venta.'
        toast.error(msg)
      },
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-0">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/admin/sales"
          className="p-2 rounded-xl hover:bg-obsidian-800 text-neutral-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-gold-400" />
            Nueva venta
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">Punto de venta</p>
        </div>
      </div>

      {/* ── Layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

        {/* ═══ Columna izquierda: búsqueda + carrito ═══════════════════════ */}
        <div className="space-y-5">

          {/* Cliente (opcional) */}
          <section className="rounded-2xl border border-neutral-800 p-5" style={{ background: 'var(--surface)' }}>
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <User className="h-3.5 w-3.5" />Cliente
            </h2>
            <CustomerSearch
              selected={customer}
              onSelect={setCustomer}
              onClear={() => setCustomer(null)}
            />
          </section>

          {/* Buscar producto */}
          <section className="rounded-2xl border border-neutral-800 p-5" style={{ background: 'var(--surface)' }}>
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Package className="h-3.5 w-3.5" />Agregar producto
            </h2>
            <ProductSearch onAdd={addToCart} currency={currency} />
          </section>

          {/* Carrito */}
          <section className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ background: 'var(--surface)' }}>
            <div className="px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-2">
                <ShoppingCart className="h-3.5 w-3.5" />
                Carrito
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-neutral-600 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Vaciar
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="px-5 py-12 text-center text-neutral-600 text-sm">
                No hay productos en el carrito.<br />
                <span className="text-neutral-700 text-xs">Busca un producto arriba para agregarlo.</span>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800/50">
                {cart.map(item => (
                  <CartRow
                    key={item.key}
                    item={item}
                    currency={currency}
                    onQtyChange={qty  => setQty(item.key, qty)}
                    onDiscChange={d   => setItemDiscount(item.key, d)}
                    onRemove={()      => removeFromCart(item.key)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ═══ Columna derecha: totales + opciones + confirmar ════════════ */}
        <div className="space-y-5">

          {/* Descuento global */}
          <section className="rounded-2xl border border-neutral-800 p-5" style={{ background: 'var(--surface)' }}>
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Tag className="h-3.5 w-3.5" />Descuento global
            </h2>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={globalDisc}
                onChange={e => setGlobalDisc(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="w-20 bg-obsidian-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
              <span className="text-sm text-neutral-500">%</span>
              {globalDisc > 0 && (
                <span className="text-sm text-red-400">
                  − {currency} {formatMoney(globalDiscAmt)}
                </span>
              )}
            </div>
          </section>

          {/* Moneda */}
          <section className="rounded-2xl border border-neutral-800 p-5" style={{ background: 'var(--surface)' }}>
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
              Moneda
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {CURRENCIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCurrency(c.value)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm font-medium transition-all border',
                    currency === c.value
                      ? 'bg-gold-500/10 text-gold-400 border-gold-500/30'
                      : 'text-neutral-500 border-neutral-800 hover:text-white hover:border-neutral-700',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </section>

          {/* Canal de venta */}
          <section className="rounded-2xl border border-neutral-800 p-5" style={{ background: 'var(--surface)' }}>
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
              Canal de venta
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {CHANNEL_OPTIONS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setChannel(c.value)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm font-medium transition-all border',
                    channel === c.value
                      ? 'bg-gold-500/10 text-gold-400 border-gold-500/30'
                      : 'text-neutral-500 border-neutral-800 hover:text-white hover:border-neutral-700',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </section>

          {/* Método de pago */}
          <section className="rounded-2xl border border-neutral-800 p-5" style={{ background: 'var(--surface)' }}>
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
              Método de pago
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setPayMethod(m.value)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border',
                    payMethod === m.value
                      ? 'bg-gold-500/10 text-gold-400 border-gold-500/30'
                      : 'text-neutral-500 border-neutral-800 hover:text-white hover:border-neutral-700',
                  )}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </section>

          {/* Totales */}
          <section className="rounded-2xl border border-neutral-800 p-5 space-y-3" style={{ background: 'var(--surface)' }}>
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
              Resumen
            </h2>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal bruto</span>
                <span>{currency} {formatMoney(subtotalBruto)}</span>
              </div>
              {totalDiscAmt > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Descuentos</span>
                  <span>− {currency} {formatMoney(totalDiscAmt)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span>{currency} {formatMoney(subtotal)}</span>
              </div>
            </div>

            <div className="border-t border-neutral-800 pt-3 flex justify-between items-center">
              <span className="text-base font-semibold text-white">Total</span>
              <span className="text-2xl font-bold text-gold-400">
                {currency} {formatMoney(total)}
              </span>
            </div>
          </section>

          {/* Notas */}
          <div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas de la venta (opcional)…"
              rows={2}
              className="w-full bg-obsidian-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 resize-none focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          {/* Botón confirmar */}
          <Button
            onClick={handleSubmit}
            isLoading={createMutation.isPending}
            disabled={cart.length === 0}
            size="lg"
            className="w-full"
            leftIcon={<ShoppingCart className="h-4 w-4" />}
          >
            Confirmar venta · {currency} {formatMoney(total)}
          </Button>

          {cart.length === 0 && (
            <p className="text-xs text-neutral-600 text-center">
              Agrega al menos un producto para continuar.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CartRow ──────────────────────────────────────────────────────────────────

function CartRow({
  item,
  currency,
  onQtyChange,
  onDiscChange,
  onRemove,
}: {
  item: CartItem
  currency: string
  onQtyChange: (qty: number) => void
  onDiscChange: (disc: number) => void
  onRemove: () => void
}) {
  const [showDisc, setShowDisc] = useState(false)
  const lineTotal = item.unitPrice * item.quantity * (1 - item.discount / 100)
  const attrs = Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(' / ')

  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-3">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{item.productName}</p>
          {attrs && <p className="text-xs text-neutral-500 mt-0.5">{attrs}</p>}
          <p className="text-xs text-neutral-600 mt-0.5">SKU: {item.sku}</p>

          {/* Precio unitario + descuento toggle */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-neutral-500">
              {currency} {formatMoney(item.unitPrice)} c/u
            </span>
            {item.discount > 0 && (
              <Badge variant="warning" size="sm">{item.discount}% dto</Badge>
            )}
            <button
              onClick={() => setShowDisc(d => !d)}
              className="text-xs text-neutral-600 hover:text-gold-400 flex items-center gap-0.5 transition-colors"
            >
              <Tag className="h-3 w-3" />
              {showDisc ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
            </button>
          </div>

          {/* Input de descuento por ítem */}
          {showDisc && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-neutral-500">Dto.:</span>
              <input
                type="number"
                min={0}
                max={100}
                value={item.discount}
                onChange={e => onDiscChange(Number(e.target.value))}
                className="w-16 bg-obsidian-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
              <span className="text-xs text-neutral-500">%</span>
            </div>
          )}
        </div>

        {/* Controles de cantidad */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onQtyChange(item.quantity - 1)}
              className="p-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-neutral-400 hover:text-white transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-sm font-medium text-white">
              {item.quantity}
            </span>
            <button
              onClick={() => onQtyChange(item.quantity + 1)}
              disabled={item.quantity >= item.stockAvailable}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                item.quantity >= item.stockAvailable
                  ? 'bg-obsidian-900 text-neutral-700 cursor-not-allowed'
                  : 'bg-obsidian-800 hover:bg-obsidian-700 text-neutral-400 hover:text-white',
              )}
            >
              <Plus className="h-3 w-3" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-colors ml-1"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>

          {/* Subtotal del ítem */}
          <span className="text-sm font-semibold text-gold-400">
            {currency} {formatMoney(lineTotal)}
          </span>
          {item.stockAvailable <= 5 && item.stockAvailable > 0 && (
            <span className="text-xs text-amber-500">Solo {item.stockAvailable} disponibles</span>
          )}
        </div>
      </div>
    </div>
  )
}
