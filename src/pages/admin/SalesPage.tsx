import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Plus, Eye, BarChart2, Store,
  Phone, MessageCircle, CreditCard, Banknote, Wifi,
} from 'lucide-react'
import { Button }     from '@/components/ui/Button/Button'
import { Modal }      from '@/components/ui/Modal/Modal'
import { Badge }      from '@/components/ui/Badge/Badge'
import { StatCard }   from '@/components/data-display/StatCard/StatCard'
import { Pagination } from '@/components/data-display/Pagination/Pagination'
import { cn }         from '@/utils/helpers/cn'
import { useSales, useSale } from '@/features/sales/hooks/useSales'
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

function SaleDetail({ saleId }: { saleId: string }) {
  const { data: sale, isLoading } = useSale(saleId)
  if (isLoading) return <div className="py-8 text-center text-neutral-500">Cargando...</div>
  if (!sale) return null

  return (
    <div className="space-y-5">
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
        <div className="overflow-x-auto"><table className="w-full text-sm">
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
                    <button onClick={() => setDetailId(sale.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-obsidian-800 text-neutral-500 hover:text-white transition-all">
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

      <Modal open={!!detailId} onClose={() => setDetailId(null)} title="Detalle de venta">
        {detailId && <SaleDetail saleId={detailId} />}
      </Modal>
    </div>
  )
}
