/**
 * Formatea un valor monetario según la moneda especificada.
 *
 * @example
 *   formatCurrency(1234.5, 'ARS')  → "$ 1.234,50"
 *   formatCurrency(1234.5, 'USD')  → "US$ 1,234.50"
 *   formatCurrency(1234.5, 'PEN')  → "S/ 1,234.50"
 */
export function formatCurrency(
  amount: number,
  currency = 'PEN',
  locale = 'es-PE',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

/**
 * Formatea como ARS (pesos argentinos).
 */
export function formatARS(amount: number): string {
  return formatCurrency(amount, 'ARS', 'es-AR')
}

/**
 * Formatea como PEN (soles peruanos).
 */
export function formatPEN(amount: number): string {
  return formatCurrency(amount, 'PEN', 'es-PE')
}

/**
 * Formatea solo el número sin símbolo de moneda.
 */
export function formatAmount(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}
