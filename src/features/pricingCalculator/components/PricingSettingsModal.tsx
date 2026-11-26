import { useId, useState } from 'react'
import { Droplet, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal/Modal'
import { Button } from '@/components/ui/Button/Button'
import { cn } from '@/utils/helpers/cn'
import { useUpdatePricingSettings } from '../hooks/usePricingCalculator'
import { money, parseNum, suggestedBottle } from '../pricingMath'
import { MarginToggle } from './Toggles'
import type { MarginType, PricingSettings } from '@/types/pricingCalculator.types'

const fieldCls = cn(
  'h-10 w-full rounded-xl bg-obsidian-950 border border-neutral-800 text-sm tabular-nums text-white',
  'outline-none transition-colors hover:border-neutral-700 focus:border-gold-500/50',
)

function NumberField({ label, hint, value, onChange, prefix, suffix }: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  prefix?: string
  suffix?: string
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-neutral-300">{label}</label>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">{prefix}</span>}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldCls, prefix ? 'pl-7' : 'pl-3', suffix ? 'pr-12' : 'pr-3')}
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">{suffix}</span>}
      </div>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}

const EXAMPLE_COST = 100_000

export function PricingSettingsModal({ settings, onClose }: { settings: PricingSettings; onClose: () => void }) {
  const update = useUpdatePricingSettings()
  const str = (n: number) => String(n)

  const [usdtRate, setUsdtRate] = useState(str(settings.usdtRate))
  const [pct, setPct] = useState(str(settings.commissionPercentage))
  const [fixedStd, setFixedStd] = useState(str(settings.commissionFixedStandard))
  const [fixedCheap, setFixedCheap] = useState(str(settings.commissionFixedCheap))
  const [shipping, setShipping] = useState(str(settings.shippingCost))
  const [margins, setMargins] = useState(() =>
    settings.margins.map((m) => ({ ...m, value: str(m.marginValue) })))
  const [extras, setExtras] = useState(() =>
    settings.decantPackagingExtras.map((e) => ({ name: e.name, cost: str(e.cost) })))
  const [error, setError] = useState<string | null>(null)

  const setMargin = (i: number, partial: { marginType?: MarginType; value?: string }) =>
    setMargins((prev) => prev.map((m, j) => (j === i ? { ...m, ...partial } : m)))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const nums = [usdtRate, pct, fixedStd, fixedCheap, shipping, ...margins.map((m) => m.value)].map(parseNum)
    if (nums.some((v) => Number.isNaN(v) || v < 0)) return setError('Completá todos los campos con números iguales o mayores a 0.')
    if (parseNum(usdtRate) <= 0) return setError('La cotización USDT tiene que ser mayor a 0.')
    const cleanExtras = extras.filter((x) => x.name.trim() !== '')
    if (cleanExtras.some((x) => Number.isNaN(parseNum(x.cost)) || parseNum(x.cost) < 0))
      return setError('Cada extra de packaging necesita un costo igual o mayor a 0.')
    setError(null)

    update.mutate(
      {
        usdtRate: parseNum(usdtRate),
        commissionPercentage: parseNum(pct),
        commissionFixedStandard: parseNum(fixedStd),
        commissionFixedCheap: parseNum(fixedCheap),
        shippingCost: parseNum(shipping),
        margins: margins.map((m) => ({ group: m.group, label: m.label, marginType: m.marginType, marginValue: parseNum(m.value) })),
        decantPackagingExtras: cleanExtras.map((x) => ({ name: x.name.trim(), cost: parseNum(x.cost) })),
      },
      {
        onSuccess: () => {
          toast.success('Ajustes de la calculadora guardados.')
          onClose()
        },
      },
    )
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Ajustes de la calculadora"
      description="Valores que usa la calculadora para todos los productos. Cada producto puede tener su propio margen."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={update.isPending}>Cancelar</Button>
          <Button type="submit" form="pricing-settings-form" loading={update.isPending}>Guardar cambios</Button>
        </div>
      }
    >
      <form id="pricing-settings-form" onSubmit={submit} noValidate className="space-y-7">
        {/* Márgenes */}
        <section>
          <h3 className="text-base font-semibold text-white">Margen de ganancia</h3>
          <p className="mt-0.5 text-xs text-neutral-500">
            Porcentaje sobre el costo o monto fijo en pesos. Los precios de los frascos se redondean a los $1.000
            (para abajo si los cientos son menos de $300). El ejemplo usa un costo de {money(EXAMPLE_COST)}.
          </p>
          <ul className="mt-3 divide-y divide-neutral-800 rounded-xl border border-neutral-800">
            {margins.map((m, i) => {
              const v = parseNum(m.value)
              return (
                <li key={m.group} className="grid grid-cols-1 items-center gap-2 px-3 py-3 sm:grid-cols-[7rem_auto_1fr]">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                    {m.group === 'decants' && <Droplet className="h-3.5 w-3.5 text-gold-400" aria-hidden="true" />}
                    {m.label}
                  </span>
                  <MarginToggle value={m.marginType} onChange={(t) => setMargin(i, { marginType: t })} label={`Tipo de margen para ${m.label}`} />
                  <div className="flex items-center gap-3">
                    <div className="relative w-32 shrink-0">
                      {m.marginType === 'FixedAmount' && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>}
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label={`Margen de ${m.label}`}
                        value={m.value}
                        onChange={(e) => setMargin(i, { value: e.target.value })}
                        className={cn(fieldCls, 'text-right', m.marginType === 'FixedAmount' ? 'pl-7 pr-3' : 'pl-3 pr-7')}
                      />
                      {m.marginType === 'Percentage' && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">%</span>}
                    </div>
                    <p className="text-xs text-neutral-500" aria-live="polite">
                      {Number.isNaN(v) ? 'Ingresá un valor' : <>Vende a <span className="font-medium text-neutral-200">{money(suggestedBottle(EXAMPLE_COST, m.marginType, v))}</span></>}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Cotización y gastos */}
        <section>
          <h3 className="text-base font-semibold text-white">Cotización y gastos de compra</h3>
          <p className="mt-0.5 text-xs text-neutral-500">Se suman al costo en USD de cada frasco.</p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField label="Cotización USDT" value={usdtRate} onChange={setUsdtRate} prefix="$" suffix="ARS" hint="Pesos por cada dólar." />
            <NumberField label="Recargo de compra" value={pct} onChange={setPct} suffix="%" />
            <NumberField label="Comisión fija estándar" value={fixedStd} onChange={setFixedStd} suffix="USD" />
            <NumberField label="Comisión fija perfume económico" value={fixedCheap} onChange={setFixedCheap} suffix="USD" />
            <NumberField label="Flete por unidad" value={shipping} onChange={setShipping} suffix="USD" />
          </div>
        </section>

        {/* Packaging de decants */}
        <section>
          <h3 className="flex items-center gap-1.5 text-base font-semibold text-white">
            <Droplet className="h-4 w-4 text-gold-400" aria-hidden="true" /> Packaging de decants
          </h3>
          <p className="mt-0.5 text-xs text-neutral-500">
            Se suma al costo de cada decant. El frasquito sale de Inventario › Frascos de decants
            {settings.vialCosts.length > 0
              ? <>: {settings.vialCosts.map((v) => `${v.ml} ml ${money(v.cost)}`).join(' · ')}.</>
              : ' (todavía no está cargado).'}
            {' '}Los extras se suman a todos los tamaños.
          </p>
          <ul className="mt-3 space-y-2">
            {extras.map((x, i) => (
              <li key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={x.name}
                  placeholder="Ej. Bolsita"
                  aria-label={`Nombre del extra ${i + 1}`}
                  onChange={(e) => setExtras((p) => p.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))}
                  className={cn(fieldCls, 'min-w-0 flex-1 px-3')}
                />
                <div className="relative w-28 shrink-0">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={x.cost}
                    aria-label={`Costo del extra ${i + 1}`}
                    onChange={(e) => setExtras((p) => p.map((y, j) => (j === i ? { ...y, cost: e.target.value } : y)))}
                    className={cn(fieldCls, 'pl-7 pr-3 text-right')}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setExtras((p) => p.filter((_, j) => j !== i))}
                  aria-label={`Quitar extra ${i + 1}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-800 text-neutral-500 transition-colors hover:text-danger-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="mt-2"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setExtras((p) => [...p, { name: '', cost: '' }])}
          >
            Agregar extra
          </Button>
        </section>

        {error && (
          <p role="alert" className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-3 py-2 text-sm text-danger-400">{error}</p>
        )}
      </form>
    </Modal>
  )
}
