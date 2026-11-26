import type { MarginType } from '@/types/pricingCalculator.types'

/**
 * Las mismas cuentas que el backend (Domain/Common/PriceRounding y PricingFormula), para que la tarjeta
 * muestre el resultado mientras se escribe, antes de guardar.
 */

/** Redondeo a los $1.000: para abajo si los cientos son menos de $300, para arriba si no. */
export function roundPrice(amount: number): number {
  if (amount <= 0) return 0
  const floor = Math.floor(amount / 1000) * 1000
  const remainder = amount - floor
  if (remainder === 0) return floor
  const rounded = remainder < 300 ? floor : floor + 1000
  return rounded === 0 ? 1000 : rounded
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

/** Costo total en USD: costo + recargo % + comisión fija + flete (a 2 decimales). */
export const totalUsd = (costUsd: number, pct: number, fixed: number, shipping: number) =>
  round2(costUsd * (1 + pct / 100) + fixed + shipping)

/** Costo en pesos de un frasco, redondeado a los $1.000. */
export const costArs = (usd: number, usdtRate: number) => (usdtRate > 0 ? roundPrice(usd * usdtRate) : 0)

export const withMargin = (cost: number, type: MarginType, value: number) =>
  type === 'FixedAmount' ? cost + value : cost * (1 + value / 100)

/** Sugerido de un frasco: a los $1.000. */
export const suggestedBottle = (cost: number, type: MarginType, value: number) => roundPrice(withMargin(cost, type, value))

/** Sugerido de un decant: al peso. */
export const suggestedDecant = (cost: number, type: MarginType, value: number) => Math.round(withMargin(cost, type, value))

/** Convierte un margen al otro tipo manteniendo la misma ganancia sobre el costo dado. */
export function convertMargin(cost: number, from: MarginType, to: MarginType, value: number): number {
  if (from === to || cost <= 0) return value
  return to === 'FixedAmount' ? Math.round((cost * value) / 100) : Math.round((value / cost) * 10000) / 100
}

export const money = (n: number) => `$ ${Math.round(n).toLocaleString('es-AR')}`

export const formatMargin = (type: MarginType, value: number) =>
  type === 'FixedAmount' ? `+${money(value)}` : `+${value.toLocaleString('es-AR')}%`

/** Número desde un input; vacío o inválido = NaN. */
export const parseNum = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')))
