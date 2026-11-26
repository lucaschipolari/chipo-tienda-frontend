import { cn } from '@/utils/helpers/cn'
import type { MarginType } from '@/types/pricingCalculator.types'

const groupCls = 'inline-flex shrink-0 rounded-full bg-obsidian-950 p-0.5 border border-neutral-800'
const optionCls = (active: boolean) =>
  cn(
    'rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60',
    active ? 'bg-obsidian-800 text-gold-400' : 'text-neutral-500 hover:text-neutral-200',
  )

/** Selector % / $ del margen. */
export function MarginToggle({ value, onChange, label, wide = false }: {
  value: MarginType
  onChange: (value: MarginType) => void
  label: string
  wide?: boolean
}) {
  const options: { value: MarginType; short: string; long: string }[] = [
    { value: 'Percentage', short: '%', long: 'Porcentaje' },
    { value: 'FixedAmount', short: '$', long: 'Monto fijo' },
  ]
  return (
    <div role="radiogroup" aria-label={label} className={cn(groupCls, wide ? 'h-10' : 'h-8')}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.long}
          onClick={() => onChange(o.value)}
          className={cn(optionCls(value === o.value), wide ? 'px-3 text-sm' : 'min-w-[2rem] px-2 text-sm')}
        >
          {wide ? `${o.long} (${o.short})` : o.short}
        </button>
      ))}
    </div>
  )
}

/** Comisión fija estándar o de perfume económico (solo frascos). */
export function CommissionToggle({ isCheap, onChange, standard, cheap, label }: {
  isCheap: boolean
  onChange: (cheap: boolean) => void
  standard: number
  cheap: number
  label: string
}) {
  const options = [
    { cheap: false, label: 'Estándar', usd: standard },
    { cheap: true, label: 'Económico', usd: cheap },
  ]
  return (
    <div role="radiogroup" aria-label={label} className={groupCls}>
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          role="radio"
          aria-checked={o.cheap === isCheap}
          title={`${o.label} · ${o.usd} USD`}
          onClick={() => onChange(o.cheap)}
          className={cn(optionCls(o.cheap === isCheap), 'px-2.5 py-0.5 text-[11px]')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
