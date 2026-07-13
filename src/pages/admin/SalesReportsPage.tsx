import { useState } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, ShoppingCart, Users, Package, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatCard } from '@/components/data-display/StatCard/StatCard'
import { cn } from '@/utils/helpers/cn'
import { useSalesReport } from '@/features/sales/hooks/useSales'
import { formatMoney } from '@/utils/helpers/formatMoney'

// ─── Period presets ───────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d' | '365d' | 'custom'

function getDateRange(period: Period): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString().split('T')[0]
  const fromDate = new Date(now)
  if (period === '7d') fromDate.setDate(fromDate.getDate() - 7)
  else if (period === '30d') fromDate.setDate(fromDate.getDate() - 30)
  else if (period === '90d') fromDate.setDate(fromDate.getDate() - 90)
  else if (period === '365d') fromDate.setDate(fromDate.getDate() - 365)
  return { from: fromDate.toISOString().split('T')[0], to }
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div
            className="w-full bg-gold-500/30 hover:bg-gold-500/50 rounded-t transition-colors relative"
            style={{ height: `${(d.value / max) * 96}px`, minHeight: 2 }}
            title={`${d.label}: ARS ${formatMoney(d.value)}`}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SalesReportsPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const dateRange = period === 'custom'
    ? { from: customFrom, to: customTo }
    : getDateRange(period)

  const { data: report, isLoading } = useSalesReport(dateRange.from, dateRange.to)

  const periodLabel: Record<Period, string> = {
    '7d': 'Últimos 7 días',
    '30d': 'Últimos 30 días',
    '90d': 'Últimos 90 días',
    '365d': 'Último año',
    'custom': 'Período personalizado',
  }

  const chartData = report?.byDay.map(d => ({
    label: new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
    value: d.revenue,
  })) ?? []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/sales" className="p-2 rounded-xl hover:bg-obsidian-800 text-neutral-500 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white">Reportes de ventas</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{periodLabel[period]}</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 flex-wrap">
        {(['7d', '30d', '90d', '365d', 'custom'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-colors border',
              period === p
                ? 'bg-gold-500/10 text-gold-400 border-gold-500/30'
                : 'text-neutral-500 border-neutral-800 hover:text-white hover:border-neutral-700'
            )}
          >
            {periodLabel[p]}
          </button>
        ))}
        {period === 'custom' && (
          <div className="flex gap-2 items-center">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="bg-obsidian-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white" />
            <span className="text-neutral-600">—</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="bg-obsidian-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white" />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-obsidian-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !report ? (
        <div className="text-center py-12 text-neutral-600">Selecciona un período para ver el reporte</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Total ventas"
              value={report.totalSales}
              icon={<ShoppingCart className="h-5 w-5" />}
            />
            <StatCard
              label="Ingresos"
              value={`ARS ${formatMoney(report.totalRevenue)}`}
              icon={<DollarSign className="h-5 w-5 text-gold-400" />}
              variant="gold"
              detail={
                <span className={cn('text-xs flex items-center gap-0.5', report.revenueVsPreviousPeriod >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {report.revenueVsPreviousPeriod >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(report.revenueVsPreviousPeriod).toFixed(1)}% vs período anterior
                </span>
              }
            />
            <StatCard
              label="Ganancia real"
              green
              value={`ARS ${formatMoney(report.totalProfit)}`}
              icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
              detail={
                <span className="text-xs text-neutral-500">
                  {report.totalRevenue > 0 ? `${((report.totalProfit / report.totalRevenue) * 100).toFixed(0)}% de margen` : 'Cargá costos para calcular'}
                </span>
              }
            />
            <StatCard
              label="Costo total"
              value={`ARS ${formatMoney(report.totalCost)}`}
              icon={<DollarSign className="h-5 w-5" />}
            />
            <StatCard
              label="Ticket promedio"
              value={`ARS ${formatMoney(report.averageTicket)}`}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              label="Días con ventas"
              value={report.byDay.filter(d => d.salesCount > 0).length}
              icon={<Package className="h-5 w-5" />}
            />
          </div>

          {/* Revenue chart */}
          {chartData.length > 0 && (
            <div className="rounded-2xl border border-neutral-800 p-5" style={{ background: 'var(--surface)' }}>
              <h2 className="text-sm font-medium text-neutral-300 mb-4">Ingresos diarios</h2>
              <BarChart data={chartData} />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-neutral-600">{new Date(dateRange.from).toLocaleDateString('es-AR')}</span>
                <span className="text-xs text-neutral-600">{new Date(dateRange.to).toLocaleDateString('es-AR')}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Products */}
            <div className="rounded-2xl border border-neutral-800 p-5" style={{ background: 'var(--surface)' }}>
              <h2 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
                <Package className="h-4 w-4 text-gold-400" />
                Productos más vendidos
              </h2>
              {report.topProducts.length === 0 ? (
                <p className="text-sm text-neutral-600 text-center py-6">Sin datos</p>
              ) : (
                <div className="space-y-3">
                  {report.topProducts.map((p, i) => (
                    <div key={p.productId} className="flex items-center gap-3">
                      <span className="text-xs text-neutral-600 w-4 shrink-0">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{p.productName}</p>
                        <p className="text-xs text-neutral-500">{p.totalQuantity} unidades</p>
                      </div>
                      <span className="text-sm text-gold-400 font-medium shrink-0">
                        ARS {formatMoney(p.totalRevenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Customers */}
            <div className="rounded-2xl border border-neutral-800 p-5" style={{ background: 'var(--surface)' }}>
              <h2 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-gold-400" />
                Clientes con más compras
              </h2>
              {report.topCustomers.length === 0 ? (
                <p className="text-sm text-neutral-600 text-center py-6">Sin datos</p>
              ) : (
                <div className="space-y-3">
                  {report.topCustomers.map((c, i) => (
                    <div key={c.customerId} className="flex items-center gap-3">
                      <span className="text-xs text-neutral-600 w-4 shrink-0">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{c.customerName}</p>
                        <p className="text-xs text-neutral-500">{c.totalOrders} compras</p>
                      </div>
                      <span className="text-sm text-gold-400 font-medium shrink-0">
                        ARS {formatMoney(c.totalSpent)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
