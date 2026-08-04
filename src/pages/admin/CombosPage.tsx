import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Trash2, Pencil, X, Package, Loader2, PackagePlus, Power } from 'lucide-react'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/useDebounce'
import { useProducts, useProduct } from '@/features/products/hooks/useProducts'
import { useAdminCombos, useCreateCombo, useUpdateCombo, useToggleCombo, useDeleteCombo } from '@/features/combos/hooks/useCombos'
import { combosService } from '@/features/combos/combosService'
import { formatCurrency } from '@/utils/formatters/currency'
import { cn } from '@/utils/helpers/cn'
import type { Combo, CreateComboRequest } from '@/types/combo.types'
import type { ProductVariant } from '@/types/catalog.types'

interface DraftItem {
  productId: string
  variantId: string
  productName: string
  variantLabel: string
  quantity: number
  unitPrice: number
}

function ProductPicker({ onAdd }: { onAdd: (it: DraftItem) => void }) {
  const [q, setQ] = useState('')
  const [selId, setSelId] = useState<string | null>(null)
  const debounced = useDebounce(q, 300)
  const { data } = useProducts({ page: 1, pageSize: 8, search: debounced || undefined })
  const { data: detail } = useProduct(selId ?? undefined)

  const variants: ProductVariant[] = detail?.variants?.filter(v => v.isActive) ?? []

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setSelId(null) }}
          placeholder="Buscar producto para agregar…"
          className="w-full pl-9 pr-3 py-2.5 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
      </div>
      {!selId && q && data && data.items.length > 0 && (
        <div className="rounded-xl border border-neutral-800 divide-y divide-neutral-800/60 max-h-52 overflow-y-auto">
          {data.items.map(p => (
            <button key={p.id} onClick={() => { setSelId(p.id) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-obsidian-800 text-sm text-white">
              <Package className="h-3.5 w-3.5 text-neutral-500" /> {p.name}
            </button>
          ))}
        </div>
      )}
      {selId && detail && (
        <div className="rounded-xl border border-neutral-800 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-neutral-400">Variantes de <span className="text-white">{detail.name}</span></p>
            <button onClick={() => { setSelId(null); setQ('') }} className="text-neutral-500 hover:text-white"><X className="h-3.5 w-3.5" /></button>
          </div>
          {variants.length === 0 ? <p className="text-xs text-neutral-600 py-2">Sin variantes activas.</p> : (
            <div className="space-y-1.5">
              {variants.map(v => {
                const label = Object.values(v.attributes).join(' / ') || 'Único'
                const price = (v.price && v.price > 0) ? v.price : detail.basePrice
                return (
                  <div key={v.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-neutral-300">{label} · {formatCurrency(price, detail.currency)}</span>
                    <button
                      onClick={() => { onAdd({ productId: detail.id, variantId: v.id, productName: detail.name, variantLabel: label, quantity: 1, unitPrice: price }); setSelId(null); setQ('') }}
                      className="inline-flex items-center gap-1 rounded-lg bg-gold-500/10 text-gold-400 px-2 py-1 text-xs hover:bg-gold-500/20">
                      <Plus className="h-3 w-3" /> Agregar
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ComboForm({ initial, onClose }: { initial?: Combo; onClose: () => void }) {
  const create = useCreateCombo()
  const update = useUpdateCombo()
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [price, setPrice] = useState(initial ? String(initial.price) : '')
  const [items, setItems] = useState<DraftItem[]>(
    initial?.items.map(i => ({ productId: i.productId, variantId: i.variantId, productName: i.productName, variantLabel: i.variantLabel, quantity: i.quantity, unitPrice: i.unitPrice })) ?? [],
  )

  const originalTotal = useMemo(() => items.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [items])
  const comboPrice = Number(price) || 0
  const ahorro = originalTotal - comboPrice

  function addItem(it: DraftItem) {
    setItems(prev => {
      const ex = prev.find(x => x.variantId === it.variantId)
      if (ex) return prev.map(x => x.variantId === it.variantId ? { ...x, quantity: x.quantity + 1 } : x)
      return [...prev, it]
    })
  }
  function setQty(vid: string, qty: number) {
    setItems(prev => prev.map(i => i.variantId === vid ? { ...i, quantity: Math.max(1, qty) } : i))
  }
  function remove(vid: string) { setItems(prev => prev.filter(i => i.variantId !== vid)) }

  async function save() {
    if (!name.trim()) return toast.error('Ponele un nombre al combo.')
    if (items.length < 2) return toast.error('Un combo necesita al menos 2 productos.')
    if (comboPrice <= 0) return toast.error('Ingresá el precio del combo.')
    const req: CreateComboRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      price: comboPrice,
      currency: 'ARS',
      items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
    }
    const onErr = (e: any) => toast.error(e?.response?.data?.errors?.message ?? 'No se pudo guardar el combo.')
    if (initial) {
      update.mutate({ id: initial.id, data: req }, { onSuccess: () => { toast.success('Combo actualizado.'); onClose() }, onError: onErr })
    } else {
      create.mutate(req, { onSuccess: () => { toast.success('Combo creado.'); onClose() }, onError: onErr })
    }
  }

  const inputCls = 'w-full bg-obsidian-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold-500'
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto p-4">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-obsidian-950 p-5 my-8" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{initial ? 'Editar combo' : 'Nuevo combo'}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del combo (ej: Combo 3 Decants Verano)" className={inputCls} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción (opcional)" rows={2} className={inputCls + ' resize-none'} />
          <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Link de imagen — pegá el de compartir de Google Drive (se convierte solo)" className={inputCls} />

          <div>
            <p className="text-xs text-neutral-500 mb-1.5">Productos del combo</p>
            <ProductPicker onAdd={addItem} />
            {items.length > 0 && (
              <div className="mt-2 rounded-xl border border-neutral-800 divide-y divide-neutral-800/60">
                {items.map(i => (
                  <div key={i.variantId} className="flex items-center gap-2 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{i.productName}</p>
                      <p className="text-xs text-neutral-500">{i.variantLabel} · {formatCurrency(i.unitPrice, 'ARS')} c/u</p>
                    </div>
                    <input type="number" min={1} value={i.quantity} onChange={e => setQty(i.variantId, parseInt(e.target.value) || 1)}
                      className="w-14 text-center bg-obsidian-900 border border-neutral-800 rounded-lg py-1 text-sm text-white" />
                    <button onClick={() => remove(i.variantId)} className="text-neutral-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500">Precio del combo</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" className={inputCls} />
            </div>
            <div className="flex flex-col justify-end text-right text-xs">
              <span className="text-neutral-500">Precio normal: <span className="text-neutral-300">{formatCurrency(originalTotal, 'ARS')}</span></span>
              <span className={cn('font-medium', ahorro > 0 ? 'text-emerald-400' : 'text-neutral-500')}>
                Ahorro: {formatCurrency(ahorro > 0 ? ahorro : 0, 'ARS')}
              </span>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-neutral-700 text-sm text-neutral-300">Cancelar</button>
            <button onClick={save} disabled={create.isPending || update.isPending}
              className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-sm font-semibold disabled:opacity-60">
              {create.isPending || update.isPending ? 'Guardando…' : (initial ? 'Guardar cambios' : 'Crear combo')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CombosPage() {
  const { data: combos, isLoading } = useAdminCombos()
  const toggle = useToggleCombo()
  const del = useDeleteCombo()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Combo | null>(null)
  const [detailed, setDetailed] = useState<Combo | null>(null)

  // Al editar, traigo el detalle completo (por si la lista viene liviana)
  useEffect(() => {
    if (!editing) { setDetailed(null); return }
    combosService.getById(editing.id).then(setDetailed).catch(() => setDetailed(editing))
  }, [editing])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-white tracking-wide">Combos</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Packs de productos a precio especial</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm">
          <PackagePlus className="h-4 w-4" /> Nuevo combo
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-neutral-600" /></div>
      ) : !combos || combos.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 py-16 text-center text-neutral-500" style={{ background: 'var(--surface)' }}>
          <Package className="mx-auto h-10 w-10 text-neutral-700 mb-3" />
          Todavía no tenés combos. Creá el primero con "Nuevo combo".
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {combos.map(c => (
            <div key={c.id} className="rounded-2xl border border-neutral-800 p-4 flex flex-col gap-2" style={{ background: 'var(--surface)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{c.name}</p>
                  <p className="text-xs text-neutral-500">{c.itemCount} productos</p>
                </div>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full', c.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-700/30 text-neutral-500')}>
                  {c.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <ul className="text-xs text-neutral-400 space-y-0.5">
                {c.items.map(i => <li key={i.variantId}>• {i.quantity}× {i.productName} <span className="text-neutral-600">({i.variantLabel})</span></li>)}
              </ul>
              <div className="mt-1">
                <span className="text-lg font-bold text-gold-400">{formatCurrency(c.price, c.currency)}</span>
                {c.originalTotal > c.price && (
                  <span className="ml-2 text-xs text-neutral-600 line-through">{formatCurrency(c.originalTotal, c.currency)}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-800/60 mt-1">
                <button onClick={() => { setEditing(c); setShowForm(true) }} className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-neutral-300 hover:bg-obsidian-800"><Pencil className="h-3.5 w-3.5" /> Editar</button>
                <button onClick={() => toggle.mutate({ id: c.id, isActive: !c.isActive })} className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-neutral-300 hover:bg-obsidian-800"><Power className="h-3.5 w-3.5" /> {c.isActive ? 'Desactivar' : 'Activar'}</button>
                <button onClick={() => { if (confirm(`¿Eliminar el combo "${c.name}"?`)) del.mutate(c.id) }} className="inline-flex items-center justify-center p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-obsidian-800"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (!editing || detailed) && (
        <ComboForm initial={editing ? (detailed ?? undefined) : undefined} onClose={() => { setShowForm(false); setEditing(null) }} />
      )}
    </div>
  )
}
