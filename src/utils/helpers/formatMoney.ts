/**
 * Formatea montos al estilo argentino: 300000 -> "300.000", 1899.99 -> "1.899,99".
 * Sin decimales cuando el monto es entero.
 */
export function formatMoney(value: number): string {
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}
