import { useMemo, useState } from 'react'
import {
  TrendingUp, TrendingDown, Search, X, SlidersHorizontal, Settings2,
  Eye, ArrowUpDown, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle, Save,
} from 'lucide-react'
import { Button } from '@/components/ui/Button/Button'
import { Badge } from '@/components/ui/Badge/Badge'
import { Modal } from '@/components/ui/Modal/Modal'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { StatCard } from '@/components/data-display/StatCard/StatCard'
import { cn } from '@/utils/helpers/cn'
import { formatMoney } from '@/utils/helpers/formatMoney'
import { useDebounce } from '@/hooks/useDebounce'
import { useCategories, flattenCategories } from '@/features/categories/hooks/useCategories'
import {
  useProfitability, useProfitabilitySummary, useProductProfitability,
  useProfitabilitySettings, useSetProfitabilitySettings, useSetProductTargetMargin,
} from '@/features/profitability/hooks/useProfitability'
import type {
  ProfitabilityRow, ProfitabilityStatus, GetProfitabilityParams, ProfitabilitySettings,
} from '@/types/profitability.types'

// ─── Config de estados ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ProfitabilityStatus, {
  label: string; variant: 'success' | 'warning' | 'danger' | 'default'; icon: React.ReactNode
}> = {
  Optimo:   { label: 'Óptimo',      variant: 'success', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  Bajo:     { label: 'Bajo margen', variant: 'warning', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  Critico:  { label: 'Crítico',     variant: 'danger',  icon: <AlertOctagon className="h-3.5 w-3.5" /> },
  SinDatos: { label: 'Sin datos',   variant: 'default', icon: <HelpCircle className="h-3.5 w-3.5" /> },
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'Optimo', label: 'Óptimo' },
  { value: 'Bajo', label: 'Bajo margen' },
  { value: 'Critico', label: 'Crítico' },
  { value: 'SinDatos', label: 'Sin datos' },
]

const SORT_OPTIONS = [
  { value: '', label: 'Orden: Nombre' },
  { value: 'margin:asc', label: 'Menor margen' },
  { value: 'margin:desc', label: 'Mayor margen' },
  { value: 'lastCost:desc', label: 'Mayor costo' },
  { value: 'lastCost:asc', label: 'Menor costo' },
  { value: 'costChange:desc', label: 'Mayor aumento de costo' },
  { value: 'priceDiff:desc', label: 'Mayor diferencia vs sugerido' },
]

const pct = (v?: number) => (v == null ? '—' : `${v.toFixed(1)}%`)
const money = (v?: number, cur = 'ARS') => (v == null ? '—' : `${cur} ${formatMoney(v)}`)

// ─── Página ─────────────────────────────────────────────────────────────────────
export default function ProfitabilityPage() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState('')
  const [costIncreased, setCostIncreased] = useState(false)
  const [belowSuggested, setBelowSuggested] = useState(false)
  const [sort, setSort] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const debouncedSearch = useDebounce(search, 350)

  const params = useMemo<GetProfitabilityParams>(() => {
    const [sortBy, sortDir] = sort ? sort.split(':') : [undefined, undefined]
    return {
      search: debouncedSearch || undefined,
      categoryId: categoryId || undefined,
      status: status || undefined,
      costIncreased: costIncreased || undefined,
      belowSuggested: belowSuggested || undefined,
      sortBy: sortBy as GetProfitabilityParams['sortBy'],
      sortDir: sortDir as GetProfitabilityParams['sortDir'],
    }
  }, [debouncedSearch, categoryId, status, costIncreased, belowSuggested, sort])

  const { data: rows = [], isLoading } = useProfitability(params)
  const { data: summary } = useProfitabilitySummary()
  const { data: categories = [] } = useCategories()
  const flatCats = useMemo(() => flattenCategories(categories), [categories])

  const hasFilters = !!(search || categoryId || status || costIncreased || belowSuggested || sort)
  const clearFilters = () => {
    setSearch(''); setCategoryId(''); setStatus(''); setCostIncreased(false)
    setBelowSuggested(false); setSort('')
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-white">Costos y Rentabilidad</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Analizá el margen real de cada producto y detectá cuáles necesitan revisión de precio.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
          <Settings2 className="h-4 w-4" /> Configuración
        </Button>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard label="Productos analizados" value={summary?.totalAnalyzed ?? 0} />
        <StatCard label="🟢 Margen correcto" value={summary?.optimo ?? 0} green />
        <StatCard label="🟡 Bajo el objetivo" value={summary?.bajo ?? 0} />
        <StatCard label="🔴 Margen crítico" value={summary?.critico ?? 0} />
        <StatCard label="📈 Aumentó el costo" value={summary?.costIncreased ?? 0} />
        <StatCard label="Revisar precio" value={summary?.needsPriceReview ?? 0} gold />
      </div>

      {/* Filtros */}
      <div className="bg-obsidian-900 border border-neutral-800 rounded-2xl p-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por producto, SKU o marca…"
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-obsidian-950 border border-neutral-800 text-sm text-white placeholder:text-neutral-600 focus:border-gold-500/40 outline-none"
            />
          </div>

          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="h-10 px-3 rounded-xl bg-obsidian-950 border border-neutral-800 text-sm text-white outline-none focus:border-gold-500/40">
            <option value="">Todas las marcas</option>
            {flatCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="h-10 px-3 rounded-xl bg-obsidian-950 border border-neutral-800 text-sm text-white outline-none focus:border-gold-500/40">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="h-10 px-3 rounded-xl bg-obsidian-950 border border-neutral-800 text-sm text-white outline-none focus:border-gold-500/40">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-sm">
          <label className="flex items-center gap-2 cursor-pointer text-neutral-400 hover:text-neutral-200">
            <input type="checkbox" checked={costIncreased} onChange={(e) => setCostIncreased(e.target.checked)}
              className="accent-gold-500" />
            Solo con aumento de costo
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-neutral-400 hover:text-neutral-200">
            <input type="checkbox" checked={belowSuggested} onChange={(e) => setBelowSuggested(e.target.checked)}
              className="accent-gold-500" />
            Precio por debajo del sugerido
          </label>
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-neutral-500 hover:text-white">
              <X className="h-3.5 w-3.5" /> Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-obsidian-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500 border-b border-neutral-800">
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Marca</th>
                <th className="px-4 py-3 font-medium text-right">Venta</th>
                <th className="px-4 py-3 font-medium text-right">Últ. costo</th>
                <th className="px-4 py-3 font-medium text-right" title="Variación entre el costo anterior y el último">Var. costo</th>
                <th className="px-4 py-3 font-medium text-right" title="Ganancia = Precio de venta − Último costo">Ganancia</th>
                <th className="px-4 py-3 font-medium text-right" title="Margen % = ((Venta − Costo) / Venta) × 100">Margen</th>
                <th className="px-4 py-3 font-medium text-right">Objetivo</th>
                <th className="px-4 py-3 font-medium text-right" title="Precio sugerido = Costo / (1 − margen objetivo)">Sugerido</th>
                <th className="px-4 py-3 font-medium text-right">Dif.</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={12} className="px-4 py-10 text-center text-neutral-500">Cargando…</td></tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={12} className="px-4 py-10 text-center text-neutral-500">No hay productos que coincidan con los filtros.</td></tr>
              )}
              {rows.map((r) => (
                <ProfitabilityTableRow key={r.variantId} row={r} onOpen={() => setDetailId(r.productId)} />
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && rows.length > 0 && (
          <div className="px-4 py-2.5 border-t border-neutral-800 text-xs text-neutral-500">
            {rows.length} {rows.length === 1 ? 'variante' : 'variantes'}
          </div>
        )}
      </div>

      {/* Drawer de detalle */}
      <ProductDetailDrawer productId={detailId} onClose={() => setDetailId(null)} />

      {/* Modal de configuración */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

// ─── Fila de la tabla ─────────────────────────────────────────────────────────
function ProfitabilityTableRow({ row, onOpen }: { row: ProfitabilityRow; onOpen: () => void }) {
  const st = STATUS_CONFIG[row.status]
  const costUp = (row.costChangePct ?? 0) > 0
  const costDown = (row.costChangePct ?? 0) < 0
  const diffPositive = (row.priceDifference ?? 0) > 0

  return (
    <tr className="border-b border-neutral-800/60 hover:bg-obsidian-800/40">
      <td className="px-4 py-3">
        <div className="text-white">{row.productName}</div>
        {row.variantLabel && <div className="text-xs text-neutral-500">{row.variantLabel}</div>}
      </td>
      <td className="px-4 py-3 text-neutral-400">{row.brand ?? '—'}</td>
      <td className="px-4 py-3 text-right text-neutral-200">{money(row.salePrice, row.currency)}</td>
      <td className="px-4 py-3 text-right text-neutral-200">{money(row.lastCost, row.currency)}</td>
      <td className="px-4 py-3 text-right">
        {row.costChangePct == null ? <span className="text-neutral-600">—</span> : (
          <span className={cn('inline-flex items-center gap-1', costUp && 'text-danger-400', costDown && 'text-success-400', !costUp && !costDown && 'text-neutral-400')}>
            {costUp && <TrendingUp className="h-3.5 w-3.5" />}
            {costDown && <TrendingDown className="h-3.5 w-3.5" />}
            {row.costChangePct > 0 ? '+' : ''}{row.costChangePct.toFixed(1)}%
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right text-neutral-200">{money(row.profit, row.currency)}</td>
      <td className="px-4 py-3 text-right font-medium text-white">{pct(row.marginPct)}</td>
      <td className="px-4 py-3 text-right text-neutral-400">
        {row.targetMarginPct.toFixed(0)}%{row.targetIsCustom && <span title="Margen específico del producto" className="text-gold-400"> *</span>}
      </td>
      <td className="px-4 py-3 text-right text-neutral-200">{money(row.suggestedPrice, row.currency)}</td>
      <td className={cn('px-4 py-3 text-right', diffPositive ? 'text-gold-400' : 'text-neutral-500')}>
        {row.priceDifference == null ? '—' : `${row.priceDifference > 0 ? '+' : ''}${formatMoney(row.priceDifference)}`}
      </td>
      <td className="px-4 py-3">
        <Badge variant={st.variant} size="sm">{st.icon}{st.label}</Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <button onClick={onOpen} className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-obsidian-800" title="Ver análisis">
          <Eye className="h-4 w-4" />
        </button>
      </td>
    </tr>
  )
}

// ─── Drawer de detalle ─────────────────────────────────────────────────────────
function ProductDetailDrawer({ productId, onClose }: { productId: string | null; onClose: () => void }) {
  const { data, isLoading } = useProductProfitability(productId)
  const setTarget = useSetProductTargetMargin()
  const [marginInput, setMarginInput] = useState('')

  const a = data?.analysis
  const st = a ? STATUS_CONFIG[a.status] : null

  return (
    <Drawer isOpen={!!productId} onClose={onClose} title="Análisis de rentabilidad" size="xl">
      {isLoading || !a ? (
        <div className="text-neutral-500 text-sm py-10 text-center">Cargando…</div>
      ) : (
        <div className="space-y-6">
          {/* Producto */}
          <section>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{a.productName}</h3>
                <p className="text-sm text-neutral-500">{a.brand ?? '—'} · SKU {a.sku}{a.variantLabel ? ` · ${a.variantLabel}` : ''}</p>
              </div>
              {st && <Badge variant={st.variant}>{st.icon}{st.label}</Badge>}
            </div>
          </section>

          {/* Precio & rentabilidad */}
          <section className="grid grid-cols-2 gap-3">
            <Metric label="Precio de venta" value={money(a.salePrice, a.currency)} />
            <Metric label="Precio sugerido" value={money(a.suggestedPrice, a.currency)} accent />
            <Metric label="Último costo" value={money(a.lastCost, a.currency)} />
            <Metric label="Costo anterior" value={money(a.previousCost, a.currency)} />
            <Metric label="Ganancia" value={money(a.profit, a.currency)} />
            <Metric label="Diferencia vs sugerido"
              value={a.priceDifference == null ? '—' : `${a.priceDifference > 0 ? '+' : ''}${formatMoney(a.priceDifference)}`}
              accent={(a.priceDifference ?? 0) > 0} />
            <Metric label="Margen actual" value={pct(a.marginPct)} />
            <Metric label="Margen objetivo" value={`${a.targetMarginPct.toFixed(0)}%${a.targetIsCustom ? ' (propio)' : ' (general)'}`} />
          </section>

          {/* Margen objetivo por producto */}
          <section className="bg-obsidian-900 border border-neutral-800 rounded-xl p-4">
            <p className="text-sm font-medium text-neutral-300 mb-2">Margen objetivo específico</p>
            <p className="text-xs text-neutral-500 mb-3">
              Dejalo vacío para usar el margen general. Con valor propio, este producto se analiza contra ese margen.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} max={99} step={1}
                value={marginInput}
                onChange={(e) => setMarginInput(e.target.value)}
                placeholder={a.targetIsCustom ? String(a.targetMarginPct) : 'general'}
                className="h-9 w-28 px-3 rounded-lg bg-obsidian-950 border border-neutral-800 text-sm text-white outline-none focus:border-gold-500/40"
              />
              <span className="text-neutral-500 text-sm">%</span>
              <Button size="sm" disabled={setTarget.isPending}
                onClick={() => productId && setTarget.mutate({
                  productId,
                  targetMarginPct: marginInput.trim() === '' ? null : Number(marginInput),
                })}>
                Guardar
              </Button>
              {a.targetIsCustom && (
                <Button size="sm" variant="ghost" disabled={setTarget.isPending}
                  onClick={() => { productId && setTarget.mutate({ productId, targetMarginPct: null }); setMarginInput('') }}>
                  Usar general
                </Button>
              )}
            </div>
          </section>

          {/* Historial de costos */}
          <section>
            <p className="text-sm font-medium text-neutral-300 mb-2">Historial de costos</p>
            {data.history.length === 0 ? (
              <p className="text-sm text-neutral-500">
                {a.isDecant ? 'El costo del decant se calcula a partir del frasco (no hay historial de compras).' : 'Sin compras registradas todavía.'}
              </p>
            ) : (
              <>
                <CostSparkline history={data.history} currency={a.currency} />
                <div className="mt-3 space-y-1.5">
                  {data.history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between text-sm bg-obsidian-900 border border-neutral-800 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-white">{money(h.unitCost, h.currency)}</span>
                        <span className="ml-2 text-xs text-neutral-500">
                          {new Date(h.recordedAt).toLocaleDateString('es-AR')} · {sourceLabel(h.source)}
                        </span>
                      </div>
                      {h.changePct != null && (
                        <span className={cn('text-xs inline-flex items-center gap-1',
                          h.changePct > 0 ? 'text-danger-400' : h.changePct < 0 ? 'text-success-400' : 'text-neutral-500')}>
                          {h.changePct > 0 ? <TrendingUp className="h-3 w-3" /> : h.changePct < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                          {h.changePct > 0 ? '+' : ''}{h.changePct.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </Drawer>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-obsidian-900 border border-neutral-800 rounded-xl p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={cn('text-base font-medium mt-1', accent ? 'text-gold-400' : 'text-white')}>{value}</p>
    </div>
  )
}

// Mini gráfico de evolución de costo (barras), sin librería.
function CostSparkline({ history, currency }: { history: { unitCost: number; recordedAt: string }[]; currency: string }) {
  const chrono = [...history].reverse() // viejo → nuevo
  const max = Math.max(...chrono.map((h) => h.unitCost), 1)
  return (
    <div className="flex items-end gap-1.5 h-24 bg-obsidian-950 border border-neutral-800 rounded-xl p-3">
      {chrono.map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
          <div className="w-full bg-gold-500/40 group-hover:bg-gold-500/70 rounded-t transition-colors"
            style={{ height: `${Math.max((h.unitCost / max) * 100, 4)}%` }}
            title={`${currency} ${formatMoney(h.unitCost)} · ${new Date(h.recordedAt).toLocaleDateString('es-AR')}`} />
        </div>
      ))}
    </div>
  )
}

function sourceLabel(source: string) {
  switch (source) {
    case 'PurchaseReceipt': return 'Compra recibida'
    case 'ManualEdit': return 'Edición manual'
    case 'Initial': return 'Carga inicial'
    default: return source
  }
}

// ─── Modal de configuración ──────────────────────────────────────────────────────
function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useProfitabilitySettings()
  const save = useSetProfitabilitySettings()
  const [form, setForm] = useState<ProfitabilitySettings | null>(null)

  const current = form ?? data ?? null

  return (
    <Modal isOpen={open} onClose={onClose} title="Configuración de rentabilidad">
      {!current ? (
        <div className="text-neutral-500 text-sm py-6 text-center">Cargando…</div>
      ) : (
        <div className="space-y-4">
          <Field label="Margen objetivo general (%)" hint="Se usa cuando el producto no tiene un margen propio.">
            <input type="number" min={0} max={99} value={current.targetMarginPct}
              onChange={(e) => setForm({ ...current, targetMarginPct: Number(e.target.value) })}
              className={inputCls} />
          </Field>
          <Field label="Banda crítica (puntos)" hint="Cuántos puntos por debajo del objetivo pasa de amarillo (bajo) a rojo (crítico).">
            <input type="number" min={0} max={99} value={current.criticalBandPct}
              onChange={(e) => setForm({ ...current, criticalBandPct: Number(e.target.value) })}
              className={inputCls} />
          </Field>
          <Field label="Redondeo del precio sugerido" hint="Paso de redondeo. 0 = sin redondeo.">
            <div className="flex gap-2">
              <input type="number" min={0} step={50} value={current.roundingStep}
                onChange={(e) => setForm({ ...current, roundingStep: Number(e.target.value) })}
                className={inputCls} />
              <select value={current.roundingMode}
                onChange={(e) => setForm({ ...current, roundingMode: e.target.value as ProfitabilitySettings['roundingMode'] })}
                className="h-10 px-3 rounded-xl bg-obsidian-950 border border-neutral-800 text-sm text-white outline-none focus:border-gold-500/40">
                <option value="nearest">Al más cercano</option>
                <option value="up">Hacia arriba</option>
                <option value="down">Hacia abajo</option>
              </select>
            </div>
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button disabled={save.isPending}
              onClick={() => save.mutate(current, { onSuccess: onClose })}>
              <Save className="h-4 w-4" /> Guardar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

const inputCls = 'h-10 w-full px-3 rounded-xl bg-obsidian-950 border border-neutral-800 text-sm text-white outline-none focus:border-gold-500/40'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-neutral-300 mb-1">{label}</label>
      {hint && <p className="text-xs text-neutral-500 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}
