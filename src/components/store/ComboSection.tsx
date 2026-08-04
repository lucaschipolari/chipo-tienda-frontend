import { useState } from 'react'
import { Boxes, Plus, Check, Package } from 'lucide-react'
import { toast } from 'sonner'
import { useActiveCombos } from '@/features/combos/hooks/useCombos'
import { useCartStore } from '@/store/cartStore'
import { formatMoney } from '@/utils/helpers/formatMoney'
import type { Combo } from '@/types/combo.types'

/**
 * ComboSection — muestra los combos activos en la tienda. Al agregar un combo,
 * reparte el precio del combo entre sus productos (proporcional al precio normal)
 * y los suma al carrito con ese precio, para que el descuento del combo se
 * respete en el checkout y se descuente el stock real de cada producto.
 */
export function ComboSection() {
  const { data: combos } = useActiveCombos()
  const addItem = useCartStore(s => s.addItem)
  const [added, setAdded] = useState<string | null>(null)

  if (!combos || combos.length === 0) return null

  function addCombo(combo: Combo) {
    // El combo entra como UNA sola línea. Guardamos sus componentes con el
    // precio repartido para expandirlos en el checkout (y descontar stock real).
    const original = combo.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    let allocated = 0
    const comboItems = combo.items.map((it, idx) => {
      const share = original > 0 ? (it.unitPrice * it.quantity) / original : 1 / combo.items.length
      let lineTotal = Math.round(combo.price * share)
      if (idx === combo.items.length - 1) lineTotal = combo.price - allocated
      allocated += lineTotal
      const unit = Math.round((lineTotal / it.quantity) * 100) / 100
      return { productId: it.productId, variantId: it.variantId, quantity: it.quantity, unitPrice: unit }
    })
    const resumen = combo.items.map(i => `${i.quantity}× ${i.productName} (${i.variantLabel})`).join(', ')
    addItem({
      productId: combo.id,
      variantId: `combo:${combo.id}`,      // id sintético: no se mezcla con productos sueltos
      productName: combo.name,
      variantName: resumen,
      imageUrl: combo.imageUrl ?? undefined,
      unitPrice: combo.price,
      currency: combo.currency,
      quantity: 1,
      kind: 'combo',
      comboId: combo.id,
      comboName: combo.name,
      comboItems,
    })
    setAdded(combo.id)
    toast.success(`${combo.name} agregado al carrito`, { duration: 1800 })
    setTimeout(() => setAdded(null), 1600)
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <div className="mb-4 flex items-center gap-2">
        <Boxes className="h-5 w-5 text-white" />
        <h2 className="font-display text-xl font-medium text-white">Combos</h2>
        <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] text-neutral-400 ring-1 ring-white/10">Precio especial</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {combos.map(c => {
          const ahorro = c.originalTotal - c.price
          return (
            <div key={c.id} className="flex flex-col overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-950">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center"><Package className="h-8 w-8 text-neutral-700" /></div>
                )}
                {ahorro > 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                    Ahorrás ${formatMoney(ahorro)}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="font-display text-base font-medium text-white">{c.name}</h3>
                {c.description && <p className="line-clamp-2 text-xs text-neutral-500">{c.description}</p>}
                <ul className="flex flex-col gap-0.5 text-xs text-neutral-400">
                  {c.items.map(i => (
                    <li key={i.variantId}>• {i.quantity}× {i.productName} <span className="text-neutral-600">({i.variantLabel})</span></li>
                  ))}
                </ul>
                <div className="mt-auto flex items-end justify-between pt-3">
                  <div>
                    <span className="text-lg font-semibold text-white">${formatMoney(c.price)}</span>
                    {ahorro > 0 && <span className="ml-2 text-xs text-neutral-600 line-through">${formatMoney(c.originalTotal)}</span>}
                  </div>
                  <button
                    onClick={() => addCombo(c)}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-neutral-200"
                  >
                    {added === c.id ? <><Check className="h-3.5 w-3.5" /> Listo</> : <><Plus className="h-3.5 w-3.5" /> Agregar</>}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
