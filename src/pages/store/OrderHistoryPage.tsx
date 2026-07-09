import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ShoppingBag, ChevronRight, Clock, CheckCircle2, XCircle,
  Truck, Package, RotateCcw, ArrowLeft, Loader2, CreditCard,
} from 'lucide-react'
import { httpClient } from '@/services/http/httpClient'
import { cn } from '@/utils/helpers/cn'
import { formatMoney } from '@/utils/helpers/formatMoney'
import type { PagedResult } from '@/types/api.types'
import type { Order, OrderListItem, OrderStatus } from '@/types/order.types'

/**
 * OrderHistoryPage — pedidos del comprador, conectados a /orders/mine.
 */

// ─── Data hooks ───────────────────────────────────────────────────────────────

function useMyOrders() {
  return useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: () => httpClient.get<PagedResult<OrderListItem>>('/orders/mine', { page: 1, pageSize: 50 }),
  })
}

function useMyOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'mine', id],
    queryFn: () => httpClient.get<Order>(`/orders/mine/${id}`),
    enabled: !!id,
  })
}

// ─── Estados ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  Pending:    { label: 'Pendiente',    icon: Clock,        color: 'text-amber-400',  bg: 'bg-amber-400/10' },
  Confirmed:  { label: 'Confirmado',   icon: CheckCircle2, color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  Paid:       { label: 'Pagado',       icon: CreditCard,   color: 'text-emerald-400',bg: 'bg-emerald-400/10' },
  Processing: { label: 'En proceso',   icon: Package,      color: 'text-purple-400', bg: 'bg-purple-400/10' },
  Shipped:    { label: 'Enviado',      icon: Truck,        color: 'text-cyan-400',   bg: 'bg-cyan-400/10' },
  Delivered:  { label: 'Entregado',    icon: CheckCircle2, color: 'text-emerald-400',bg: 'bg-emerald-400/10' },
  Cancelled:  { label: 'Cancelado',    icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-400/10' },
  Refunded:   { label: 'Reembolsado',  icon: RotateCcw,    color: 'text-neutral-400',bg: 'bg-neutral-400/10' },
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Pending
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', cfg.bg, cfg.color)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Tarjeta de pedido ────────────────────────────────────────────────────────

function OrderCard({ order }: { order: OrderListItem }) {
  return (
    <Link
      to={`/account/orders/${order.id}`}
      className="group block rounded-2xl bg-[#141414] p-5 ring-1 ring-white/10 transition-all duration-300 hover:ring-white/25"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-white">#{order.orderNumber}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-xs text-neutral-500">{formatDate(order.createdAt)}</p>
          <p className="mt-2 text-xs text-neutral-500">
            {order.itemCount} producto{order.itemCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-base font-semibold text-white">
            ${formatMoney(order.total)}
          </span>
          <ChevronRight className="h-4 w-4 text-neutral-600 transition-colors group-hover:text-neutral-300" />
        </div>
      </div>
    </Link>
  )
}

// ─── Detalle del pedido ───────────────────────────────────────────────────────

function OrderDetail({ orderId }: { orderId: string }) {
  const { data: order, isLoading, error } = useMyOrder(orderId)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link
        to="/account/orders"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mis pedidos
      </Link>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-neutral-600" />
        </div>
      ) : !order || error ? (
        <div className="rounded-2xl bg-[#141414] p-8 text-center ring-1 ring-white/10">
          <Package className="mx-auto mb-4 h-10 w-10 text-neutral-600" />
          <p className="font-semibold text-white">No encontramos este pedido</p>
          <p className="mt-1 text-sm text-neutral-500">Puede que no exista o no pertenezca a tu cuenta.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Encabezado */}
          <div className="rounded-2xl bg-[#141414] p-6 ring-1 ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-xl font-medium text-white">#{order.orderNumber}</h1>
                <p className="mt-1 text-xs text-neutral-500">{formatDate(order.createdAt)}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
          </div>

          {/* Ítems */}
          <div className="rounded-2xl bg-[#141414] ring-1 ring-white/10">
            <p className="border-b border-white/5 px-6 py-4 text-[11px] uppercase tracking-[0.25em] text-neutral-500">
              Tu pedido
            </p>
            <ul className="divide-y divide-white/5">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/5">
                    <ShoppingBag className="h-4 w-4 text-neutral-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{item.productName}</p>
                    <p className="text-xs text-neutral-500">
                      {item.variantDescription || item.sku} · ×{item.quantity}
                    </p>
                  </div>
                  <span className="text-sm tabular-nums text-neutral-300">
                    ${formatMoney(item.total)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Totales */}
          <div className="space-y-2 rounded-2xl bg-[#141414] p-6 text-sm ring-1 ring-white/10">
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal</span>
              <span className="tabular-nums">${formatMoney(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Descuento</span>
                <span className="tabular-nums">−${formatMoney(order.discountAmount)}</span>
              </div>
            )}
            {order.shippingCost > 0 && (
              <div className="flex justify-between text-neutral-400">
                <span>Envío</span>
                <span className="tabular-nums">${formatMoney(order.shippingCost)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-white/5 pt-3">
              <span className="font-medium text-white">Total</span>
              <span className="text-lg font-semibold tabular-nums text-white">
                ${formatMoney(order.total)}
              </span>
            </div>
          </div>

          {/* Entrega */}
          <div className="rounded-2xl bg-[#141414] p-6 ring-1 ring-white/10">
            <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-neutral-500">Entrega</p>
            <p className="text-sm text-neutral-300">
              {order.shippingAddress.street}
              {order.shippingAddress.city && order.shippingAddress.city !== '—'
                ? `, ${order.shippingAddress.city}` : ''}
              {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Lista vacía ──────────────────────────────────────────────────────────────

function EmptyOrders() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/10">
        <ShoppingBag className="h-11 w-11 text-neutral-700" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-white">Aún no tenés pedidos</h2>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-neutral-500">
        Cuando hagas tu primera compra vas a poder seguir el estado de tu pedido acá.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition-colors hover:bg-neutral-200"
      >
        <ShoppingBag className="h-4 w-4" />
        Empezar a comprar
      </Link>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function OrderHistoryPage() {
  const { id } = useParams<{ id?: string }>()
  const { data, isLoading } = useMyOrders()

  if (id) {
    return (
      <div className="min-h-screen">
        <OrderDetail orderId={id} />
      </div>
    )
  }

  const orders = data?.items ?? []

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-10">
          <p className="mb-2 text-[11px] uppercase tracking-[0.35em] text-neutral-500">Tu cuenta</p>
          <h1 className="font-display text-3xl font-medium text-white">Mis pedidos</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {isLoading
              ? 'Cargando…'
              : orders.length === 0
                ? 'Sin pedidos por el momento'
                : `${orders.length} pedido${orders.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-neutral-600" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
