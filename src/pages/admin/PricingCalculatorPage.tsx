import { useMemo, useState } from 'react'
import { AlertTriangle, DollarSign, Droplet, Info, Package, RefreshCw, Save, Search, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button/Button'
import { StatCard } from '@/components/data-display/StatCard/StatCard'
import { cn } from '@/utils/helpers/cn'
import { useDebounce } from '@/hooks/useDebounce'
import { usePricingCalculator, useUpdatePricingSettings } from '@/features/pricingCalculator/hooks/usePricingCalculator'
import { PricingCard } from '@/features/pricingCalculator/components/PricingCard'
import { PricingSettingsModal } from '@/features/pricingCalculator/components/PricingSettingsModal'
import { formatMargin, money, parseNum } from '@/features/pricingCalculator/pricingMath'
import type { PricingGroup } from '@/types/pricingCalculator.types'

const GROUP_FILTERS: { value: PricingGroup | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'arabes', label: 'Árabes' },
  { value: 'disenador', label: 'Diseñador' },
  { value: 'nicho', label: 'Nicho' },
  { value: 'decants', label: 'Decants' },
]

const chipCls = (active: boolean) =>
  cn(
    'inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors',
    active
      ? 'border-gold-500/40 bg-gold-500/15 text-gold-400'
      : 'border-neutral-800 bg-obsidian-900 text-neutral-400 hover:text-neutral-200',
  )

/**
 * Calculadora de precios: costo de compra en USD × cotización USDT + gastos → costo en pesos → margen →
 * precio sugerido. Los decants se costean con los ml exactos del frasco + frasquito + extras.
 */
export default function PricingCalculatorPage() {
  const [group, setGroup] = useState<PricingGroup | 'all'>('all')
  const [search, setSearch] = useState('')
  const [onlyOutdated, setOnlyOutdated] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [usdtDraft, setUsdtDraft] = useState('')
  const debouncedSearch = useDebounce(search.trim(), 350)

  const { data, isLoading, isFetching, refetch } = usePricingCalculator({
    group: group === 'all' ? undefined : group,
    search: debouncedSearch || undefined,
  })
  const updateSettings = useUpdatePricingSettings()

  const settings = data?.settings
  const items = useMemo(() => data?.items ?? [], [data?.items])
  const visible = useMemo(() => (onlyOutdated ? items.filter((i) => i.hasPriceDifference) : items), [items, onlyOutdated])
  const outdatedCount = useMemo(() => items.filter((i) => i.hasPriceDifference).length, [items])

  const usdt = settings?.usdtRate ?? 0
  const usdtDirty = usdtDraft !== '' && parseNum(usdtDraft) !== usdt

  function saveUsdt() {
    const value = parseNum(usdtDraft)
    if (Number.isNaN(value) || value <= 0) {
      toast.error('Ingresá una cotización USDT mayor a 0.')
      return
    }
    updateSettings.mutate({ usdtRate: value }, {
      onSuccess: () => {
        toast.success(`Cotización actualizada a ${money(value)}`)
        setUsdtDraft('')
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Calculadora de precios</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Costo de compra en USD, conversión a pesos, margen y precio sugerido de cada perfume.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => refetch()} disabled={isFetching} title="Recargar datos" aria-label="Recargar datos">
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </Button>
          <Button variant="secondary" leftIcon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setSettingsOpen(true)} disabled={!settings}>
            Ajustes
          </Button>
        </div>
      </div>

      {/* Números */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-neutral-800 bg-obsidian-900 p-4">
          <div className="flex items-center justify-between">
            <label htmlFor="pc-usdt" className="text-sm text-neutral-400">Cotización USDT</label>
            <DollarSign className="h-4 w-4 text-gold-400" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
              <input
                id="pc-usdt"
                type="text"
                inputMode="decimal"
                value={usdtDraft !== '' ? usdtDraft : usdt || ''}
                onChange={(e) => setUsdtDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveUsdt()
                  if (e.key === 'Escape') setUsdtDraft('')
                }}
                className="h-10 w-full rounded-xl border border-neutral-800 bg-obsidian-950 pl-7 pr-3 text-base font-medium tabular-nums text-white outline-none focus:border-gold-500/50"
              />
            </div>
            {usdtDirty && (
              <Button onClick={saveUsdt} loading={updateSettings.isPending} aria-label="Guardar cotización" title="Guardar cotización">
                <Save className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {usdtDirty ? 'Enter para guardar · Esc para descartar' : `1 USD = ${money(usdt)}`}
          </p>
        </div>

        <StatCard
          label="Precios desfasados"
          value={outdatedCount}
          icon={<AlertTriangle className="h-4 w-4" />}
          loading={isLoading}
          gold={outdatedCount > 0}
        />

        <div className="rounded-2xl border border-neutral-800 bg-obsidian-900 p-4 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-neutral-400">Márgenes por categoría</p>
            {settings && (
              <p className="text-xs text-neutral-500">
                Flete {settings.shippingCost} USD · Recargo {settings.commissionPercentage}% · Comisión {settings.commissionFixedStandard} USD
              </p>
            )}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(settings?.margins ?? []).map((m) => (
              <div key={m.group} className="rounded-xl border border-neutral-800 bg-obsidian-950 px-3 py-2">
                <dt className="text-xs text-neutral-500">{m.label}</dt>
                <dd className="text-sm font-medium tabular-nums text-white">{formatMargin(m.marginType, m.marginValue)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-2xl border border-neutral-800 bg-obsidian-900 px-4 py-3 text-xs leading-snug text-neutral-400">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden="true" />
        <span>
          Cargá el <strong className="font-medium text-neutral-200">costo en USD</strong> y el margen de cada perfume: el{' '}
          <strong className="font-medium text-neutral-200">sugerido</strong> se calcula solo. El precio de venta lo fijás a mano
          o con “Aplicar sugerido”. Guardar el costo también actualiza el costo del producto (lo ves en Rentabilidad).
        </span>
      </p>

      {/* Filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por categoría">
          {GROUP_FILTERS.map((g) => (
            <button key={g.value} type="button" aria-pressed={group === g.value} onClick={() => setGroup(g.value)} className={chipCls(group === g.value)}>
              {g.value === 'decants' && <Droplet className="h-3.5 w-3.5" aria-hidden="true" />}
              {g.label}
            </button>
          ))}
          <span className="mx-1 hidden h-6 w-px bg-neutral-800 sm:block" aria-hidden="true" />
          <button type="button" aria-pressed={onlyOutdated} onClick={() => setOnlyOutdated((v) => !v)} className={chipCls(onlyOutdated)}>
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Solo desfasados
          </button>
        </div>
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU"
            aria-label="Buscar por nombre o SKU"
            className="h-10 w-full rounded-xl border border-neutral-800 bg-obsidian-950 pl-9 pr-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-gold-500/40"
          />
        </div>
      </div>

      {/* Productos */}
      {isLoading || !settings ? (
        <div className="rounded-2xl border border-neutral-800 bg-obsidian-900 px-4 py-16 text-center text-neutral-500">Cargando…</div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-neutral-800 bg-obsidian-900 px-4 py-16 text-center">
          <Package className="h-8 w-8 text-neutral-600" aria-hidden="true" />
          <p className="mt-3 text-base font-medium text-white">No hay productos para mostrar</p>
          <p className="mt-1 text-sm text-neutral-500">
            {search || onlyOutdated || group !== 'all'
              ? 'Probá con otra búsqueda o limpiá los filtros.'
              : 'Cuando cargues productos, vas a ver acá sus costos y precios sugeridos.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => <PricingCard key={item.productId} item={item} settings={settings} />)}
        </div>
      )}

      {settingsOpen && settings && <PricingSettingsModal settings={settings} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
