import { useMemo, useState } from 'react'
import {
  Eye, ShoppingCart, Heart, Search, Users, TrendingUp, TrendingDown, Package, Loader2, DollarSign,
} from 'lucide-react'
import { useAnalyticsDashboard } from '@/features/analytics/hooks/useAnalytics'
import type { ProductStat, SearchStat } from '@/features/analytics/analyticsService'
import { cn } from '@/utils/helpers/cn'

const PERIODS = { '7': 'Últimos 7 días', '30': 'Últimos 30 días', '90': 'Últimos 90 días' } as const
type PeriodKey = keyof typeof PERIODS

function KpiCard({ label, value, icon, sub, trend }: {
  label: string; value: string | number; icon: React.ReactNode; sub?: string; trend?: number
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 p-4" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">{icon}</span>
        {trend !== undefined && trend !== 0 && (
          <span className={cn('flex items-center gap-0.5 text-xs font-medium',
            trend > 0 ? 'text-green-400' : 'text-red-400')}>
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-neutral-600">{sub}</p>}
    </div>
  )
}

function ProductTable({ title, icon, rows, showConversion }: {
  title: string; icon: React.ReactNode; rows: ProductStat[]; showConversion?: boolean
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-neutral-800">
        <span className="text-gold-400">{icon}</span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-neutral-600">Todavía no hay datos en este período.</p>
      ) : (
        <ul className="divide-y divide-neutral-800/60">
          {rows.map((r, i) => (
            <li key={r.productId} className="flex items-center gap-3 px-5 py-3">
              <span className="w-5 text-sm font-bold text-neutral-600">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">{r.productName}</p>
                {r.categoryName && <p className="text-[11px] text-neutral-600">{r.categoryName}</p>}
              </div>
              {showConversion && r.conversionRate != null && (
                <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-neutral-400">
                  {r.conversionRate}% conv.
                </span>
              )}
              <span className="text-sm font-semibold text-gold-400">{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SearchTable({ title, icon, rows, danger }: {
  title: string; icon: React.ReactNode; rows: SearchStat[]; danger?: boolean
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-neutral-800">
        <span className={danger ? 'text-red-400' : 'text-gold-400'}>{icon}</span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-neutral-600">
          {danger ? '¡Bien! No hubo búsquedas sin resultado.' : 'Todavía no hay búsquedas en este período.'}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-800/60">
          {rows.map((r, i) => (
            <li key={r.term} className="flex items-center gap-3 px-5 py-3">
              <span className="w-5 text-sm font-bold text-neutral-600">{i + 1}</span>
              <p className="min-w-0 flex-1 truncate text-sm text-white">“{r.term}”</p>
              <span className={cn('text-sm font-semibold', danger ? 'text-red-400' : 'text-gold-400')}>{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<PeriodKey>('30')
  const range = useMemo(() => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - Number(period))
    return { from: from.toISOString(), to: to.toISOString() }
  }, [period])

  const { data, isLoading } = useAnalyticsDashboard(range.from, range.to)
  const s = data?.summary

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-white tracking-wide">Analítica</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Qué miran e interactúan los visitantes de tu tienda</p>
        </div>
        <div className="flex items-center gap-1.5">
          {(Object.keys(PERIODS) as PeriodKey[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                period === p
                  ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                  : 'text-neutral-500 hover:text-neutral-300 border border-transparent')}
            >
              {PERIODS[p]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-neutral-600" /></div>
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Visitantes únicos" value={s?.uniqueVisitors ?? 0} icon={<Users className="h-4 w-4" />} />
            <KpiCard label="Vistas de productos" value={s?.totalViews ?? 0} icon={<Eye className="h-4 w-4" />} trend={s?.viewsVsPreviousPeriod} sub="vs período anterior" />
            <KpiCard label="Conversión vista→carrito" value={`${s?.viewToCartRate ?? 0}%`} icon={<ShoppingCart className="h-4 w-4" />} sub={`${s?.totalAddToCart ?? 0} agregados`} />
            <KpiCard label="Búsquedas" value={s?.totalSearches ?? 0} icon={<Search className="h-4 w-4" />} />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Unidades vendidas" value={s?.totalUnitsSold ?? 0} icon={<DollarSign className="h-4 w-4" />} />
            <KpiCard label="Favoritos marcados" value={s?.totalFavorites ?? 0} icon={<Heart className="h-4 w-4" />} />
            <KpiCard label="Productos distintos vistos" value={s?.uniqueProductsViewed ?? 0} icon={<Package className="h-4 w-4" />} />
            <KpiCard label="Búsquedas sin resultado" value={data?.noResultSearches.reduce((a, b) => a + b.count, 0) ?? 0} icon={<Search className="h-4 w-4" />} />
          </div>

          {/* Rankings */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ProductTable title="Más vistos (les llama la atención)" icon={<Eye className="h-4 w-4" />} rows={data?.topViewed ?? []} />
            <ProductTable title="Más vendidos (ventas reales)" icon={<DollarSign className="h-4 w-4" />} rows={data?.topSold ?? []} showConversion />
            <ProductTable title="Más agregados al carrito" icon={<ShoppingCart className="h-4 w-4" />} rows={data?.topAddedToCart ?? []} showConversion />
            <ProductTable title="Más marcados como favoritos" icon={<Heart className="h-4 w-4" />} rows={data?.topFavorited ?? []} />
            <SearchTable title="Búsquedas más frecuentes" icon={<Search className="h-4 w-4" />} rows={data?.topSearches ?? []} />
          </div>

          <SearchTable
            title="Búsquedas SIN resultado (te lo piden y no lo tenés)"
            icon={<Search className="h-4 w-4" />}
            rows={data?.noResultSearches ?? []}
            danger
          />
        </>
      )}
    </div>
  )
}
