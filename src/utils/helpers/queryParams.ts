/**
 * Construye un query string a partir de un objeto, omitiendo valores vacíos.
 *
 * @example
 *   buildQueryString({ page: 1, search: '', status: 'active' })
 *   → "page=1&status=active"
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })

  const str = query.toString()
  return str ? `?${str}` : ''
}

/**
 * Parsea los query params actuales de la URL a un objeto tipado.
 *
 * @example
 *   // URL: /products?page=2&status=active
 *   parseQueryParams(searchParams)
 *   → { page: "2", status: "active" }
 */
export function parseQueryParams(
  searchParams: URLSearchParams,
): Record<string, string> {
  return Object.fromEntries(searchParams.entries())
}

/**
 * Obtiene el valor numérico de un query param, con fallback.
 */
export function getNumericParam(
  searchParams: URLSearchParams,
  key: string,
  defaultValue: number,
): number {
  const raw = searchParams.get(key)
  if (!raw) return defaultValue
  const parsed = parseInt(raw, 10)
  return isNaN(parsed) ? defaultValue : parsed
}
