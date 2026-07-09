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
  XCircle, Clock, Send, ThumbsUp, ClipboardCheck,
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
              isLoading={receiveMutation.isPending}
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

  const canSend    = po.status === 'Draft'
  const canApprove = po.status === 'Sent'
  const canReceive = po.status === 'Approved' || po.status === 'PartiallyReceived'
  const canCancel  = po.status === 'Draft' || po.status === 'Sent'

  return (
    <div className="space-y-5">
      {/* Header info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-obsidian-900 rounded-xl p-3">
          <p className="text-xs text-neutral-500">Número</p>
          <p className="font-mono text-white mt-0.5">{po.purchaseNumber}</p>
        </div>
        <div className="bg-obsidian-900 rounded-xl p-3">
          <p className="text-xs text-neutral-500">Estado</p>
          <div className="mt-1">
            <StatusBadge status={po.status} />
          </div>
        </div>
        <div className="bg-obsidian-900 rounded-xl p-3">
          <p className="text-xs text-neutral-500">Proveedor</p>
          <p className="text-sm text-white mt-0.5">{po.supplierName ?? po.supplierId}</p>
        </div>
        <div className="bg-obsidian-900 rounded-xl p-3">
          <p className="text-xs text-neutral-500">Moneda</p>
          <p className="text-sm text-white mt-0.5">{po.currency}</p>
        </div>
        {po.expectedDeliveryDate && (
          <div className="bg-obsidian-900 rounded-xl p-3 col-span-2">
            <p className="text-xs text-neutral-500">Entrega esperada</p>
            <p className="text-sm text-white mt-0.5">
              {new Date(po.expectedDeliveryDate).toLocaleDateString('es-AR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        )}
        {po.notes && (
          <div className="bg-obsidian-900 rounded-xl p-3 col-span-2">
            <p className="text-xs text-neutral-500">Notas</p>
            <p className="text-sm text-white mt-0.5 whitespace-pre-wrap">{po.notes}</p>
          </div>
        )}
      </div>

      {/* Items table */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
          Ítems ({po.items.length})
        </p>
        <div className="rounded-xl border border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-800">
              <tr>
                <th className="text-left px-3 py-2.5 text-neutral-500 font-medium text-xs">Producto</th>
                <th className="text-center px-3 py-2.5 text-neutral-500 font-medium text-xs">Pedido</th>
                <th className="text-center px-3 py-2.5 text-neutral-500 font-medium text-xs">Recibido</th>
                <th className="text-right px-3 py-2.5 text-neutral-500 font-medium text-xs">Costo u.</th>
                <th className="text-right px-3 py-2.5 text-neutral-500 font-medium text-xs">Total</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map(item => (
                <tr key={item.id} className="border-t border-neutral-800/50">
                  <td className="px-3 py-2.5">
                    <p className="text-white text-xs font-medium truncate max-w-[180px]">
                      {item.productName ?? item.productId}
                    </p>
                    {item.variantSku && (
                      <p className="text-neutral-600 text-xs">SKU: {item.variantSku}</p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center text-neutral-300 text-xs">{item.quantity}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn(
                      'text-xs font-medium',
                      item.isFullyReceived
                        ? 'text-green-400'
                        : item.quantityReceived > 0
                          ? 'text-amber-400'
                          : 'text-neutral-500',
                    )}>
                      {item.quantityReceived}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-neutral-300 text-xs">
                    {item.currency} {formatMoney(item.unitCost)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gold-400 text-xs font-medium">
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

      {/* Action buttons */}
      {(canSend || canApprove || canReceive || canCancel) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {canSend && (
            <Button
              size="sm"
              onClick={handleSend}
              isLoading={sendMutation.isPending}
              leftIcon={<Send className="h-3.5 w-3.5" />}
            >
              Enviar al proveedor
            </Button>
          )}
          {canApprove && (
            <Button
              size="sm"
              onClick={handleApprove}
              isLoading={approveMutation.isPending}
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
              isLoading={cancelMutation.isPending}
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
      <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ background: 'var(--surface)' }}>
        <table className="w-full text-sm">
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
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-obsidian-800 text-neutral-500 hover:text-white transition-all"
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
