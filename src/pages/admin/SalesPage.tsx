import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Plus, Eye, BarChart2, Store,
  Phone, MessageCircle, CreditCard, Banknote, Wifi, Pencil, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button }     from '@/components/ui/Button/Button'
import { Modal }      from '@/components/ui/Modal/Modal'
import { Badge }      from '@/components/ui/Badge/Badge'
import { StatCard }   from '@/components/data-display/StatCard/StatCard'
import { Pagination } from '@/components/data-display/Pagination/Pagination'
import { cn }         from '@/utils/helpers/cn'
import { useSales, useSale, useUpdateSale, useDeleteSale } from '@/features/sales/hooks/useSales'
import type { SaleListItem, SaleChannel } from '@/types/sale.types'
import { formatMoney } from '@/utils/helpers/formatMoney'

// ─── Config ──────────────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<SaleChannel, { label: string; icon: React.ReactNode }> = {
  InStore:  { label: 'Tienda física', icon: <Store className="h-3.5 w-3.5" /> },
  Phone:    { label: 'Teléfono',      icon: <Phone className="h-3.5 w-3.5" /> },
  WhatsApp: { label: 'WhatsApp',      icon: <MessageCircle className="h-3.5 w-3.5" /> },
  Other:    { label: 'Otro',          icon: <ShoppingCart className="h-3.5 w-3.5" /> },
}

const PAYMENT_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  Cash:     { label: 'Efectivo',      icon: <Banknote className="h-3.5 w-3.5" /> },
  Card:     { label: 'Tarjeta',       icon: <CreditCard className="h-3.5 w-3.5" /> },
  Transfer: { label: 'Transferencia', icon: <Wifi className="h-3.5 w-3.5" /> },
  QR:       { label: 'QR / Yape',     icon: <Wifi className="h-3.5 w-3.5" /> },
  Mixed:    { label: 'Mixto',         icon: <CreditCard className="h-3.5 w-3.5" /> },
}

// ─── Schema ──────────────────────────────────────────────────────────────────

// ─── Sale Detail ─────────────────────────────────────────────────────────────

function SaleEditForm({ sale, onDone }: { sale: any; onDone: () => void }) {
  const { mutate, isPending } = useUpdateSale()
  const [date, setDate] = useState((sale.createdAt ?? '').slice(0, 10))
  const [payment, setPayment] = useState<string>(sale.paymentMethod ?? 'Cash')
  const [customerName, setCustomerName] = useState(sale.customerName ?? '')
  const [notes, setNotes] = useState(sale.notes ?? '')

  function save() {
    mutate({ id: sale.id, data: {
      paymentMethod: payment,
      notes: notes.trim() || undefined,
      customerName: customerName.trim() || undefined,
      saleDate: date ? `${date}T12:00:00Z` : undefined,
    } }, {
      onSuccess: () => { toast.success('Venta actualizada.'); onDone() },
      onError: (e: any) => toast.error(e?.response?.data?.errors?.message ?? 'No se pudo actualizar la venta.'),
    })
  }

  const inputCls = 'w-full bg-obsidian-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold-500'
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-white">Editar venta {sale.saleNumber}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1.5">Fecha</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1.5">Método de pago</label>
          <select value={payment} onChange={e => setPayment(e.target.value)} className={inputCls}>
            {Object.entries(PAYMENT_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1.5">Cliente (opcional)</label>
        <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nombre del cliente" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1.5">Notas (opcional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inputCls + ' resize-none'} />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onDone} className="px-4 py-2 rounded-xl border border-neutral-700 text-sm text-neutral-300 hover:text-white">Cancelar</button>
        <Button onClick={save} loading={isPending}>Guardar cambios</Button>
      </div>
      <p className="text-[11px] text-neutral-600">Nota: se editan fecha, pago, cliente y notas. Los productos y montos no se modifican (para eso, borrá y volvé a crear la venta).</p>
    </div>
  )
}

function SaleDetail({ saleId, onClose }: { saleId: string; onClose: () => void }) {
  const { data: sale, isLoading } = useSale(saleId)
  const [editing, setEditing] = useState(false)
  const del = useDeleteSale()
  if (isLoading) return <div className="py-8 text-center text-neutral-500">Cargando...</div>
  if (!sale) return null

  if (editing) return <SaleEditForm sale={sale} onDone={() => setEditing(false)} />

  function handleDelete() {
    if (!confirm(`¿Eliminar la venta ${sale!.saleNumber}? Esta acción no se puede deshacer y devuelve el stock.`)) return
    del.mutate(sale!.id, {
      onSuccess: () => { toast.success('Venta eliminada.'); onClose() },
      onError: (e: any) => toast.error(e?.response?.data?.errors?.message ?? 'No se pudo eliminar la venta.'),
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 text-xs text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
        <button
          onClick={handleDelete}
          disabled={del.isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> {del.isPending ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-obsidian-900 rounded-xl p-4">
          <p className="text-xs text-neutral-500">Número de venta</p>
          <p className="text-lg font-mono text-white mt-1">{sale.saleNumber}</p>
        </div>
        <div className="bg-obsidian-900 rounded-xl p-4">
          <p className="text-xs text-neutral-500">Total cobrado</p>
          <p className="text-lg font-semibold text-gold-400 mt-1">{sale.currency} {formatMoney(sale.total)}</p>
        </div>
      </div>

      {/* Subtotal y descuento (si hubo) */}
      {sale.discountAmount > 0 && (
        <div className="bg-obsidian-900 rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Subtotal (sin descuento)</span>
            <span className="text-neutral-300">{sale.currency} {formatMoney(sale.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Descuento aplicado</span>
            <span className="text-red-400">− {sale.currency} {formatMoney(sale.discountAmount)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-neutral-800 pt-1.5 mt-0.5">
            <span className="text-white font-medium">Total cobrado</span>
            <span className="text-gold-400 font-semibold">{sale.currency} {formatMoney(sale.total)}</span>
          </div>
        </div>
      )}

      {/* Costo y ganancia */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-obsidian-900 rounded-xl p-4">
          <p className="text-xs text-neutral-500">Costo</p>
          <p className="text-base font-medium text-neutral-300 mt-1">{sale.currency} {formatMoney(sale.totalCost)}</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-emerald-400/80">Ganancia</p>
          <p className="text-lg font-semibold text-emerald-400 mt-1">{sale.currency} {formatMoney(sale.profit)}</p>
        </div>
      </div>

      <div className="bg-obsidian-900 rounded-xl p-4 grid grid-cols-2 gap-3">
        <div><p className="text-xs text-neutral-500">Canal</p><p className="text-sm text-white mt-1">{CHANNEL_CONFIG[sale.channel]?.label ?? sale.channel}</p></div>
        <div><p className="text-xs text-neutral-500">Pago</p><p className="text-sm text-white mt-1">{PAYMENT_CONFIG[sale.paymentMethod]?.label ?? sale.paymentMethod}</p></div>
        {sale.customerName && <div><p className="text-xs text-neutral-500">Cliente</p><p className="text-sm text-white mt-1">{sale.customerName}</p></div>}
        <div><p className="text-xs text-neutral-500">Fecha</p><p className="text-sm text-white mt-1">{new Date(sale.createdAt).toLocaleString('es-AR')}</p></div>
      </div>

      <div>
        <p className="text-sm font-medium text-neutral-300 mb-2">Productos</p>
        <div className="space-y-2">
          {sale.items.map(item => (
            <div key={item.id} className="bg-obsidian-900 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-white">{item.productName}</p>
                <p className="text-xs text-neutral-500">SKU: {item.sku}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white">{item.currency} {formatMoney(item.total)}</p>
                <p className="text-xs text-neutral-500">x{item.quantity} × {formatMoney(item.unitPrice)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data, isLoading } = useSales({
    page, pageSize: 20,
    from: fromDate || undefined,
    to: toDate || undefined,
  })

  const totalRevenue = data?.items.reduce((acc, s) => acc + s.total, 0) ?? 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Ventas</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Registro de ventas directas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" leftIcon={<BarChart2 className="h-4 w-4" />} onClick={() => window.location.href = '/admin/sales/reports'}>
            Reportes
          </Button>
          <Button onClick={() => navigate('/admin/sales/new')} leftIcon={<Plus className="h-4 w-4" />}>
            Nueva venta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total ventas" value={data?.totalCount ?? 0} icon={<ShoppingCart className="h-5 w-5" />} />
        <StatCard label="Ingresos (página)" value={`ARS ${formatMoney(totalRevenue)}`} icon={<Banknote className="h-5 w-5 text-gold-400" />} variant="gold" />
        <StatCard label="Ticket promedio" value={`ARS ${data?.totalCount ? (totalRevenue / data.items.length).toFixed(2) : '0.00'}`} icon={<CreditCard className="h-5 w-5" />} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-obsidian-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white" />
        <span className="self-center text-neutral-600">hasta</span>
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-obsidian-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ background: 'var(--surface)' }}>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-neutral-800">
            <tr>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Venta</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Cliente</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Canal</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Pago</th>
              <th className="text-center px-4 py-3 text-neutral-500 font-medium">Ítems</th>
              <th className="text-right px-4 py-3 text-neutral-500 font-medium">Total</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Fecha</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-t border-neutral-800/50">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-neutral-800 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : data?.items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-neutral-600">No hay ventas en este período</td></tr>
            ) : (
              data?.items.map((sale) => (
                <tr key={sale.id} className="border-t border-neutral-800/50 hover:bg-obsidian-800/30 transition-colors group">
                  <td className="px-4 py-3 font-mono text-sm text-white">{sale.saleNumber}</td>
                  <td className="px-4 py-3 text-neutral-300">{sale.customerName ?? <span className="text-neutral-600 italic">Sin cliente</span>}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                      {CHANNEL_CONFIG[sale.channel]?.icon}
                      {CHANNEL_CONFIG[sale.channel]?.label ?? sale.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                      {PAYMENT_CONFIG[sale.paymentMethod]?.icon}
                      {PAYMENT_CONFIG[sale.paymentMethod]?.label ?? sale.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-400">{sale.itemCount}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-gold-400 font-medium">{sale.currency} {formatMoney(sale.total)}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">
                    {new Date(sale.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDetailId(sale.id)} title="Ver detalle" className="p-1.5 rounded-lg text-neutral-400 hover:bg-obsidian-800 hover:text-white transition-all sm:opacity-0 sm:group-hover:opacity-100">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>
      </div>

      {data && data.totalCount > 20 && (
        <Pagination page={page} pageSize={20} total={data.totalCount} onPageChange={setPage} />
      )}

      <Modal isOpen={!!detailId} onClose={() => setDetailId(null)} title="Detalle de venta">
        {detailId && <SaleDetail saleId={detailId} onClose={() => setDetailId(null)} />}
      </Modal>
    </div>
  )
}
