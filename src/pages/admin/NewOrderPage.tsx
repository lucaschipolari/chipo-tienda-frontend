/**
 * Nuevo Pedido — con soporte de invitado y checkout completo
 *
 * Secciones:
 *  A. Comprador (cliente registrado o invitado)
 *  B. Productos (búsqueda + carrito)
 *  C. Entrega (Delivery con dirección / Pickup)
 *  D. Pago y notas
 *  E. Totales + submit
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft, Search, Plus, Minus, Trash2,
  User, X, CreditCard, Banknote, Smartphone, QrCode,
  Package, Truck, Store, Users, UserX,
} from 'lucide-react'
import { Button } from '@/components/ui/Button/Button'
import { cn } from '@/utils/helpers/cn'
import { useCustomers } from '@/features/customers/hooks/useCustomers'
import { useProducts, useProduct } from '@/features/products/hooks/useProducts'
import { useCreateOrder } from '@/features/orders/hooks/useOrders'
import type { CustomerListItem } from '@/types/customer.types'
import type { ProductListItem, ProductVariant } from '@/types/catalog.types'
import type {
  CreateOrderRequest,
  CreateOrderItemRequest,
  CreateOrderAddressRequest,
  PaymentMethod,
  DeliveryMethod,
} from '@/types/order.types'
import { formatMoney } from '@/utils/helpers/formatMoney'

// ─── Constantes ───────────────────────────────────────────────────────────────

const CURRENCY_OPTIONS: { value: 'ARS' | 'USD'; label: string; symbol: string }[] = [
  { value: 'ARS', label: 'ARS — Peso argentino', symbol: '$' },
  { value: 'USD', label: 'USD — Dólar',          symbol: 'US$' },
]

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'Cash',     label: 'Efectivo',         icon: <Banknote   className="h-5 w-5" /> },
  { value: 'Card',     label: 'Tarjeta',          icon: <CreditCard className="h-5 w-5" /> },
  { value: 'Transfer', label: 'Transferencia',    icon: <Smartphone className="h-5 w-5" /> },
  { value: 'QR',       label: 'QR / Mercado Pago',icon: <QrCode     className="h-5 w-5" /> },
  { value: 'Mixed',    label: 'Mixto',            icon: <span className="text-sm font-bold">M</span> },
]

// ─── Cart item type ───────────────────────────────────────────────────────────

interface CartItem {
  key: string
  productId: string
  variantId: string
  productName: string
  sku: string
  attributes: Record<string, string>
  unitPrice: number
  quantity: number
  discount: number
  stockAvailable: number
}

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 350): T {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return d
}

// ─── Customer Search combobox ─────────────────────────────────────────────────

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
  const [open, setOpen] = useState(false)
  const debounced = useDebounce(query)
  const wrapRef = useRef<HTMLDivElement>(null)

  const { data } = useCustomers({ search: debounced || undefined, isActive: true, pageSize: 8 })

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
          placeholder="Buscar cliente por nombre o documento…"
          className="w-full pl-9 pr-4 py-2.5 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
      </div>
      {open && data && data.items.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full rounded-xl border border-neutral-800 overflow-hidden shadow-xl bg-obsidian-900">
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

// ─── Product Search ───────────────────────────────────────────────────────────

function ProductSearch({ onAdd }: { onAdd: (item: CartItem) => void }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedBase, setSelectedBase] = useState<ProductListItem | null>(null)
  const debounced = useDebounce(query)
  const wrapRef = useRef<HTMLDivElement>(null)

  const { data: prodData } = useProducts({ search: debounced || undefined, pageSize: 10, status: 'Published' })
  const { data: prodDetail, isLoading: loadingDetail } = useProduct(selectedId ?? undefined)

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
      key: `${selectedBase.id}-${variant.id}`,
      productId: selectedBase.id,
      variantId: variant.id,
      productName: selectedBase.name,
      sku: variant.sku,
      attributes: variant.attributes,
      unitPrice: variant.price || selectedBase.basePrice,
      quantity: 1,
      discount: 0,
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
          <button onClick={clearSelection} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Lista de productos */}
      {open && !selectedId && prodData && prodData.items.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full rounded-xl border border-neutral-800 overflow-hidden shadow-xl bg-obsidian-900">
          {prodData.items.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectProduct(p)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-obsidian-800 transition-colors border-b border-neutral-800/50 last:border-0"
            >
              <Package className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{p.name}</p>
                <p className="text-xs text-neutral-500">{p.categoryName}</p>
              </div>
              <span className="text-xs text-gold-400 font-medium shrink-0">
                {(p.basePrice || 0).toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Selector de variantes */}
      {selectedId && (
        <div className="mt-3 border border-neutral-800 rounded-xl overflow-hidden">
          {loadingDetail ? (
            <div className="px-4 py-3 text-sm text-neutral-500">Cargando variantes…</div>
          ) : variants.length === 0 ? (
            <div className="px-4 py-3 text-sm text-neutral-500">Sin variantes disponibles</div>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-neutral-800 bg-obsidian-900">
                <p className="text-xs text-neutral-500">Selecciona una variante de <span className="text-white">{selectedBase?.name}</span></p>
              </div>
              {variants.map(v => (
                <button
                  key={v.id}
                  onClick={() => handleAddVariant(v)}
                  disabled={v.stockQuantity === 0}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2.5 text-left border-b border-neutral-800/50 last:border-0 transition-colors',
                    v.stockQuantity === 0
                      ? 'opacity-40 cursor-not-allowed bg-obsidian-900'
                      : 'hover:bg-obsidian-800 bg-obsidian-900',
                  )}
                >
                  <div>
                    <p className="text-sm text-white">
                      {Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(' · ') || v.sku}
                    </p>
                    <p className="text-xs text-neutral-500">SKU: {v.sku} · Stock: {v.stockQuantity}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm text-gold-400 font-medium">
                      {(v.price || selectedBase?.basePrice || 0).toFixed(2)}
                    </span>
                    <Plus className="h-4 w-4 text-neutral-400" />
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

function CartTable({
  items,
  onQtyChange,
  onRemove,
}: {
  items: CartItem[]
  onQtyChange: (key: string, qty: number) => void
  onRemove: (key: string) => void
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-600 text-sm border border-dashed border-neutral-800 rounded-xl">
        Sin productos. Busca un producto arriba para agregar al pedido.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map(item => {
        const lineTotal = item.unitPrice * item.quantity * (1 - item.discount / 100)
        return (
          <div key={item.key} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-800 bg-obsidian-900">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{item.productName}</p>
              <p className="text-xs text-neutral-500">
                {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(' · ') || item.sku}
              </p>
              <p className="text-xs text-neutral-600 mt-0.5">SKU: {item.sku}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onQtyChange(item.key, item.quantity - 1)}
                className="h-7 w-7 rounded-lg border border-neutral-700 flex items-center justify-center hover:bg-obsidian-800 transition-colors text-neutral-400 hover:text-white"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-8 text-center text-sm text-white font-medium">{item.quantity}</span>
              <button
                onClick={() => onQtyChange(item.key, item.quantity + 1)}
                disabled={item.quantity >= item.stockAvailable}
                className="h-7 w-7 rounded-lg border border-neutral-700 flex items-center justify-center hover:bg-obsidian-800 transition-colors text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="text-right shrink-0 min-w-[80px]">
              <p className="text-sm font-medium text-gold-400">{formatMoney(lineTotal)}</p>
              <p className="text-xs text-neutral-600">{formatMoney(item.unitPrice)} c/u</p>
            </div>
            <button
              onClick={() => onRemove(item.key)}
              className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─── Address Form ─────────────────────────────────────────────────────────────

function AddressForm({
  value,
  onChange,
  label,
}: {
  value: CreateOrderAddressRequest
  onChange: (v: CreateOrderAddressRequest) => void
  label?: string
}) {
  function set(field: keyof CreateOrderAddressRequest, val: string) {
    onChange({ ...value, [field]: val })
  }

  return (
    <div className="space-y-3">
      {label && <p className="text-sm font-medium text-neutral-300">{label}</p>}
      <input
        value={value.street}
        onChange={e => set('street', e.target.value)}
        placeholder="Calle / Av. y número *"
        className="w-full px-4 py-2.5 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          value={value.city}
          onChange={e => set('city', e.target.value)}
          placeholder="Ciudad *"
          className="px-4 py-2.5 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
        <input
          value={value.state ?? ''}
          onChange={e => set('state', e.target.value)}
          placeholder="Provincia / Estado"
          className="px-4 py-2.5 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          value={value.postalCode ?? ''}
          onChange={e => set('postalCode', e.target.value)}
          placeholder="Código postal"
          className="px-4 py-2.5 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
        <input
          value={value.country}
          onChange={e => set('country', e.target.value)}
          placeholder="País *"
          className="px-4 py-2.5 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-800 p-6 space-y-4" style={{ background: 'var(--surface)' }}>
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {children}
    </div>
  )
}

// ─── Toggle button ────────────────────────────────────────────────────────────

function ToggleBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors',
        active
          ? 'border-gold-500/50 bg-gold-500/10 text-gold-400'
          : 'border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

// ─── EMPTY ADDRESS ────────────────────────────────────────────────────────────

const emptyAddress = (): CreateOrderAddressRequest => ({
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Argentina',
})

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function NewOrderPage() {
  const navigate = useNavigate()
  const createOrder = useCreateOrder()

  // A. Comprador
  const [buyerMode, setBuyerMode] = useState<'registered' | 'guest'>('registered')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem | null>(null)
  const [guestFirstName, setGuestFirstName] = useState('')
  const [guestLastName, setGuestLastName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')

  // B. Productos
  const [cart, setCart] = useState<CartItem[]>([])

  // C. Entrega
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Delivery')
  const [shippingAddress, setShippingAddress] = useState<CreateOrderAddressRequest>(emptyAddress())
  const [shippingCost, setShippingCost] = useState(0)

  // D. Pago y moneda
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [notes, setNotes] = useState('')

  // Totals (IVA incluído en precios — sin cálculo adicional)
  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity * (1 - i.discount / 100), 0)
  const total = subtotal + shippingCost

  const currencySymbol = CURRENCY_OPTIONS.find(o => o.value === currency)?.symbol ?? '$'

  function addToCart(item: CartItem) {
    setCart(prev => {
      const existing = prev.find(i => i.key === item.key)
      if (existing) {
        return prev.map(i =>
          i.key === item.key
            ? { ...i, quantity: Math.min(i.quantity + 1, i.stockAvailable) }
            : i,
        )
      }
      return [...prev, item]
    })
  }

  function setQty(key: string, qty: number) {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.key !== key))
    } else {
      setCart(prev => prev.map(i => i.key === key ? { ...i, quantity: Math.min(qty, i.stockAvailable) } : i))
    }
  }

  function removeFromCart(key: string) {
    setCart(prev => prev.filter(i => i.key !== key))
  }

  async function handleSubmit() {
    // Validaciones
    const buyerName = buyerMode === 'registered'
      ? (selectedCustomer?.fullName ?? '')
      : `${guestFirstName.trim()} ${guestLastName.trim()}`.trim()

    const buyerEmail = buyerMode === 'registered'
      ? (selectedCustomer?.email ?? '')
      : guestEmail.trim()

    if (!buyerName) {
      toast.error(buyerMode === 'registered' ? 'Selecciona un cliente' : 'Ingresa el nombre del comprador')
      return
    }
    if (!buyerEmail) {
      toast.error('El email del comprador es requerido')
      return
    }
    if (cart.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }
    if (deliveryMethod === 'Delivery') {
      if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.country) {
        toast.error('Completa la dirección de envío')
        return
      }
    }

    const items: CreateOrderItemRequest[] = cart.map(i => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity: i.quantity,
      discount: i.discount > 0 ? i.discount : undefined,
    }))

    const payload: CreateOrderRequest = {
      customerId: buyerMode === 'registered' ? selectedCustomer?.id : undefined,
      buyerName,
      buyerEmail,
      buyerPhone: buyerMode === 'registered'
        ? (selectedCustomer?.phone ?? undefined)
        : (guestPhone.trim() || undefined),
      items,
      shippingAddress: deliveryMethod === 'Delivery'
        ? shippingAddress
        : { street: 'Retiro en tienda', city: 'Buenos Aires', country: 'Argentina' },
      shippingCost: shippingCost > 0 ? shippingCost : undefined,
      currency,
      paymentMethod: paymentMethod ?? undefined,
      deliveryMethod,
      notes: notes.trim() || undefined,
    }

    try {
      await createOrder.mutateAsync(payload)
      navigate('/admin/orders')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Error al crear el pedido')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/admin/orders"
          className="p-2 rounded-xl border border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white">Nuevo pedido</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Crea un pedido para un cliente registrado o invitado</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* A. Comprador */}
          <Section title="A. Comprador">
            <div className="flex gap-2">
              <ToggleBtn
                active={buyerMode === 'registered'}
                onClick={() => setBuyerMode('registered')}
                icon={<Users className="h-4 w-4" />}
                label="Cliente registrado"
              />
              <ToggleBtn
                active={buyerMode === 'guest'}
                onClick={() => setBuyerMode('guest')}
                icon={<UserX className="h-4 w-4" />}
                label="Invitado"
              />
            </div>

            {buyerMode === 'registered' ? (
              <CustomerSearch
                selected={selectedCustomer}
                onSelect={setSelectedCustomer}
                onClear={() => setSelectedCustomer(null)}
              />
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={guestFirstName}
                    onChange={e => setGuestFirstName(e.target.value)}
                    placeholder="Nombre *"
                    className="px-4 py-2.5 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                  <input
                    value={guestLastName}
                    onChange={e => setGuestLastName(e.target.value)}
                    placeholder="Apellido *"
                    className="px-4 py-2.5 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  placeholder="Email *"
                  className="w-full px-4 py-2.5 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={e => setGuestPhone(e.target.value)}
                  placeholder="Teléfono (opcional)"
                  className="w-full px-4 py-2.5 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            )}
          </Section>

          {/* B. Productos */}
          <Section title="B. Productos">
            <ProductSearch onAdd={addToCart} />
            <CartTable items={cart} onQtyChange={setQty} onRemove={removeFromCart} />
          </Section>

          {/* C. Entrega */}
          <Section title="C. Entrega">
            <div className="flex gap-2">
              <ToggleBtn
                active={deliveryMethod === 'Delivery'}
                onClick={() => setDeliveryMethod('Delivery')}
                icon={<Truck className="h-4 w-4" />}
                label="Delivery"
              />
              <ToggleBtn
                active={deliveryMethod === 'Pickup'}
                onClick={() => setDeliveryMethod('Pickup')}
                icon={<Store className="h-4 w-4" />}
                label="Pickup"
              />
            </div>

            {deliveryMethod === 'Delivery' ? (
              <div className="space-y-3">
                <AddressForm value={shippingAddress} onChange={setShippingAddress} label="Dirección de envío" />
                <div className="flex items-center gap-3">
                  <label className="text-sm text-neutral-400 shrink-0">Costo de envío ({currencySymbol})</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={shippingCost}
                    onChange={e => setShippingCost(parseFloat(e.target.value) || 0)}
                    className="w-32 px-4 py-2 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-800 bg-obsidian-900">
                <Store className="h-5 w-5 text-gold-400 shrink-0" />
                <p className="text-sm text-neutral-300">El cliente retira en tienda. No se requiere dirección.</p>
              </div>
            )}
          </Section>

          {/* D. Pago y notas */}
          <Section title="D. Pago y notas">
            <div>
              <p className="text-sm text-neutral-400 mb-2">Método de pago</p>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMethod(prev => prev === opt.value ? null : opt.value)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors',
                      paymentMethod === opt.value
                        ? 'border-gold-500/50 bg-gold-500/10 text-gold-400'
                        : 'border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700',
                    )}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-neutral-400 mb-2">Notas internas (opcional)</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Instrucciones especiales, referencias de pago, etc."
                rows={3}
                className="w-full px-4 py-2.5 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500 resize-none"
              />
            </div>
          </Section>
        </div>

        {/* Right column — totales */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-800 p-6 space-y-4 sticky top-6" style={{ background: 'var(--surface)' }}>
            <h2 className="text-base font-semibold text-white">Resumen</h2>

            {/* Selector de moneda */}
            <div className="flex gap-2">
              {CURRENCY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCurrency(opt.value)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors',
                    currency === opt.value
                      ? 'border-gold-500/50 bg-gold-500/10 text-gold-400'
                      : 'border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700',
                  )}
                >
                  {opt.value}
                </button>
              ))}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Subtotal</span>
                <span className="text-white">{currencySymbol} {formatMoney(subtotal)}</span>
              </div>
              {shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Envío</span>
                  <span className="text-white">{currencySymbol} {formatMoney(shippingCost)}</span>
                </div>
              )}
              <p className="text-xs text-neutral-600">IVA incluído en los precios</p>
              <div className="flex justify-between text-base font-semibold pt-3 border-t border-neutral-800">
                <span className="text-white">Total</span>
                <span className="text-gold-400">{currency} {formatMoney(total)}</span>
              </div>
            </div>

            {cart.length > 0 && (
              <div className="text-xs text-neutral-600 space-y-1">
                <p>{cart.length} línea{cart.length !== 1 ? 's' : ''} · {cart.reduce((s, i) => s + i.quantity, 0)} unidades</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={createOrder.isPending || cart.length === 0}
              className={cn(
                'w-full py-3 px-4 rounded-xl text-sm font-semibold transition-colors',
                'bg-gold-500 hover:bg-gold-400 text-obsidian-900',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {createOrder.isPending ? 'Creando pedido…' : 'Crear pedido'}
            </button>

            <Link
              to="/admin/orders"
              className="block text-center text-sm text-neutral-500 hover:text-white transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
