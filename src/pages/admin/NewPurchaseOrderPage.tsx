/**
 * NewPurchaseOrderPage — Crear orden de compra
 *
 * Flujo:
 *  1. Elegir proveedor (combobox con búsqueda debounced)
 *  2. Configurar: fecha de entrega, moneda, notas
 *  3. Agregar productos: buscar, elegir variante, ingresar costo y cantidad
 *  4. Lista de ítems con controles de qty y costo editable
 *  5. Totales en tiempo real
 *  6. Confirmar → POST → toast éxito → /admin/purchases
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft, ShoppingBag, Search, Plus, Minus, Trash2,
  Building2, X, Package, Calendar, DollarSign, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/Button/Button'
import { cn }    from '@/utils/helpers/cn'
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers'
import { useProducts, useProduct } from '@/features/products/hooks/useProducts'
import { useCreatePurchaseOrder } from '@/features/purchases/hooks/usePurchases'
import type { SupplierListItem } from '@/types/supplier.types'
import type { ProductListItem, ProductVariant } from '@/types/catalog.types'
import type { CreatePurchaseOrderRequest, CreatePurchaseOrderItemRequest } from '@/types/purchase.types'
import { formatMoney } from '@/utils/helpers/formatMoney'

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface POItem {
  key:         string    // productId-variantId
  productId:   string
  variantId:   string
  productName: string
  variantSku:  string
  attributes:  Record<string, string>
  quantity:    number
  unitCost:    number
}

// ─── SupplierSearch ───────────────────────────────────────────────────────────

function SupplierSearch({
  selected,
  onSelect,
  onClear,
}: {
  selected: SupplierListItem | null
  onSelect: (s: SupplierListItem) => void
  onClear: () => void
}) {
  const [query, setQuery] = useState('')
  const [open,  setOpen]  = useState(false)
  const debounced = useDebounce(query)
  const wrapRef   = useRef<HTMLDivElement>(null)

  const { data } = useSuppliers({
    search: debounced || undefined,
    isActive: true,
    pageSize: 8,
  })

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
        <Building2 className="h-4 w-4 text-gold-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{selected.companyName}</p>
          <p className="text-xs text-neutral-500">
            {selected.email ?? ''}
            {selected.phone ? (selected.email ? ` · ${selected.phone}` : selected.phone) : ''}
          </p>
        </div>
        <button
          onClick={onClear}
          className="p-1 rounded-lg hover:bg-obsidian-800 text-neutral-500 hover:text-white transition-colors"
          title="Quitar proveedor"
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
          placeholder="Buscar proveedor por nombre…"
          className="w-full pl-9 pr-4 py-2.5 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
      </div>

      {open && data && data.items.length > 0 && (
        <div
          className="absolute z-10 top-full mt-1 w-full rounded-xl border border-neutral-800 overflow-hidden shadow-xl"
          style={{ background: 'var(--surface)' }}
        >
          {data.items.map(s => (
            <button
              key={s.id}
              onClick={() => { onSelect(s); setQuery(''); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-obsidian-800 transition-colors border-b border-neutral-800/50 last:border-0"
            >
              <Building2 className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{s.companyName}</p>
                {(s.email || s.phone) && (
                  <p className="text-xs text-neutral-500">
                    {[s.email, s.phone].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && data && data.items.length === 0 && query.length > 0 && (
        <div
          className="absolute z-10 top-full mt-1 w-full rounded-xl border border-neutral-800 overflow-hidden shadow-xl px-4 py-4 text-sm text-neutral-600 text-center"
          style={{ background: 'var(--surface)' }}
        >
          No se encontraron proveedores.
        </div>
      )}
    </div>
  )
}

// ─── ProductSearch ────────────────────────────────────────────────────────────

function ProductSearch({ onAdd, currency }: { onAdd: (item: POItem) => void; currency: string }) {
  const [query,        setQuery]        = useState('')
  const [open,         setOpen]         = useState(false)
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [selectedBase, setSelectedBase] = useState<ProductListItem | null>(null)
  const [costInputs,   setCostInputs]   = useState<Record<string, string>>({})
  const debounced = useDebounce(query)
  const wrapRef   = useRef<HTMLDivElement>(null)

  const { data: prodData } = useProducts({
    search: debounced || undefined,
    pageSize: 10,
  })

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
    setCostInputs({})
  }

  function handleAddVariant(variant: ProductVariant) {
    if (!selectedBase) return
    const costStr = costInputs[variant.id]
    const unitCost = costStr ? parseFloat(costStr) : 0
    onAdd({
      key:         `${selectedBase.id}-${variant.id}`,
      productId:   selectedBase.id,
      variantId:   variant.id,
      productName: selectedBase.name,
      variantSku:  variant.sku,
      attributes:  variant.attributes,
      quantity:    1,
      unitCost:    isNaN(unitCost) ? 0 : unitCost,
    })
    clearSelection()
  }

  function clearSelection() {
    setSelectedId(null)
    setSelectedBase(null)
    setQuery('')
    setOpen(false)
    setCostInputs({})
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
            </button>
          ))}
        </div>
      )}

      {/* Dropdown: variantes con campo de costo */}
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
              Este producto no tiene variantes activas.
            </div>
          ) : (
            variants.filter(v => v.isActive).map(v => {
              const attrs = Object.entries(v.attributes)
                .map(([k, val]) => `${k}: ${val}`).join(' / ')
              return (
                <div
                  key={v.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800/50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{attrs || 'Variante única'}</p>
                    <p className="text-xs text-neutral-500">SKU: {v.sku}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-neutral-500">{currency}</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        value={costInputs[v.id] ?? ''}
                        onChange={e => setCostInputs(prev => ({ ...prev, [v.id]: e.target.value }))}
                        onClick={e => e.stopPropagation()}
                        className="w-28 pl-10 pr-2 py-1.5 bg-obsidian-800 border border-neutral-700 rounded-lg text-xs text-white text-right focus:outline-none focus:ring-1 focus:ring-gold-500"
                      />
                    </div>
                    <button
                      onClick={() => handleAddVariant(v)}
                      className="p-1.5 rounded-lg bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 transition-colors"
                      title="Agregar"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ─── POItemRow ────────────────────────────────────────────────────────────────

function POItemRow({
  item,
  currency,
  onQtyChange,
  onCostChange,
  onRemove,
}: {
  item: POItem
  currency: string
  onQtyChange: (qty: number) => void
  onCostChange: (cost: number) => void
  onRemove: () => void
}) {
  const attrs = Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(' / ')
  const lineTotal = item.quantity * item.unitCost

  return (
    <div className="px-5 py-4 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.productName}</p>
        {attrs && <p className="text-xs text-neutral-500 mt-0.5">{attrs}</p>}
        <p className="text-xs text-neutral-600 mt-0.5">SKU: {item.variantSku}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Qty controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onQtyChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              item.quantity <= 1
                ? 'bg-obsidian-900 text-neutral-700 cursor-not-allowed'
                : 'bg-obsidian-800 hover:bg-obsidian-700 text-neutral-400 hover:text-white',
            )}
          >
            <Minus className="h-3 w-3" />
          </button>
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={e => onQtyChange(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-12 text-center bg-obsidian-900 border border-neutral-800 rounded-lg py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
          <button
            onClick={() => onQtyChange(item.quantity + 1)}
            className="p-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-neutral-400 hover:text-white transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Cost input */}
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-neutral-500">{currency}</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={item.unitCost}
            onChange={e => onCostChange(parseFloat(e.target.value) || 0)}
            className="w-28 pl-10 pr-2 py-1.5 bg-obsidian-900 border border-neutral-800 rounded-lg text-sm text-white text-right focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </div>

        {/* Line total */}
        <span className="text-sm font-semibold text-gold-400 w-28 text-right">
          {currency} {formatMoney(lineTotal)}
        </span>

        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewPurchaseOrderPage() {
  const navigate        = useNavigate()
  const createMutation  = useCreatePurchaseOrder()

  const [supplier,       setSupplier]       = useState<SupplierListItem | null>(null)
  const [deliveryDate,   setDeliveryDate]   = useState('')
  const [currency,       setCurrency]       = useState('ARS')
  const [notes,          setNotes]          = useState('')
  const [items,          setItems]          = useState<POItem[]>([])

  // ── Item management ───────────────────────────────────────────────────────

  function addItem(item: POItem) {
    setItems(prev => {
      const existing = prev.find(i => i.key === item.key)
      if (existing) {
        toast.info(`${item.productName} ya está en la lista. Ajusta la cantidad.`, { duration: 2000 })
        return prev.map(i =>
          i.key === item.key ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, item]
    })
    toast.success(`${item.productName} agregado.`, { duration: 1500 })
  }

  function removeItem(key: string) {
    setItems(prev => prev.filter(i => i.key !== key))
  }

  function setQty(key: string, qty: number) {
    if (qty < 1) { removeItem(key); return }
    setItems(prev => prev.map(i => i.key === key ? { ...i, quantity: qty } : i))
  }

  function setCost(key: string, cost: number) {
    setItems(prev => prev.map(i => i.key === key ? { ...i, unitCost: cost } : i))
  }

  // ── Totals ────────────────────────────────────────────────────────────────

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0)
  const total    = subtotal  // no tax in PO for now

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!supplier) {
      toast.error('Selecciona un proveedor antes de continuar.')
      return
    }
    if (items.length === 0) {
      toast.error('Agrega al menos un producto a la orden.')
      return
    }

    const requestItems: CreatePurchaseOrderItemRequest[] = items.map(i => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity:  i.quantity,
      unitCost:  i.unitCost,
      currency,
    }))

    const req: CreatePurchaseOrderRequest = {
      supplierId:           supplier.id,
      expectedDeliveryDate: deliveryDate || undefined,
      currency,
      notes:                notes.trim() || undefined,
      items:                requestItems,
    }

    createMutation.mutate(req, {
      onSuccess: () => {
        toast.success('Orden de compra creada correctamente.')
        navigate('/admin/purchases')
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.detail || err?.message || 'Error al crear la orden de compra.'
        toast.error(msg)
      },
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/admin/purchases"
          className="p-2 rounded-xl hover:bg-obsidian-800 text-neutral-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gold-400" />
            Nueva orden de compra
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">Registra una compra a un proveedor</p>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

        {/* ═══ Columna izquierda ════════════════════════════════════════════ */}
        <div className="space-y-5">

          {/* Proveedor */}
          <section
            className="rounded-2xl border border-neutral-800 p-5"
            style={{ background: 'var(--surface)' }}
          >
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" />Proveedor
            </h2>
            <SupplierSearch
              selected={supplier}
              onSelect={setSupplier}
              onClear={() => setSupplier(null)}
            />
          </section>

          {/* Configuración */}
          <section
            className="rounded-2xl border border-neutral-800 p-5"
            style={{ background: 'var(--surface)' }}
          >
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />Configuración
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fecha de entrega */}
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />Fecha de entrega esperada
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full bg-obsidian-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              {/* Moneda */}
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-500 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />Moneda
                </label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full bg-obsidian-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  <option value="ARS">ARS — Peso argentino</option>
                  <option value="USD">USD — Dólar americano</option>
                </select>
              </div>
            </div>

            {/* Notas */}
            <div className="mt-4 space-y-1.5">
              <label className="text-xs text-neutral-500">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Instrucciones especiales, condiciones de pago…"
                rows={2}
                className="w-full bg-obsidian-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 resize-none focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
          </section>

          {/* Productos */}
          <section
            className="rounded-2xl border border-neutral-800 p-5"
            style={{ background: 'var(--surface)' }}
          >
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Package className="h-3.5 w-3.5" />Agregar producto
            </h2>
            <ProductSearch onAdd={addItem} currency={currency} />
          </section>

          {/* Items list */}
          <section
            className="rounded-2xl border border-neutral-800 overflow-hidden"
            style={{ background: 'var(--surface)' }}
          >
            <div className="px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Ítems de la orden
              </h2>
              {items.length > 0 && (
                <button
                  onClick={() => setItems([])}
                  className="text-xs text-neutral-600 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Limpiar
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="px-5 py-12 text-center text-neutral-600 text-sm">
                No hay productos agregados.<br />
                <span className="text-neutral-700 text-xs">Busca un producto arriba para agregarlo.</span>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[1fr_auto] px-5 py-2 border-b border-neutral-800/50">
                  <span className="text-xs text-neutral-600">Producto</span>
                  <div className="flex items-center gap-2 text-xs text-neutral-600">
                    <span className="w-24 text-center">Cant.</span>
                    <span className="w-24 text-center">Costo u.</span>
                    <span className="w-24 text-right">Total</span>
                    <span className="w-8" />
                  </div>
                </div>
                <div className="divide-y divide-neutral-800/50">
                  {items.map(item => (
                    <POItemRow
                      key={item.key}
                      item={item}
                      currency={currency}
                      onQtyChange={qty  => setQty(item.key, qty)}
                      onCostChange={cost => setCost(item.key, cost)}
                      onRemove={() => removeItem(item.key)}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        {/* ═══ Columna derecha: resumen + confirmar ════════════════════════ */}
        <div className="space-y-5">

          {/* Proveedor seleccionado (resumen) */}
          {supplier && (
            <section
              className="rounded-2xl border border-gold-500/20 bg-gold-500/5 p-5 space-y-1"
            >
              <p className="text-xs font-semibold text-gold-400 uppercase tracking-wide">Proveedor</p>
              <p className="text-sm font-medium text-white">{supplier.companyName}</p>
              {supplier.email && <p className="text-xs text-neutral-500">{supplier.email}</p>}
              {supplier.phone && <p className="text-xs text-neutral-500">{supplier.phone}</p>}
            </section>
          )}

          {/* Totales */}
          <section
            className="rounded-2xl border border-neutral-800 p-5 space-y-3"
            style={{ background: 'var(--surface)' }}
          >
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Resumen
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-neutral-400">
                <span>Ítems</span>
                <span>{items.length}</span>
              </div>
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

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            isLoading={createMutation.isPending}
            disabled={!supplier || items.length === 0}
            size="lg"
            className="w-full"
            leftIcon={<ShoppingBag className="h-4 w-4" />}
          >
            Crear orden de compra
          </Button>

          {(!supplier || items.length === 0) && (
            <p className="text-xs text-neutral-600 text-center">
              {!supplier
                ? 'Selecciona un proveedor para continuar.'
                : 'Agrega al menos un producto para continuar.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
