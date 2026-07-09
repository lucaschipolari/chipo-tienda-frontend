import { useState } from 'react'
import {
  ArrowUpCircle, ArrowDownCircle, RefreshCcw, Package,
  Loader2, Filter, ArrowLeft,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStockMovements } from '@/features/inventory/hooks/useInventory'
import { cn } from '@/utils/helpers/cn'
import type { MovementType } from '@/types/catalog.types'

// ─── Movement type config ─────────────────────────────────────────────────────

const MOVEMENT_CONFIG: Record<MovementType, { label: string; color: string; icon: typeof ArrowUpCircle }> = {
  Initial:          { label: 'Stock inicial',      color: 'text-blue-400',    icon: Package       },
  PurchaseReceipt:  { label: 'Recepción compra',   color: 'text-green-400',   icon: ArrowUpCircle },
  SaleOut:          { label: 'Venta',              color: 'text-red-400',     icon: ArrowDownCircle},
  OrderReservation: { label: 'Reserva pedido',     color: 'text-yellow-400',  icon: ArrowDownCircle},
  OrderRelease:     { label: 'Liberación pedido',  color: 'text-green-400',   icon: ArrowUpCircle },
  ManualAdjustment: { label: 'Ajuste manual',      color: 'text-purple-400',  icon: RefreshCcw    },
  Return:           { label: 'Devolución',         color: 'text-cyan-400',    icon: ArrowUpCircle },
  Damage:           { label: 'Daño / merma',       color: 'text-orange-400',  icon: ArrowDownCircle},
}

const INBOUND: MovementType[] = ['Initial', 'PurchaseReceipt', 'OrderRelease', 'Return']

function MovementTypeBadge({ type }: { type: MovementType }) {
  const cfg = MOVEMENT_CONFIG[type] ?? { label: type, color: 'text-neutral-400', icon: Package }
  const Icon = cfg.icon
  const isInbound = INBOUND.includes(type)
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', cfg.color)}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  )
}

function StockDelta({ before, after }: { before: number; after: number }) {
  const delta = after - before
  if (delta > 0) return <span className="text-green-400 text-xs font-medium">+{delta}</span>
  if (delta < 0) return <span className="text-red-400 text-xs font-medium">{delta}</span>
  return <span className="text-neutral-500 text-xs">0</span>
}

// ─── Página ────────────────────────────────────────────────────────────────────

export default function StockMovementsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useStockMovements({ page, pageSize: 50 })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/inventory"
          className="p-2 rounded-xl border border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-semibold text-white tracking-wide">Movimientos de stock</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {data?.totalCount ?? 0} movimientos registrados
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ background: 'var(--surface)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-800 bg-obsidian-800/50">
                {['Producto / SKU', 'Tipo', 'Cantidad', 'Antes → Después', 'Motivo', 'Fecha'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-neutral-500" />
                </td></tr>
              ) : !data?.items.length ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-500 text-sm">
                  <Package className="h-8 w-8 mx-auto mb-2 text-neutral-700" />
                  Sin movimientos registrados todavía.
                </td></tr>
              ) : data.items.map((m) => (
                <tr key={m.id} className="border-b border-neutral-800/60 hover:bg-obsidian-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{m.productName}</p>
                    <p className="text-xs text-neutral-500">{m.variantSku}</p>
                    {Object.keys(m.variantAttributes).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(m.variantAttributes).map(([k, v]) => (
                          <span key={k} className="text-xs px-1 py-0.5 rounded bg-obsidian-700 text-neutral-500">{k}: {v}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <MovementTypeBadge type={m.movementType as MovementType} />
                  </td>
                  <td className="px-4 py-3">
                    <StockDelta before={m.stockBefore} after={m.stockAfter} />
                    <p className="text-xs text-neutral-600 mt-0.5">{m.quantity} u.</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-400">
                    {m.stockBefore} → <span className="text-white font-medium">{m.stockAfter}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500 max-w-[180px] truncate">{m.reason ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleString('es-AR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800">
            <p className="text-xs text-neutral-500">
              {data.totalCount} movimientos · página {data.page} de {data.totalPages}
            </p>
            <div className="flex gap-1">
              <button
                disabled={!data.hasPreviousPage}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >Anterior</button>
              <button
                disabled={!data.hasNextPage}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
