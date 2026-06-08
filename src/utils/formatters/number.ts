/**
 * Formatea números de forma consistente.
 */

/**
 * Formatea un porcentaje: 0.1234 → "12,34%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Formatea un número con separadores: 1234567 → "1.234.567"
 */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Abrevia números grandes: 1500 → "1,5k", 2500000 → "2,5M"
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `${(value / 1_000).toFixed(1)}k`
  return String(value)
}

/**
 * Formatea un stock con unidad: 150 → "150 unidades"
 */
export function formatStock(quantity: number, unit = 'unidades'): string {
  return `${formatNumber(quantity)} ${unit}`
}
