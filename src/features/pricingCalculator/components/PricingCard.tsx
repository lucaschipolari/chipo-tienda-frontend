import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Droplet, Package, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import { cn } from '@/utils/helpers/cn'
import {
  useApplySuggestedPrice, useSetSalePrice, useUpdateProductPricing,
} from '../hooks/usePricingCalculator'
import {
  convertMargin, costArs, money, parseNum, suggestedBottle, suggestedDecant, totalUsd,
} from '../pricingMath'
import { CommissionToggle, MarginToggle } from './Toggles'
import type { MarginType, PricingSettings, ProductPricingItem } from '@/types/pricingCalculator.types'

export const cellInputCls = cn(
  'h-8 rounded-lg bg-obsidian-950 border border-neutral-800 px-2.5 text-sm tabular-nums text-white',
  'outline-none transition-colors hover:border-neutral-700 focus:border-gold-500/50',
)

/** Cambios sin guardar de los datos de compra/margen. undefined = sin tocar. */
interface EntryDraft {
  usd?: string
  fixed?: number
  marginType?: MarginType
  marginValue?: string
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-neutral-500">{children}</p>
}

function Profit({ amount }: { amount: number }) {
  return (
    <span className={cn('font-medium tabular-nums', amount >= 0 ? 'text-success-400' : 'text-danger-400')}>
      {money(amount)}
    </span>
  )
}

function OutdatedMark() {
  return <AlertTriangle className="inline h-3.5 w-3.5 text-warning-400" aria-label="Por debajo del sugerido" />
}

export function PricingCard({ item, settings }: { item: ProductPricingItem; settings: PricingSettings }) {
  const [draft, setDraft] = useState<EntryDraft>({})
  const [saleDraft, setSaleDraft] = useState<Record<string, string>>({})   // 'main' o variantId → precio
  const updateProduct = useUpdateProductPricing()
  const setSalePrice = useSetSalePrice()
  const applySuggested = useApplySuggestedPrice()

  const isDecant = item.isDecant
  const marginType = draft.marginType ?? item.marginType
  const marginValueStr = draft.marginValue ?? String(item.marginValue)
  const marginValue = parseNum(marginValueStr)
  const margin = Number.isNaN(marginValue) ? 0 : marginValue

  // ── Frasco: recalcula en vivo con lo que se está escribiendo ──
  const usdStr = draft.usd ?? String(item.costUsdOrigin)
  const usd = parseNum(usdStr)
  const fixed = draft.fixed ?? item.fixedCommission
  const isCheap = Math.abs(fixed - settings.commissionFixedCheap) < Math.abs(fixed - settings.commissionFixedStandard)
  const bottleUsd = totalUsd(Number.isNaN(usd) ? 0 : usd, item.percentageCommission, fixed, item.shippingCost)
  const bottleCost = costArs(bottleUsd, settings.usdtRate)
  const bottleSuggested = bottleCost > 0 ? suggestedBottle(bottleCost, marginType, margin) : 0

  // ── Decant: cada tamaño con su costo (los ml exactos + frasquito + extras) ──
  const sizes = item.decantVariants.map((v) => ({
    ...v,
    suggested: v.liquidCostArs > 0 ? suggestedDecant(v.costArs, marginType, margin) : 0,
  }))
  const hasDecantCost = (item.costPerMl ?? 0) > 0

  const isModified = Object.keys(draft).length > 0
  const salePrice = (key: string, current: number) => saleDraft[key] ?? String(current)
  const saleDirty = isDecant
    ? sizes.some((s) => saleDraft[s.variantId] !== undefined && parseNum(saleDraft[s.variantId]!) !== s.currentPriceArs)
    : saleDraft.main !== undefined && parseNum(saleDraft.main) !== item.currentPriceArs

  const noCost = isDecant ? !hasDecantCost : item.suggestedPriceArs <= 0 && !isModified
  const busy = updateProduct.isPending || setSalePrice.isPending || applySuggested.isPending

  function saveEntry() {
    if ((!isDecant && (Number.isNaN(usd) || usd < 0)) || Number.isNaN(marginValue) || marginValue < 0) {
      toast.error('Completá el costo y el margen con números iguales o mayores a 0.')
      return
    }
    updateProduct.mutate(
      {
        productId: item.productId,
        payload: {
          costUsdOrigin: isDecant ? 0 : usd,
          percentageCommission: item.percentageCommission,
          fixedCommission: fixed,
          shippingCost: item.shippingCost,
          marginType,
          marginValue,
        },
      },
      {
        onSuccess: () => {
          setDraft({})
          toast.success(isDecant ? `Margen de ${item.productName} guardado` : `Costo de ${item.productName} guardado`)
        },
      },
    )
  }

  function saveSalePrice() {
    const entries = Object.entries(saleDraft).map(([k, v]) => [k, parseNum(v)] as const)
    if (entries.some(([, v]) => Number.isNaN(v) || v <= 0)) {
      toast.error('El precio de venta tiene que ser mayor a 0.')
      return
    }
    const payload = isDecant
      ? { variantPrices: entries.map(([variantId, price]) => ({ variantId, price })) }
      : { priceArs: entries.find(([k]) => k === 'main')![1] }
    setSalePrice.mutate(
      { productId: item.productId, payload },
      {
        onSuccess: () => {
          setSaleDraft({})
          toast.success(`Precio de ${item.productName} actualizado`)
        },
      },
    )
  }

  function apply() {
    applySuggested.mutate([item.productId], {
      onSuccess: (r) =>
        r.updatedProductsCount > 0
          ? toast.success(`${item.productName}: precio sugerido aplicado`)
          : toast.error('Este producto todavía no tiene un precio sugerido.'),
    })
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border bg-obsidian-900 p-4 transition-colors',
        isModified || saleDirty ? 'border-gold-500/40' : 'border-neutral-800 hover:border-neutral-700',
      )}
    >
      {/* Encabezado */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-obsidian-950 border border-neutral-800">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-contain p-0.5" />
          ) : isDecant ? (
            <Droplet className="h-5 w-5 text-neutral-600" aria-hidden="true" />
          ) : (
            <Package className="h-5 w-5 text-neutral-600" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-medium text-white" title={item.productName}>{item.productName}</p>
            <Badge size="sm" variant={isDecant ? 'gold' : 'default'}>{isDecant ? 'Decant' : item.categoryName}</Badge>
          </div>
          <p className="truncate text-xs text-neutral-500">{item.sku}</p>
        </div>
        {!isModified && (
          noCost ? (
            <Badge size="sm" variant="secondary">Sin costo</Badge>
          ) : item.hasPriceDifference ? (
            <Badge size="sm" variant="warning"><AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" />Desfasado</Badge>
          ) : (
            <Badge size="sm" variant="success"><CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />Al día</Badge>
          )
        )}
      </div>

      {/* Costo + margen */}
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-obsidian-950/60 p-3 border border-neutral-800">
        <div className="min-w-0">
          <Label>Costo</Label>
          {isDecant ? (
            hasDecantCost ? (
              <div className="mt-1 space-y-0.5">
                <p className="text-sm font-medium tabular-nums text-white">{money(item.bottleCostArs ?? 0)}</p>
                <p className="text-xs tabular-nums text-neutral-500">
                  {money(item.costPerMl ?? 0)}/ml · {item.bottleMl} ml
                </p>
                {sizes.map((s) => (
                  <p key={s.variantId} className="text-sm tabular-nums text-neutral-200">
                    <span className="mr-1.5 text-xs text-neutral-500">{s.ml} ml</span>{money(s.costArs)}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs leading-snug text-neutral-400">
                Cargá el costo y los ml del frasco en Productos para calcular este decant.
              </p>
            )
          ) : (
            <div className="mt-1 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label={`Costo en USD de ${item.productName}`}
                  value={usdStr}
                  onChange={(e) => setDraft((d) => ({ ...d, usd: e.target.value }))}
                  className={cn(cellInputCls, 'w-20')}
                />
                <span className="text-xs text-neutral-500">USD</span>
                {!item.hasEntry && item.costUsdOrigin > 0 && !isModified && (
                  <span
                    className="text-[11px] text-info-400"
                    title="Calculado desde el costo en pesos del producto. Guardalo para fijarlo."
                  >
                    estimado
                  </span>
                )}
              </div>
              <p className="text-sm font-medium tabular-nums text-white">
                {money(bottleCost)} <span className="text-xs font-normal text-neutral-500">en pesos</span>
              </p>
              <p className="text-[11px] leading-snug text-neutral-500">
                Recargo {item.percentageCommission}% + {fixed} USD · Flete {item.shippingCost} USD
              </p>
              <CommissionToggle
                isCheap={isCheap}
                onChange={(cheap) =>
                  setDraft((d) => ({ ...d, fixed: cheap ? settings.commissionFixedCheap : settings.commissionFixedStandard }))}
                standard={settings.commissionFixedStandard}
                cheap={settings.commissionFixedCheap}
                label={`Comisión de ${item.productName}`}
              />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <Label>Margen</Label>
          <div className="mt-1 flex flex-col items-start gap-1.5">
            <MarginToggle
              value={marginType}
              label={`Tipo de margen de ${item.productName}`}
              onChange={(t) =>
                setDraft((d) => ({
                  ...d,
                  marginType: t,
                  // Mantiene la misma ganancia: en decants sobre el costo del tamaño más chico.
                  marginValue: String(convertMargin(isDecant ? sizes[0]?.costArs ?? 0 : bottleCost, marginType, t, margin)),
                }))}
            />
            <div className="flex items-center gap-1">
              {marginType === 'FixedAmount' && <span className="text-xs text-neutral-500">$</span>}
              <input
                type="text"
                inputMode="decimal"
                aria-label={`Margen de ${item.productName}`}
                value={marginValueStr}
                onChange={(e) => setDraft((d) => ({ ...d, marginValue: e.target.value }))}
                className={cn(cellInputCls, marginType === 'Percentage' ? 'w-16' : 'w-24')}
              />
              {marginType === 'Percentage' && <span className="text-xs text-neutral-500">%</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Sugerido + precio de venta */}
      {isDecant ? (
        hasDecantCost && (
          <div className="space-y-1.5">
            <div className="grid grid-cols-[3rem_1fr_1fr_auto] items-center gap-2 text-xs text-neutral-500">
              <span /> <span>Sugerido</span> <span>Precio de venta</span> <span className="text-right">Ganancia</span>
            </div>
            {sizes.map((s) => {
              const sale = salePrice(s.variantId, s.currentPriceArs)
              const saleNum = parseNum(sale)
              return (
                <div key={s.variantId} className="grid grid-cols-[3rem_1fr_1fr_auto] items-center gap-2">
                  <span className="text-xs text-neutral-500">{s.ml} ml</span>
                  <span className="text-sm font-medium tabular-nums text-white">{money(s.suggested)}</span>
                  <span className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label={`Precio de venta de ${s.ml} ml de ${item.productName}`}
                      value={sale}
                      onChange={(e) => setSaleDraft((d) => ({ ...d, [s.variantId]: e.target.value }))}
                      className={cn(cellInputCls, 'w-24')}
                    />
                    {s.hasPriceDifference && <OutdatedMark />}
                  </span>
                  <span className="text-right text-sm">
                    <Profit amount={(Number.isNaN(saleNum) ? 0 : saleNum) - s.costArs} />
                  </span>
                </div>
              )
            })}
            <p className="text-[11px] text-neutral-500">
              Packaging incluido en el costo: {sizes.map((s) => `${s.ml} ml ${money(s.packagingArs)}`).join(' · ')}
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <Label>Precio sugerido</Label>
            <p className="mt-1 text-base font-semibold tabular-nums text-white">
              {bottleSuggested > 0 ? money(bottleSuggested) : '—'}
            </p>
          </div>
          <div className="min-w-0">
            <Label>Precio de venta</Label>
            <div className="mt-1 flex items-center gap-1">
              <input
                type="text"
                inputMode="decimal"
                aria-label={`Precio de venta de ${item.productName}`}
                value={salePrice('main', item.currentPriceArs)}
                onChange={(e) => setSaleDraft({ main: e.target.value })}
                className={cn(cellInputCls, 'w-28')}
              />
              {item.hasPriceDifference && !isModified && <OutdatedMark />}
            </div>
            {bottleCost > 0 && (
              <p className="mt-1 text-xs text-neutral-500">
                Ganancia{' '}
                <Profit amount={(parseNum(salePrice('main', item.currentPriceArs)) || 0) - bottleCost} />
              </p>
            )}
          </div>
        </div>
      )}

      {/* Acciones */}
      {(isModified || saleDirty || item.hasPriceDifference) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-800 pt-3">
          {isModified && (
            <>
              <Button size="xs" onClick={saveEntry} loading={updateProduct.isPending} disabled={busy}>
                {isDecant ? 'Guardar margen' : 'Guardar costo'}
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setDraft({})} disabled={busy}>Descartar</Button>
            </>
          )}
          {saleDirty && (
            <>
              <Button size="xs" onClick={saveSalePrice} loading={setSalePrice.isPending} disabled={busy}>Guardar precio</Button>
              <Button size="xs" variant="ghost" onClick={() => setSaleDraft({})} disabled={busy}>Descartar</Button>
            </>
          )}
          {!isModified && !saleDirty && item.hasPriceDifference && (
            <Button
              size="xs"
              variant="secondary"
              leftIcon={<Wand2 className="h-3.5 w-3.5" />}
              onClick={apply}
              loading={applySuggested.isPending}
              title="Pasa el precio sugerido al catálogo"
            >
              Aplicar sugerido
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
