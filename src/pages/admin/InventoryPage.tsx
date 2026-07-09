import { useState } from 'react'
import {
  AlertTriangle, Package, Layers, TrendingDown, RefreshCw,
  X, Loader2, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLowStock, useAdjustStock } from '@/features/inventory/hooks/useInventory'
import { useProducts } from '@/features/products/hooks/useProducts'
import { cn } from '@/utils/helpers/cn'
import type { LowStockItem } from '@/types/catalog.types'

// ─── Adjust Stock Modal ────────────────────────────────────────────────────────

const adjustSchema = z.object({
  newQuantity: z.coerce.number().min(0, 'Cantidad no puede ser negativa'),
  reason: z.string().min(3, 'Motivo requerido (mín 3 caracteres)').max(500),
})

type AdjustFormValues = z.infer<typeof adjustSchema>

function AdjustStockModal({ item, onClose }: { item: LowStockItem; onClose: () => void }) {
  const { mutate: adjust, isPending } = useAdjustStock()
  const { register, handleSubmit, formState: { errors } } = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { newQuantity: item.stockQuantity, reason: '' },
  })

  const onSubmit = (values: AdjustFormValues) => {
    adjust({
      productId: item.productId,
      variantId: item.variantId,
      newQuantity: values.newQuantity,
      reason: values.reason,
    }, { onSuccess: onClose })
  }

  const inputCls = 'w-full px-3 py-2 rounded-xl text-sm bg-obsidian-800 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500/50'
  const labelCls = 'text-xs font-medium text-neutral-400 mb-1 block'

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-neutral-800 shadow-2xl" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h2 className="font-semibold text-white text-sm">Ajustar stock</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-obsidian-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-3 bg-obsidian-800/50 border-b border-neutral-800">
          <p className="text-sm font-medium text-white">{item.productName}</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            SKU: {item.variantSku} · Stock actual: <span className="text-yellow-400 font-medium">{item.stockQuantity}</span>
          </p>
          {Object.entries(item.attributes).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(item.attributes).map(([k, v]) => (
                <span key={k} className="text-xs px-1.5 py-0.5 rounded bg-obsidian-700 text-neutral-400">
                  {k}: {v}
                </span>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Nueva cantidad *</label>
            <input {...register('newQuantity')} type="number" className={inputCls} />
            {errors.newQuantity && <p className="text-xs text-red-400 mt-0.5">{errors.newQuantity.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Motivo del ajuste *</label>
            <textarea {...register('reason')} rows={2} className={cn(inputCls, 'resize-none')} placeholder="Ej. Recepción de mercadería, corrección de inventario..." />
            {errors.reason && <p className="text-xs text-red-400 mt-0.5">{errors.reason.message}</p>}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-sm text-neutral-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ajustar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Low Stock Row ─────────────────────────────────────────────────────────────

function LowStockRow({ item, onAdjust }: { item: LowStockItem; onAdjust: (item: LowStockItem) => void }) {
  const isZero = item.stockQuantity === 0

  return (
    <tr className="border-b border-neutral-800/60 hover:bg-obsidian-800/30 transition-colors group">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-white">{item.productName}</p>
        <p className="text-xs text-neutral-500">{item.variantSku}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {Object.entries(item.attributes).length > 0
            ? Object.entries(item.attributes).map(([k, v]) => (
                <span key={k} className="text-xs px-1.5 py-0.5 rounded bg-obsidian-700 text-neutral-400">{k}: {v}</span>
              ))
            : <span className="text-xs text-neutral-600">—</span>}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={cn('text-sm font-semibold', isZero ? 'text-red-400' : 'text-yellow-400')}>
          {item.stockQuantity}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-neutral-500">{item.minStockThreshold}</td>
      <td className="px-4 py-3">
        <span className={cn(
          'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
          isZero ? 'bg-red-500/10 text-red-400' : 'bg-yellow-400/10 text-yellow-400'
        )}>
          <TrendingDown className="h-3 w-3" />
          {isZero ? 'Sin stock' : `Déficit: ${item.deficit}`}
        </span>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onAdjust(item)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 transition-colors opacity-0 group-hover:opacity-100"
        >
          Ajustar
        </button>
      </td>
    </tr>
  )
}

// ─── Página ────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [adjustTarget, setAdjustTarget] = useState<LowStockItem | null>(null)

  const { data: lowStock, isLoading, refetch } = useLowStock()
  const { data: productsData } = useProducts({ pageSize: 1, status: 'Published' })

  const outOfStock = lowStock?.filter(i => i.stockQuantity === 0) ?? []
  const belowMin   = lowStock?.filter(i => i.stockQuantity > 0) ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-white tracking-wide">Inventario</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Control de stock y movimientos</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-800 text-sm text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Actualizar
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Productos publicados',
            value: productsData?.totalCount ?? '—',
            icon: Package,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
          },
          {
            label: 'Alertas de stock',
            value: lowStock?.length ?? '—',
            icon: AlertTriangle,
            color: 'text-yellow-400',
            bg: 'bg-yellow-400/10',
          },
          {
            label: 'Sin stock',
            value: outOfStock.length,
            icon: TrendingDown,
            color: 'text-red-400',
            bg: 'bg-red-400/10',
          },
          {
            label: 'Stock bajo',
            value: belowMin.length,
            icon: Layers,
            color: 'text-orange-400',
            bg: 'bg-orange-400/10',
          },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-neutral-800 p-4" style={{ background: 'var(--surface)' }}>
            <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center mb-3', s.bg)}>
              <s.icon className={cn('h-4 w-4', s.color)} />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Low stock table */}
      <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ background: 'var(--surface)' }}>
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <h2 className="font-medium text-white text-sm">Alertas de stock bajo</h2>
          {lowStock && lowStock.length > 0 && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400">
              {lowStock.length} alerta{lowStock.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
          </div>
        ) : !lowStock?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-10 w-10 text-neutral-700 mb-3" />
            <p className="text-neutral-400 font-medium">Todo el stock está en orden</p>
            <p className="text-neutral-600 text-sm mt-1">No hay productos por debajo del umbral mínimo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-800 bg-obsidian-800/30">
                  {['Producto', 'Atributos', 'Stock actual', 'Mínimo', 'Estado', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item) => (
                  <LowStockRow key={item.variantId} item={item} onAdjust={setAdjustTarget} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {adjustTarget && <AdjustStockModal item={adjustTarget} onClose={() => setAdjustTarget(null)} />}
    </div>
  )
}
