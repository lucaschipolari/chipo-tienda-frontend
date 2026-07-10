import { useState } from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Button }   from '@/components/ui/Button/Button'
import { Input }    from '@/components/ui/Input/Input'
import { StatCard } from '@/components/data-display/StatCard/StatCard'
import { useFinanceDashboard, useCashFlow } from '@/features/finance/hooks/useFinance'
import type { TopProduct } from '@/types/finance.types'
import { formatMoney } from '@/utils/helpers/formatMoney'

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = 'day' | 'week' | 'month' | 'year' | 'custom'

const PERIOD_LABELS: Record<Period, string> = {
  day:    'Hoy',
  week:   'Semana',
  month:  'Mes',
  year:   'Año',
  custom: 'Personalizado',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, currency = 'ARS') {
  return `${currency} ${formatMoney(n)}`
}

function pct(n: number) {
  return `${n.toFixed(1)}%`
}

function marginColor(margin: number) {
  if (margin > 30) return 'text-green-400'
  if (margin > 15) return 'text-yellow-400'
  return 'text-red-400'
}

function netMarginColor(margin: number) {
  if (margin > 10) return 'text-green-400'
  if (margin > 5)  return 'text-yellow-400'
  return 'text-red-400'
}

// ─── Top Products Table ───────────────────────────────────────────────────────

function TopProductsTable({ rows }: { rows: TopProduct[] }) {
  if (rows.length === 0) {
    return <p className="text-neutral-500 text-sm py-6 text-center">Sin datos de productos</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-700">
            {['Producto', 'Ingresos', 'Costo', 'Ganancia', 'Margen'].map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-xs text-neutral-400 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 10).map((r, i) => (
            <tr key={i} className="border-b border-neutral-800 hover:bg-obsidian-900 transition-colors">
              <td className="px-4 py-2.5 text-white font-medium">{r.productName}</td>
              <td className="px-4 py-2.5 text-gold-400 font-mono">ARS {formatMoney(r.revenue)}</td>
              <td className="px-4 py-2.5 text-neutral-300 font-mono">ARS {formatMoney(r.cost)}</td>
              <td className="px-4 py-2.5 font-mono">
                <span className={r.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                  ARS {formatMoney(r.profit)}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <span className={`font-semibold ${marginColor(r.margin)}`}>
                  {pct(r.margin)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinanceDashboardPage() {
  const [period, setPeriod]   = useState<Period>('month')
  const [from, setFrom]       = useState('')
  const [to, setTo]           = useState('')

  const effectivePeriod = period === 'custom' ? 'custom' : period
  const effectiveFrom   = period === 'custom' ? from : undefined
  const effectiveTo     = period === 'custom' ? to   : undefined

  const { data, isLoading } = useFinanceDashboard(effectivePeriod, effectiveFrom, effectiveTo)
  const { data: cf }        = useCashFlow(
    period === 'day' ? 'hour' : period === 'week' ? 'day' : 'week',
    effectiveFrom,
    effectiveTo,
  )

  const kpis       = data?.kpis
  const currency   = kpis?.currency ?? 'ARS'
  const topProducts = data?.topProducts ?? []
  const revenueByDay = data?.revenueByDay ?? []
  const cashEntries  = cf?.entries ?? []

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Dashboard Financiero</h1>
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-gold-500 text-obsidian-900'
                  : 'bg-obsidian-800 text-neutral-400 hover:text-white'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date range */}
      {period === 'custom' && (
        <div className="flex items-end gap-3 bg-obsidian-800 rounded-xl p-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Desde</label>
            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Hasta</label>
            <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
        </div>
      )}

      {!isLoading && !data && (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
          <TrendingUp className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-lg font-medium">Sin datos para el período seleccionado</p>
          <p className="text-sm mt-1">Ajusta el rango de fechas para ver información financiera</p>
        </div>
      )}

      {!isLoading && kpis && (
        <>
          {/* KPI Cards — primary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-obsidian-800 rounded-xl p-4">
              <p className="text-xs text-neutral-400 mb-1">Facturación</p>
              <p className="text-xl font-bold text-gold-400">{fmt(kpis.totalRevenue, currency)}</p>
              <div className="flex items-center gap-1 mt-1.5">
                {kpis.revenueVsPreviousPeriod >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                )}
                <span className={`text-xs ${kpis.revenueVsPreviousPeriod >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {kpis.revenueVsPreviousPeriod >= 0 ? '+' : ''}{pct(kpis.revenueVsPreviousPeriod)} vs período anterior
                </span>
              </div>
            </div>

            <div className="bg-obsidian-800 rounded-xl p-4">
              <p className="text-xs text-neutral-400 mb-1">Costo de Compras</p>
              <p className="text-xl font-bold text-white">{fmt(kpis.totalCosts, currency)}</p>
            </div>

            <div className="bg-obsidian-800 rounded-xl p-4">
              <p className="text-xs text-neutral-400 mb-1">Gastos Operativos</p>
              <p className="text-xl font-bold text-white">{fmt(kpis.totalExpenses, currency)}</p>
            </div>

            <div className="bg-obsidian-800 rounded-xl p-4">
              <p className="text-xs text-neutral-400 mb-1">Ganancia Bruta</p>
              <p className={`text-xl font-bold ${kpis.grossProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {fmt(kpis.grossProfit, currency)}
              </p>
            </div>

            <div className="bg-obsidian-800 rounded-xl p-4">
              <p className="text-xs text-neutral-400 mb-1">Ganancia Neta</p>
              <p className={`text-xl font-bold ${kpis.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {fmt(kpis.netProfit, currency)}
              </p>
            </div>

            <div className="bg-obsidian-800 rounded-xl p-4">
              <p className="text-xs text-neutral-400 mb-1">Margen Neto</p>
              <p className={`text-xl font-bold ${netMarginColor(kpis.netMargin)}`}>
                {pct(kpis.netMargin)}
              </p>
            </div>
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="bg-obsidian-800 rounded-xl p-4">
              <p className="text-xs text-neutral-400 mb-1">Ticket Promedio</p>
              <p className="text-lg font-semibold text-white">{fmt(kpis.averageTicket, currency)}</p>
            </div>
            <div className="bg-obsidian-800 rounded-xl p-4">
              <p className="text-xs text-neutral-400 mb-1">Total Ventas</p>
              <p className="text-lg font-semibold text-white">{kpis.totalSales}</p>
            </div>
            <div className="bg-obsidian-800 rounded-xl p-4">
              <p className="text-xs text-neutral-400 mb-1">Margen Bruto</p>
              <p className={`text-lg font-semibold ${marginColor(kpis.grossMargin)}`}>{pct(kpis.grossMargin)}</p>
            </div>
          </div>

          {/* Area chart — Ingresos vs Egresos */}
          <div className="bg-obsidian-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Ingresos vs Egresos</h3>
            {revenueByDay.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center py-10">Sin datos para el período</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueByDay} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#EAB308" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickFormatter={d => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                  />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }}
                    formatter={(v: number, name: string) => [
                      `ARS ${formatMoney(v)}`,
                      name === 'revenue' ? 'Ingresos' : 'Egresos',
                    ]}
                  />
                  <Legend
                    formatter={v => v === 'revenue' ? 'Ingresos' : 'Egresos'}
                    wrapperStyle={{ color: '#9ca3af', fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#EAB308"
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="costs"
                    stroke="#EF4444"
                    fill="url(#colorCosts)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar chart — Flujo de Caja */}
          <div className="bg-obsidian-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Flujo de Caja</h3>
            {cashEntries.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center py-10">Sin datos de flujo de caja</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cashEntries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }}
                    formatter={(v: number, name: string) => [
                      `ARS ${formatMoney(v)}`,
                      name === 'inflows' ? 'Entradas' : 'Salidas',
                    ]}
                  />
                  <Legend
                    formatter={v => v === 'inflows' ? 'Entradas' : 'Salidas'}
                    wrapperStyle={{ color: '#9ca3af', fontSize: 12 }}
                  />
                  <Bar dataKey="inflows"  fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outflows" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Products table */}
          <div className="bg-obsidian-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-700">
              <h3 className="text-sm font-semibold text-white">Productos más rentables (Top 10)</h3>
            </div>
            <TopProductsTable rows={topProducts} />
          </div>
        </>
      )}
    </div>
  )
}
