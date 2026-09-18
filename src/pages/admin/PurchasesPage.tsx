/**
 * PurchasesPage — Órdenes de compra
 *
 * Flujo:
 *  1. Listar órdenes de compra con filtro por estado
 *  2. Ver detalle en modal con ítems y totales
 *  3. Acciones por estado: Enviar / Aprobar / Registrar recepción / Cancelar
 *  4. Sub-modal de recepción: ingresar cantidades recibidas por ítem
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Plus, Eye, ShoppingBag, Package, Truck, X, CheckCircle,
  XCircle, Clock, Send, ThumbsUp, ClipboardCheck, Pencil,
} from 'lucide-react'
import { Button }     from '@/components/ui/Button/Button'
import { Modal }      from '@/components/ui/Modal/Modal'
import { Badge }      from '@/components/ui/Badge/Badge'
import { Pagination } from '@/components/data-display/Pagination/Pagination'
import { cn }         from '@/utils/helpers/cn'
import {
  usePurchaseOrders,
  usePurchaseOrder,
  useSendPurchaseOrder,
  useApprovePurchaseOrder,
  useReceivePurchaseOrder,
  useCancelPurchaseOrder,
} from '@/features/purchases/hooks/usePurchases'
import type { PurchaseOrderStatus, PurchaseOrderListItem, ReceivePurchaseOrderRequest } from '@/types/purchase.types'
import { formatMoney } from '@/utils/helpers/formatMoney'

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_TABS: { value: PurchaseOrderStatus | 'all'; label: string }[] = [
  { value: 'all',               label: 'Todas' },
  { value: 'Draft',             label: 'Borrador' },
  { value: 'Sent',              label: 'Enviada' },
  { value: 'Approved',          label: 'Aprobada' },
  { value: 'PartiallyReceived', label: 'Parcial' },
  { value: 'Received',          label: 'Recibida' },
  { value: 'Cancelled',         label: 'Cancelada' },
]

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

const STATUS_CONFIG: Record<PurchaseOrderStatus, { label: string; variant: BadgeVariant; icon: React.ReactNode }> = {
  Draft:             { label: 'Borrador',   variant: 'default', icon: <Clock className="h-3 w-3" /> },
  Sent:              { label: 'Enviada',    variant: 'info',    icon: <Send className="h-3 w-3" /> },
  Approved:          { label: 'Aprobada',   variant: 'warning', icon: <ThumbsUp className="h-3 w-3" /> },
  PartiallyReceived: { label: 'Parcial',    variant: 'warning', icon: <Truck className="h-3 w-3" /> },
  Received:          { label: 'Recibida',   variant: 'success', icon: <CheckCircle className="h-3 w-3" /> },
  Cancelled:         { label: 'Cancelada',  variant: 'danger',  icon: <XCircle className="h-3 w-3" /> },
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <Badge variant={cfg.variant} size="sm">
      <span className="flex items-center gap-1">
        {cfg.icon}
        {cfg.label}
      </span>
    </Badge>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-xs text-neutral-500 shrink-0">{label}</span>
      <span className="text-sm text-white text-right truncate">{value}</span>
    </div>
  )
}

// ─── ReceiveModal ─────────────────────────────────────────────────────────────

function ReceiveModal({
  purchaseId,
  open,
  onClose,
}: {
  purchaseId: string
  open: boolean
  onClose: () => void
}) {
  const { data: po, isLoading } = usePurchaseOrder(open ? purchaseId : undefined)
  const receiveMutation = useReceivePurchaseOrder()
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  function handleQtyChange(itemId: string, value: number) {
    setQuantities(prev => ({ ...prev, [itemId]: value }))
  }

  function handleSubmit() {
    if (!po) return
    const itemReceipts: Record<string, number> = {}
    po.items.forEach(item => {
      const qty = quantities[item.id] ?? 0
      if (qty > 0) itemReceipts[item.id] = qty
    })
    if (Object.keys(itemReceipts).length === 0) {
      toast.error('Ingresa al menos una cantidad para recibir.')
      return
    }
    const req: ReceivePurchaseOrderRequest = { itemReceipts }
    receiveMutation.mutate(
      { id: purchaseId, data: req },
      {
        onSuccess: () => {
          toast.success('Recepción registrada correctamente.')
          setQuantities({})
          onClose()
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.detail || err?.message || 'Error al registrar la recepción.'
          toast.error(msg)
        },
      }
    )
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Registrar recepción">
      {isLoading || !po ? (
        <div className="py-8 text-center text-neutral-500 text-sm">Cargando…</div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-neutral-400">
            Orden <span className="font-mono text-white">{po.purchaseNumber}</span> · {po.supplierName}
          </p>

          <div className="space-y-3">
            {po.items.map(item => {
              const remaining = item.quantity - item.quantityReceived
              const inputQty = quantities[item.id] ?? 0
              return (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-xl border p-4 space-y-2',
                    item.isFullyReceived
                      ? 'border-neutral-800/40 opacity-50'
                      : 'border-neutral-800',
                  )}
                  style={{ background: 'var(--surface)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {item.productName ?? item.productId}
                      </p>
                      {item.variantSku && (
                        <p className="text-xs text-neutral-500">SKU: {item.variantSku}</p>
                      )}
                    </div>
                    {item.isFullyReceived && (
                      <Badge variant="success" size="sm">Completo</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-neutral-500">
                    <div>
                      <span className="block text-neutral-600">Pedido</span>
                      <span className="text-white font-medium">{item.quantity}</span>
                    </div>
                    <div>
                      <span className="block text-neutral-600">Ya recibido</span>
                      <span className="text-white font-medium">{item.quantityReceived}</span>
                    </div>
                    <div>
                      <span className="block text-neutral-600">Pendiente</span>
                      <span className={cn('font-medium', remaining > 0 ? 'text-amber-400' : 'text-neutral-400')}>
                        {remaining}
                      </span>
                    </div>
                  </div>
                  {!item.isFullyReceived && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-neutral-500 shrink-0">Recibir ahora:</label>
                      <input
                        type="number"
                        min={0}
                        max={remaining}
                        value={inputQty}
                        onChange={e => handleQtyChange(item.id, Math.min(remaining, Math.max(0, Number(e.target.value))))}
                        className="w-20 bg-obsidian-900 border border-neutral-800 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-gold-500"
                      />
                      <span className="text-xs text-neutral-600">/ {remaining} máx.</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              loading={receiveMutation.isPending}
              className="flex-1"
              leftIcon={<ClipboardCheck className="h-4 w-4" />}
            >
              Registrar recepción
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── PurchaseDetail ───────────────────────────────────────────────────────────

function PurchaseDetail({
  purchaseId,
  onClose,
}: {
  purchaseId: string
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { data: po, isLoading } = usePurchaseOrder(purchaseId)
  const sendMutation    = useSendPurchaseOrder()
  const approveMutation = useApprovePurchaseOrder()
  const cancelMutation  = useCancelPurchaseOrder()
  const [receiveOpen, setReceiveOpen] = useState(false)

  if (isLoading || !po) {
    return <div className="py-8 text-center text-neutral-500 text-sm">Cargando…</div>
  }

  function handleSend() {
    sendMutation.mutate(po!.id, {
      onSuccess: () => { toast.success('Orden enviada al proveedor.'); onClose() },
      onError: (err: any) => toast.error(err?.response?.data?.detail || 'Error al enviar la orden.'),
    })
  }

  function handleApprove() {
    approveMutation.mutate(po!.id, {
      onSuccess: () => { toast.success('Orden aprobada.'); onClose() },
      onError: (err: any) => toast.error(err?.response?.data?.detail || 'Error al aprobar la orden.'),
    })
  }

  function handleCancel() {
    if (!confirm('¿Seguro que deseas cancelar esta orden de compra?')) return
    cancelMutation.mutate(po!.id, {
      onSuccess: () => { toast.success('Orden cancelada.'); onClose() },
      onError: (err: any) => toast.error(err?.response?.data?.detail || 'Error al cancelar la orden.'),
    })
  }

  const canEdit    = po.status === 'Draft'
  const canSend    = po.status === 'Draft'
  const canApprove = po.status === 'Sent'
  const canReceive = po.status === 'Approved' || po.status === 'PartiallyReceived'
  const canCancel  = po.status === 'Draft' || po.status === 'Sent'

  const totalOrdered  = po.items.reduce((a, i) => a + i.quantity, 0)
  const totalReceived = po.items.reduce((a, i) => a + i.quantityReceived, 0)
  const receivePct = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-mono text-lg text-white">{po.purchaseNumber}</span>
        <StatusBadge status={po.status} />
        <span className="text-xs text-neutral-500">Creada el {fmtDate(po.createdAt)}</span>
      </div>

      {/* Layout responsive: en desktop 2 columnas (ítems | resumen), en móvil apilado */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* ── Columna ítems ── */}
        <div className="space-y-2 order-2 lg:order-1">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Ítems ({po.items.length})
          </p>

          {/* Tabla (desktop / tablet) */}
          <div className="hidden sm:block rounded-xl border border-neutral-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-800 bg-obsidian-900/60">
                <tr>
                  <th className="text-left px-4 py-2.5 text-neutral-500 font-medium text-xs">Producto</th>
                  <th className="text-center px-3 py-2.5 text-neutral-500 font-medium text-xs">Pedido</th>
                  <th className="text-center px-3 py-2.5 text-neutral-500 font-medium text-xs">Recibido</th>
                  <th className="text-right px-3 py-2.5 text-neutral-500 font-medium text-xs">Costo u.</th>
                  <th className="text-right px-4 py-2.5 text-neutral-500 font-medium text-xs">Total</th>
                </tr>
              </thead>
              <tbody>
                {po.items.map(item => (
                  <tr key={item.id} className="border-t border-neutral-800/50 hover:bg-obsidian-800/30">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">{item.productName ?? item.productId}</p>
                      {item.variantSku && <p className="text-neutral-600 text-xs mt-0.5">SKU: {item.variantSku}</p>}
                    </td>
                    <td className="px-3 py-3 text-center text-neutral-300">{item.quantity}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn('text-sm font-medium',
                        item.isFullyReceived ? 'text-green-400' : item.quantityReceived > 0 ? 'text-amber-400' : 'text-neutral-500')}>
                        {item.quantityReceived}/{item.quantity}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-neutral-300">{item.currency} {formatMoney(item.unitCost)}</td>
                    <td className="px-4 py-3 text-right text-gold-400 font-medium">{item.currency} {formatMoney(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tarjetas (móvil) */}
          <div className="sm:hidden space-y-2">
            {po.items.map(item => (
              <div key={item.id} className="rounded-xl border border-neutral-800 bg-obsidian-900 p-3">
                <p className="text-white text-sm font-medium">{item.productName ?? item.productId}</p>
                {item.variantSku && <p className="text-neutral-600 text-xs mt-0.5">SKU: {item.variantSku}</p>}
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div>
                    <p className="text-neutral-500">Pedido</p>
                    <p className="text-neutral-200 mt-0.5">{item.quantity}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Recibido</p>
                    <p className={cn('mt-0.5 font-medium',
                      item.isFullyReceived ? 'text-green-400' : item.quantityReceived > 0 ? 'text-amber-400' : 'text-neutral-500')}>
                      {item.quantityReceived}/{item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-neutral-500">Total</p>
                    <p className="text-gold-400 mt-0.5 font-medium">{item.currency} {formatMoney(item.total)}</p>
                  </div>
                </div>
                <p className="text-neutral-500 text-xs mt-2">Costo u.: {item.currency} {formatMoney(item.unitCost)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Columna resumen ── */}
        <div className="space-y-3 order-1 lg:order-2">
          {/* Datos */}
          <div className="rounded-xl border border-neutral-800 bg-obsidian-900 divide-y divide-neutral-800/70">
            <InfoRow label="Proveedor" value={po.supplierName ?? po.supplierId} />
            <InfoRow label="Moneda" value={po.currency} />
            {po.expectedDeliveryDate && <InfoRow label="Entrega esperada" value={fmtDate(po.expectedDeliveryDate)} />}
          </div>

          {/* Progreso de recepción */}
          <div className="rounded-xl border border-neutral-800 bg-obsidian-900 p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-neutral-500">Recepción</span>
              <span className="text-neutral-300">{totalReceived}/{totalOrdered} u. · {receivePct}%</span>
            </div>
            <div className="h-2 rounded-full bg-obsidian-950 overflow-hidden">
              <div className={cn('h-full rounded-full transition-all',
                receivePct === 100 ? 'bg-green-500' : receivePct > 0 ? 'bg-amber-500' : 'bg-neutral-700')}
                style={{ width: `${receivePct}%` }} />
            </div>
          </div>

          {/* Totales */}
          <div className="rounded-xl border border-neutral-800 bg-obsidian-900 p-4 space-y-2">
            <div className="flex justify-between text-sm text-neutral-400">
              <span>Subtotal</span>
              <span>{po.currency} {formatMoney(po.subtotal)}</span>
            </div>
            {po.taxAmount > 0 && (
              <div className="flex justify-between text-sm text-neutral-400">
                <span>Impuesto</span>
                <span>{po.currency} {formatMoney(po.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold text-white border-t border-neutral-800 pt-2 mt-1">
              <span>Total</span>
              <span className="text-gold-400">{po.currency} {formatMoney(po.total)}</span>
            </div>
          </div>

          {po.notes && (
            <div className="rounded-xl border border-neutral-800 bg-obsidian-900 p-4">
              <p className="text-xs text-neutral-500 mb-1">Notas</p>
              <p className="text-sm text-neutral-200 whitespace-pre-wrap">{po.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {(canEdit || canSend || canApprove || canReceive || canCancel) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { onClose(); navigate(`/admin/purchases/${po.id}/edit`) }}
              leftIcon={<Pencil className="h-3.5 w-3.5" />}
            >
              Editar
            </Button>
          )}
          {canSend && (
            <Button
              size="sm"
              onClick={handleSend}
              loading={sendMutation.isPending}
              leftIcon={<Send className="h-3.5 w-3.5" />}
            >
              Enviar al proveedor
            </Button>
          )}
          {canApprove && (
            <Button
              size="sm"
              onClick={handleApprove}
              loading={approveMutation.isPending}
              leftIcon={<ThumbsUp className="h-3.5 w-3.5" />}
            >
              Aprobar
            </Button>
          )}
          {canReceive && (
            <Button
              size="sm"
              onClick={() => setReceiveOpen(true)}
              leftIcon={<Truck className="h-3.5 w-3.5" />}
            >
              Registrar recepción
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              loading={cancelMutation.isPending}
              leftIcon={<X className="h-3.5 w-3.5" />}
              className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              Cancelar
            </Button>
          )}
        </div>
      )}

      {receiveOpen && (
        <ReceiveModal
          purchaseId={po.id}
          open={receiveOpen}
          onClose={() => setReceiveOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PurchasesPage() {
  const navigate = useNavigate()
  const [page, setPage]           = useState(1)
  const [activeTab, setActiveTab] = useState<PurchaseOrderStatus | 'all'>('all')
  const [detailId, setDetailId]   = useState<string | null>(null)

  const { data, isLoading } = usePurchaseOrders({
    page,
    pageSize: 20,
    status: activeTab === 'all' ? undefined : activeTab,
  })

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gold-400" />
            Órdenes de compra
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">Gestión de compras a proveedores</p>
        </div>
        <Button
          onClick={() => navigate('/admin/purchases/new')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Nueva orden
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setPage(1) }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.value
                ? 'bg-gold-500/10 text-gold-400 border border-gold-500/30'
                : 'text-neutral-500 hover:text-neutral-300 border border-transparent hover:border-neutral-800',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-800 overflow-x-auto" style={{ background: 'var(--surface)' }}>
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-neutral-800">
            <tr>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">N° Orden</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Proveedor</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Estado</th>
              <th className="text-center px-4 py-3 text-neutral-500 font-medium">Ítems</th>
              <th className="text-right px-4 py-3 text-neutral-500 font-medium">Total</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Entrega esperada</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Fecha</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-t border-neutral-800/50">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-neutral-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-neutral-600">
                  No hay órdenes de compra
                  {activeTab !== 'all' ? ` con estado "${STATUS_CONFIG[activeTab as PurchaseOrderStatus]?.label}"` : ''}.
                </td>
              </tr>
            ) : (
              data?.items.map((po: PurchaseOrderListItem) => (
                <tr
                  key={po.id}
                  className="border-t border-neutral-800/50 hover:bg-obsidian-800/30 transition-colors group"
                >
                  <td className="px-4 py-3 font-mono text-sm text-white">{po.purchaseNumber}</td>
                  <td className="px-4 py-3 text-neutral-300">
                    {po.supplierName ?? <span className="text-neutral-600 italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={po.status} />
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-400">{po.itemCount}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-gold-400 font-medium">
                      {po.currency} {formatMoney(po.total)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">
                    {po.expectedDeliveryDate ? formatDate(po.expectedDeliveryDate) : <span className="text-neutral-700">—</span>}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">
                    {formatDate(po.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDetailId(po.id)}
                      title="Ver detalle"
                      className="p-1.5 rounded-lg text-neutral-400 hover:bg-obsidian-800 hover:text-white transition-all sm:opacity-0 sm:group-hover:opacity-100"
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

      {data && data.totalCount > 20 && (
        <Pagination page={page} totalPages={Math.ceil(data.totalCount / 20)} onPageChange={setPage} />
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailId}
        onClose={() => setDetailId(null)}
        title="Detalle de orden de compra"
        size="full"
      >
        {detailId && (
          <PurchaseDetail
            purchaseId={detailId}
            onClose={() => setDetailId(null)}
          />
        )}
      </Modal>
    </div>
  )
}
