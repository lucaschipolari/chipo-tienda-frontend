import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, TrendingDown, ShoppingCart, AlertTriangle, Users,
  DollarSign, ArrowUpRight, Package, CreditCard, Truck, BarChart3,
} from 'lucide-react'
import { Card }    from '@/components/ui/Card/Card'
import { Badge }   from '@/components/ui/Badge/Badge'
import { Button }  from '@/components/ui/Button/Button'
import { useFinanceDashboard } from '@/features/finance/hooks/useFinance'
import { useOrders }           from '@/features/orders/hooks/useOrders'
import { useSales, useSalesReport } from '@/features/sales/hooks/useSales'
import { useStockValuation } from '@/features/inventory/hooks/useInventory'
import { useProducts }         from '@/features/products/hooks/useProducts'
import { formatMoney } from '@/utils/helpers/formatMoney'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Period = 'today' | 'week' | 'month' | 'custom'

const PERIOD_MAP: Record<Period, string> = {
  today: 'today',
  week:  'week',
  month: 'month',
  custom: 'custom',
}

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoy',
  week:  'Semana',
  month: 'Mes',
  custom: 'Personalizado',
}

function fmt(n: number) {
  return `ARS ${formatMoney(n)}`
}

function pct(n: number) {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  trend?: number
  gold?: boolean
  green?: boolean
  loading?: boolean
}

function KpiCard({ label, value, sub, icon, trend, gold, green, loading }: KpiProps) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 border border-neutral-800"
      style={{ background: 'var(--surface)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</span>
        <span className={`p-1.5 rounded-lg ${green ? 'bg-emerald-500/10 text-emerald-400' : gold ? 'bg-gold-500/10 text-gold-400' : 'bg-neutral-800 text-neutral-400'}`}>
          {icon}
        </span>
      </div>

      {loading ? (
        <div className="h-7 w-28 bg-neutral-800 rounded animate-pulse" />
      ) : (
        <p className={`text-xl font-bold ${green ? 'text-emerald-400' : gold ? 'text-gold-400' : 'text-white'}`}>{value}</p>
      )}

      {trend !== undefined && !loading && (
        <div className="flex items-center gap-1">
          {trend >= 0
            ? <TrendingUp  className="h-3.5 w-3.5 text-green-400" />
            : <TrendingDown className="h-3.5 w-3.5 text-red-400" />
          }
          <span className={`text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {pct(trend)} vs período anterior
          </span>
        </div>
      )}

      {sub && !loading && (
        <p className="text-xs text-neutral-500">{sub}</p>
      )}
    </div>
  )
}

// ─── Order status badge ───────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'error' | 'neutral'> = {
  Pending:   'warning',
  Confirmed: 'info',
  Processing:'info',
  Shipped:   'info',
  Delivered: 'success',
  Cancelled: 'error',
  Paid:      'success',
  Refunded:  'neutral',
}

const STATUS_LABEL: Record<string, string> = {
  Pending:   'Pendiente',
  Confirmed: 'Confirmado',
  Processing:'En proceso',
  Shipped:   'Enviado',
  Delivered: 'Entregado',
  Cancelled: 'Cancelado',
  Paid:      'Pagado',
  Refunded:  'Reembolsado',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>('month')
  // Rango para el período "Personalizado" (por defecto, el último mes)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const customReady = period === 'custom' && !!customFrom && !!customTo

  // Finance KPIs (soporta period="custom" con from/to)
  const { data: fin, isLoading: finLoading } = useFinanceDashboard(
    PERIOD_MAP[period],
    customReady ? `${customFrom}T00:00:00` : undefined,
    customReady ? `${customTo}T23:59:59` : undefined,
  )

  // Recent orders (last 5)
  const { data: ordersData, isLoading: ordersLoading } = useOrders({
    page: 1, pageSize: 5,
  })

  // Recent sales (for chart data)
  const { data: salesData } = useSales({ page: 1, pageSize: 50 })

  // Ganancia real del período (ventas − costo de productos vendidos)
  const range = useMemo(() => {
    if (period === 'custom' && customFrom && customTo)
      return { from: `${customFrom}T00:00:00`, to: `${customTo}T23:59:59` }
    const to = new Date()
    const from = new Date()
    if (period === 'today') from.setHours(0, 0, 0, 0)
    else if (period === 'week') from.setDate(from.getDate() - 7)
    else from.setDate(from.getDate() - 30)
    return { from: from.toISOString(), to: to.toISOString() }
  }, [period, customFrom, customTo])
  const { data: salesReport } = useSalesReport(range.from, range.to)

  // Capital invertido en stock (costo × stock)
  const { data: valuation } = useStockValuation()

  // Low stock products
  const { data: productsData } = useProducts({ page: 1, pageSize: 100 })

  const kpis = fin?.kpis
  const currency = kpis?.currency ?? 'ARS'

  // Ventas y ganancia por día (barras)
  const dailyBars = (fin?.revenueByDay ?? []).map(d => ({
    date: new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
    Ingresos: d.revenue,
    Ganancia: Math.round(d.revenue - d.costs), // ganancia bruta de ventas (sin gastos operativos)
  }))

  // Top productos por unidades vendidas (barras horizontales)
  const unitsBars = [...(fin?.topProducts ?? [])]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 7)
    .map(p => ({ name: p.productName, Unidades: p.quantity }))

  // Top productos por ganancia (barras horizontales, con margen)
  const profitBars = [...(fin?.topProducts ?? [])]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 7)
    .map(p => ({ name: p.productName, Ganancia: Math.round(p.profit), margin: p.margin }))

  const truncate = (s: string, n = 18) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
  const compact = (n: number) =>
    Math.abs(n) >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : Math.abs(n) >= 1_000 ? `${Math.round(n / 1_000)}k`
    : String(n)
  const CHART_COLORS = ['#EAB308', '#22C55E', '#38BDF8', '#A78BFA', '#F472B6', '#FB923C', '#2DD4BF']

  // Count low stock products (approximate: no specific low-stock endpoint on products list)
  const lowStockCount = productsData?.items.filter(p => !p.isActive).length ?? 0

  const recentOrders = ordersData?.items ?? []

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Vista ejecutiva del negocio</p>
        </div>

        {/* Period selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-obsidian-800 border border-transparent'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
          {period === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="rounded-lg border border-neutral-800 bg-obsidian-800 px-2 py-1.5 text-xs text-white"
              />
              <span className="text-xs text-neutral-600">a</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="rounded-lg border border-neutral-800 bg-obsidian-800 px-2 py-1.5 text-xs text-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard
          label="Facturación"
          value={kpis ? fmt(kpis.totalRevenue) : '—'}
          trend={kpis?.revenueVsPreviousPeriod}
          icon={<DollarSign className="h-4 w-4" />}
          gold
          loading={finLoading}
        />
        <KpiCard
          label="Ganancia real"
          green
          value={salesReport ? fmt(salesReport.totalProfit) : '—'}
          sub={salesReport && salesReport.totalRevenue > 0
            ? `Margen: ${((salesReport.totalProfit / salesReport.totalRevenue) * 100).toFixed(0)}%`
            : 'Cargá costos'}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          label="Ganancia Neta"
          value={kpis ? fmt(kpis.netProfit) : '—'}
          sub={kpis ? `Margen: ${kpis.netMargin.toFixed(1)}%` : undefined}
          icon={<TrendingUp className="h-4 w-4" />}
          loading={finLoading}
        />
        <KpiCard
          label="Ventas"
          value={kpis ? String(kpis.totalSales) : '—'}
          sub={kpis ? `Ticket prom. ${fmt(kpis.averageTicket)}` : undefined}
          icon={<ShoppingCart className="h-4 w-4" />}
          loading={finLoading}
        />
        <KpiCard
          label="Gastos Operativos"
          value={kpis ? fmt(kpis.totalExpenses) : '—'}
          sub={kpis ? `Compras: ${fmt(kpis.totalCosts)}` : undefined}
          icon={<CreditCard className="h-4 w-4" />}
          loading={finLoading}
        />
        <KpiCard
          label="Capital en stock"
          value={valuation ? fmt(valuation.totalCostValue) : '—'}
          sub={valuation
            ? `${valuation.totalUnits} u. · vale ${fmt(valuation.totalRetailValue)}${valuation.variantsWithoutCost > 0 ? ` · ${valuation.variantsWithoutCost} sin costo` : ''}`
            : undefined}
          icon={<Package className="h-4 w-4" />}
        />
      </div>

      {/* ── Charts + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Barras — Ventas y ganancia por día */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Ventas y ganancia por día</Card.Title>
              <button
                onClick={() => navigate('/admin/finance')}
                className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
              >
                Ver finanzas <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </Card.Header>
          <Card.Body>
            {finLoading ? (
              <div className="h-56 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
              </div>
            ) : dailyBars.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-800">
                <BarChart3 className="h-8 w-8 text-neutral-700" />
                <p className="text-sm text-neutral-600">Sin datos para el período seleccionado</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dailyBars} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={compact} width={44} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={{ background: '#12121e', border: '1px solid #2a2a3a', borderRadius: 8 }}
                    formatter={(v: number, name: string) => [`ARS ${formatMoney(v)}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Ingresos" fill="#EAB308" radius={[4, 4, 0, 0]} maxBarSize={38} />
                  <Bar dataKey="Ganancia" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card.Body>
        </Card>

        {/* Top productos por unidades (barras horizontales) */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Top productos · unidades</Card.Title>
              <button
                onClick={() => navigate('/admin/reports')}
                className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
              >
                Ver reportes <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </Card.Header>
          <Card.Body>
            {finLoading ? (
              <div className="h-56 space-y-3">
                {[...Array(6)].map((_, i) => <div key={i} className="h-6 bg-neutral-800 rounded animate-pulse" />)}
              </div>
            ) : unitsBars.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 gap-3">
                <Package className="h-8 w-8 text-neutral-700" />
                <p className="text-sm text-neutral-600">Sin datos de productos</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={unitsBars} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={96} tick={{ fill: '#9ca3af', fontSize: 10 }}
                    tickFormatter={(v: string) => truncate(v, 14)} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={{ background: '#12121e', border: '1px solid #2a2a3a', borderRadius: 8 }}
                    formatter={(v: number) => [`${v} uds.`, 'Unidades']}
                  />
                  <Bar dataKey="Unidades" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {unitsBars.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* ── Top productos por ganancia (barras horizontales) ── */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>Top productos · ganancia</Card.Title>
            <button
              onClick={() => navigate('/admin/profitability')}
              className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
            >
              Ver rentabilidad <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </Card.Header>
        <Card.Body>
          {finLoading ? (
            <div className="h-64 space-y-3">
              {[...Array(7)].map((_, i) => <div key={i} className="h-6 bg-neutral-800 rounded animate-pulse" />)}
            </div>
          ) : profitBars.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <TrendingUp className="h-8 w-8 text-neutral-700" />
              <p className="text-sm text-neutral-600">Sin datos de productos</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(240, profitBars.length * 42)}>
              <BarChart data={profitBars} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={compact} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickFormatter={(v: string) => truncate(v, 18)} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ background: '#12121e', border: '1px solid #2a2a3a', borderRadius: 8 }}
                  formatter={(v: number, _n, item: any) => [`ARS ${formatMoney(v)} · margen ${item?.payload?.margin?.toFixed(1)}%`, 'Ganancia']}
                />
                <Bar dataKey="Ganancia" fill="#22C55E" radius={[0, 4, 4, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card.Body>
      </Card>

      {/* ── Accesos rápidos ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Nueva venta',    href: '/admin/sales/new',      icon: <ShoppingCart className="h-4 w-4" />, gold: true },
          { label: 'Nuevo pedido',   href: '/admin/orders/new',     icon: <Package className="h-4 w-4" /> },
          { label: 'Nuevo gasto',    href: '/admin/expenses',       icon: <CreditCard className="h-4 w-4" /> },
          { label: 'Nueva compra',   href: '/admin/purchases/new',  icon: <Truck className="h-4 w-4" /> },
        ].map(btn => (
          <button
            key={btn.href}
            onClick={() => navigate(btn.href)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
              btn.gold
                ? 'bg-gold-500/10 text-gold-400 border-gold-500/20 hover:bg-gold-500/20'
                : 'text-neutral-400 border-neutral-800 hover:text-white hover:bg-obsidian-800'
            }`}
            style={{ background: btn.gold ? undefined : 'var(--surface)' }}
          >
            {btn.icon}
            {btn.label}
          </button>
        ))}
      </div>

      {/* ── Pedidos recientes ── */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>Pedidos recientes</Card.Title>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
            >
              Ver todos <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </Card.Header>
        <Card.Body padding="none">
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                {['Pedido', 'Comprador', 'Estado', 'Total'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {ordersLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(4)].map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-neutral-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-neutral-600">
                    No hay pedidos recientes
                  </td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr
                    key={order.id}
                    className="hover:bg-obsidian-800/40 transition-colors cursor-pointer"
                    onClick={() => navigate('/admin/orders')}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-neutral-400">{order.orderNumber}</td>
                    <td className="px-5 py-3.5 text-neutral-200 font-medium">{order.buyerName}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={STATUS_VARIANT[order.status] ?? 'neutral'} size="sm">
                        {STATUS_LABEL[order.status] ?? order.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-gold-400">
                      {order.currency} {formatMoney(order.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table></div>
        </Card.Body>
      </Card>

      {/* ── Resumen financiero rápido ── */}
      {kpis && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div
            className="rounded-xl p-4 border border-neutral-800 text-center"
            style={{ background: 'var(--surface)' }}
          >
            <p className="text-xs text-neutral-500 mb-1">Margen Bruto</p>
            <p className={`text-lg font-bold ${kpis.grossMargin > 20 ? 'text-green-400' : kpis.grossMargin > 10 ? 'text-yellow-400' : 'text-red-400'}`}>
              {kpis.grossMargin.toFixed(1)}%
            </p>
          </div>
          <div
            className="rounded-xl p-4 border border-neutral-800 text-center"
            style={{ background: 'var(--surface)' }}
          >
            <p className="text-xs text-neutral-500 mb-1">Margen Neto</p>
            <p className={`text-lg font-bold ${kpis.netMargin > 10 ? 'text-green-400' : kpis.netMargin > 5 ? 'text-yellow-400' : 'text-red-400'}`}>
              {kpis.netMargin.toFixed(1)}%
            </p>
          </div>
          <div
            className="rounded-xl p-4 border border-neutral-800 text-center"
            style={{ background: 'var(--surface)' }}
          >
            <p className="text-xs text-neutral-500 mb-1">Ticket Promedio</p>
            <p className="text-lg font-bold text-white">ARS {formatMoney(kpis.averageTicket)}</p>
          </div>
        </div>
      )}

    </div>
  )
}
