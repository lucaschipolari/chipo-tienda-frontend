import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList, Search, Eye, Plus,
  Clock, CheckCircle2, Truck, Package, XCircle, DollarSign, RotateCcw,
  AlertCircle, User, MapPin, CreditCard,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal/Modal'
import { Badge } from '@/components/ui/Badge/Badge'
import { Pagination } from '@/components/data-display/Pagination/Pagination'
import { StatCard } from '@/components/data-display/StatCard/StatCard'
import { cn } from '@/utils/helpers/cn'
import { useOrders, useOrder, useChangeOrderStatus } from '@/features/orders/hooks/useOrders'
import type { OrderListItem, OrderStatus, Order, DeliveryMethod } from '@/types/order.types'
import { formatMoney } from '@/utils/helpers/formatMoney'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  Pending:    { label: 'Pendiente',   color: 'text-amber-400',   bg: 'bg-amber-500/15',   icon: <Clock        className="h-3.5 w-3.5" /> },
  Confirmed:  { label: 'Confirmado',  color: 'text-blue-400',    bg: 'bg-blue-500/15',    icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  Paid:       { label: 'Pagado',      color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: <DollarSign   className="h-3.5 w-3.5" /> },
  Processing: { label: 'Preparando', color: 'text-orange-400',  bg: 'bg-orange-500/15',  icon: <Package      className="h-3.5 w-3.5" /> },
  Shipped:    { label: 'Enviado',     color: 'text-purple-400',  bg: 'bg-purple-500/15',  icon: <Truck        className="h-3.5 w-3.5" /> },
  Delivered:  { label: 'Entregado',   color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  Cancelled:  { label: 'Cancelado',   color: 'text-red-400',     bg: 'bg-red-500/15',     icon: <XCircle      className="h-3.5 w-3.5" /> },
  Refunded:   { label: 'Reembolsado', color: 'text-neutral-400', bg: 'bg-neutral-500/15', icon: <RotateCcw    className="h-3.5 w-3.5" /> },
}

// Valid transitions per status
const TRANSITIONS: Partial<Record<OrderStatus, { label: string; next: OrderStatus; danger?: boolean }[]>> = {
  Pending:    [{ label: 'Confirmar', next: 'Confirmed' }, { label: 'Cancelar', next: 'Cancelled', danger: true }],
  Confirmed:  [{ label: 'Marcar como pagado', next: 'Paid' }, { label: 'Cancelar', next: 'Cancelled', danger: true }],
  Paid:       [{ label: 'Iniciar preparación', next: 'Processing' }, { label: 'Cancelar', next: 'Cancelled', danger: true }],
  Processing: [{ label: 'Marcar enviado', next: 'Shipped' }],
  Shipped:    [{ label: 'Marcar entregado', next: 'Delivered' }],
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
        cfg.color,
        cfg.bg,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

// ─── Status Timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ order }: { order: Order }) {
  if (!order.statusHistory || order.statusHistory.length === 0) {
    return <p className="text-sm text-neutral-600">Sin historial de estados.</p>
  }

  return (
    <ol className="relative border-l border-neutral-800 space-y-4 ml-2">
      {order.statusHistory.map((entry, i) => {
        const cfg = STATUS_CONFIG[entry.toStatus]
        return (
          <li key={i} className="ml-4">
            <span
              className={cn(
                'absolute -left-2 flex items-center justify-center w-4 h-4 rounded-full ring-2 ring-obsidian-900',
                cfg.bg,
                cfg.color,
              )}
            >
              {cfg.icon}
            </span>
            <div className="flex items-center justify-between">
              <div>
                {entry.fromStatus ? (
                  <p className="text-xs text-neutral-500">
                    <span className={STATUS_CONFIG[entry.fromStatus].color}>{STATUS_CONFIG[entry.fromStatus].label}</span>
                    {' → '}
                    <span className={cfg.color}>{cfg.label}</span>
                  </p>
                ) : (
                  <p className={cn('text-xs font-medium', cfg.color)}>{cfg.label}</p>
                )}
                {entry.note && <p className="text-xs text-neutral-500 mt-0.5">{entry.note}</p>}
              </div>
              <p className="text-xs text-neutral-600 shrink-0 ml-4">
                {new Date(entry.changedAt).toLocaleString('es-AR', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// ─── Order Detail Modal content ───────────────────────────────────────────────

function OrderDetail({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { data: order, isLoading } = useOrder(orderId)
  const changeStatus = useChangeOrderStatus()
  const [cancelNote, setCancelNote] = useState('')
  const [showCancelInput, setShowCancelInput] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-neutral-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }
  if (!order) return null

  const transitions = TRANSITIONS[order.status] ?? []
  const isCancellable = transitions.some(t => t.next === 'Cancelled')

  function handleTransition(next: OrderStatus) {
    if (next === 'Cancelled') {
      if (!showCancelInput) { setShowCancelInput(true); return }
      if (!cancelNote.trim()) return
      changeStatus.mutate({ id: order!.id, newStatus: next, note: cancelNote }, {
        onSuccess: () => { setShowCancelInput(false); setCancelNote('') },
      })
    } else {
      changeStatus.mutate({ id: order!.id, newStatus: next })
    }
  }

  const isGuest = !order.customerId

  return (
    <div className="space-y-6 text-sm">
      {/* Order header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-neutral-500">N° Pedido</p>
          <p className="text-xl font-semibold text-white font-mono">{order.orderNumber}</p>
          <p className="text-xs text-neutral-500 mt-1">
            {new Date(order.createdAt).toLocaleString('es-AR', {
              day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Buyer info */}
      <div className="rounded-xl border border-neutral-800 p-4 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-neutral-500" />
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Comprador</p>
          </div>
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              isGuest ? 'bg-neutral-700 text-neutral-300' : 'bg-gold-500/10 text-gold-400',
            )}
          >
            {isGuest ? 'Invitado' : 'Registrado'}
          </span>
        </div>
        <p className="font-medium text-white">{order.buyerName}</p>
        <p className="text-neutral-400">{order.buyerEmail}</p>
        {order.buyerPhone && <p className="text-neutral-500">{order.buyerPhone}</p>}
      </div>

      {/* Shipping info */}
      {order.shippingAddress && (
        <div className="rounded-xl border border-neutral-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-neutral-500" />
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              {order.deliveryMethod === 'Pickup' ? 'Método de entrega' : 'Dirección de envío'}
            </p>
          </div>
          {order.deliveryMethod === 'Pickup' ? (
            <p className="text-neutral-300">Retiro en tienda</p>
          ) : (
            <p className="text-neutral-300">
              {order.shippingAddress.street}, {order.shippingAddress.city}
              {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}
              {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ''}
              {` · ${order.shippingAddress.country}`}
            </p>
          )}
        </div>
      )}

      {/* Payment method */}
      {order.paymentMethod && (
        <div className="flex items-center gap-2 text-neutral-400">
          <CreditCard className="h-4 w-4 shrink-0" />
          <span>Pago: <span className="text-white">{order.paymentMethod}</span></span>
        </div>
      )}

      {/* Items table */}
      <div>
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
          Productos ({order.items.length})
        </p>
        <div className="rounded-xl border border-neutral-800 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-obsidian-900">
                <th className="text-left px-3 py-2 text-neutral-500 font-medium">Producto</th>
                <th className="text-center px-3 py-2 text-neutral-500 font-medium">Cant.</th>
                <th className="text-right px-3 py-2 text-neutral-500 font-medium">Precio</th>
                <th className="text-right px-3 py-2 text-neutral-500 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => (
                <tr key={item.id} className="border-t border-neutral-800/50">
                  <td className="px-3 py-2">
                    <p className="text-white">{item.productName}</p>
                    <p className="text-neutral-500">{item.variantDescription}</p>
                    <p className="text-neutral-600">SKU: {item.sku}</p>
                  </td>
                  <td className="px-3 py-2 text-center text-neutral-300">{item.quantity}</td>
                  <td className="px-3 py-2 text-right text-neutral-300">
                    {item.currency} {formatMoney(item.unitPrice)}
                    {item.discount > 0 && (
                      <p className="text-red-400">-{item.discount}%</p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-white font-medium">
                    {item.currency} {formatMoney(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="rounded-xl border border-neutral-800 p-4 space-y-2">
        <div className="flex justify-between text-neutral-400">
          <span>Subtotal</span>
          <span className="text-white">{order.currency} {formatMoney(order.subtotal)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-neutral-400">
            <span>Descuento</span>
            <span className="text-red-400">-{order.currency} {formatMoney(order.discountAmount)}</span>
          </div>
        )}
        {order.shippingCost > 0 && (
          <div className="flex justify-between text-neutral-400">
            <span>Envío</span>
            <span className="text-white">{order.currency} {formatMoney(order.shippingCost)}</span>
          </div>
        )}
        {order.taxAmount > 0 && (
          <div className="flex justify-between text-neutral-400">
            <span>Impuestos</span>
            <span className="text-white">{order.currency} {formatMoney(order.taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-base border-t border-neutral-800 pt-2 mt-1">
          <span className="text-white">Total</span>
          <span className="text-gold-400">{order.currency} {formatMoney(order.total)}</span>
        </div>
      </div>

      {/* Status timeline */}
      <div>
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">
          Historial de estados
        </p>
        <StatusTimeline order={order} />
      </div>

      {/* Status transitions */}
      {transitions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Acciones</p>

          {showCancelInput && (
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Motivo de cancelación *</label>
              <input
                value={cancelNote}
                onChange={e => setCancelNote(e.target.value)}
                placeholder="Describe el motivo de cancelación…"
                className="w-full px-3 py-2 bg-obsidian-900 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {transitions
              .filter(t => !showCancelInput || t.next === 'Cancelled')
              .map(t => (
                <button
                  key={t.next}
                  onClick={() => handleTransition(t.next)}
                  disabled={changeStatus.isPending || (t.next === 'Cancelled' && showCancelInput && !cancelNote.trim())}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium border transition-colors disabled:opacity-50',
                    t.danger
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20'
                      : 'bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 border-gold-500/20',
                  )}
                >
                  {t.label}
                  {t.next === 'Cancelled' && showCancelInput ? ' (confirmar)' : ''}
                </button>
              ))}
            {showCancelInput && (
              <button
                onClick={() => { setShowCancelInput(false); setCancelNote('') }}
                className="px-4 py-2 rounded-xl text-sm text-neutral-500 hover:text-white border border-transparent"
              >
                Descartar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cancel reason */}
      {order.cancelReason && (
        <div className="flex gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Motivo de cancelación</p>
            <p className="text-sm text-neutral-400 mt-0.5">{order.cancelReason}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrdersAdminPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data, isLoading } = useOrders({
    page,
    pageSize: 20,
    search: search || undefined,
    status: filterStatus || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
  })

  const countByStatus = (s: OrderStatus) =>
    data?.items.filter(o => o.status === s).length ?? 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-white">Pedidos</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Gestión y seguimiento de pedidos</p>
        </div>
        <button
          onClick={() => navigate('/admin/orders/new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-obsidian-900 text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo pedido
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total pedidos" value={data?.totalCount ?? 0} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="Pendientes"   value={countByStatus('Pending')}   icon={<Clock        className="h-5 w-5 text-amber-400"   />} variant="warning" />
        <StatCard label="En tránsito"  value={countByStatus('Shipped')}   icon={<Truck        className="h-5 w-5 text-purple-400"  />} variant="info" />
        <StatCard label="Entregados"   value={countByStatus('Delivered')} icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />} variant="success" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por N° pedido, nombre o email…"
            className="w-full pl-9 pr-4 py-2 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value as OrderStatus | ''); setPage(1) }}
          className="bg-obsidian-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
        >
          <option value="">Todos los estados</option>
          {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map(k => (
            <option key={k} value={k}>{STATUS_CONFIG[k].label}</option>
          ))}
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={e => { setFromDate(e.target.value); setPage(1) }}
          className="bg-obsidian-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
          title="Desde"
        />
        <input
          type="date"
          value={toDate}
          onChange={e => { setToDate(e.target.value); setPage(1) }}
          className="bg-obsidian-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
          title="Hasta"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ background: 'var(--surface)' }}>
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-800">
            <tr>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">N° Pedido</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Comprador</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Estado</th>
              <th className="text-center px-4 py-3 text-neutral-500 font-medium">Productos</th>
              <th className="text-right px-4 py-3 text-neutral-500 font-medium">Total</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Fecha</th>
              <th className="text-right px-4 py-3 text-neutral-500 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-t border-neutral-800/50">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-neutral-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !data || data.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-neutral-600">
                  No se encontraron pedidos
                </td>
              </tr>
            ) : (
              data.items.map(order => (
                <tr
                  key={order.id}
                  className="border-t border-neutral-800/50 hover:bg-obsidian-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-mono text-sm text-white">{order.orderNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">{order.buyerName}</p>
                    <p className="text-xs text-neutral-500">{order.buyerEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-400">{order.itemCount}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-gold-400 font-medium">
                      {order.currency} {formatMoney(order.total)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">
                    {new Date(order.createdAt).toLocaleDateString('es-AR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDetailId(order.id)}
                      className="p-2 rounded-lg hover:bg-obsidian-800 text-neutral-500 hover:text-white transition-colors"
                      title="Ver detalle"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      {/* Detail modal */}
      <Modal
        isOpen={!!detailId}
        onClose={() => setDetailId(null)}
        title="Detalle del pedido"
        size="xl"
      >
        {detailId && (
          <OrderDetail orderId={detailId} onClose={() => setDetailId(null)} />
        )}
      </Modal>
    </div>
  )
}
