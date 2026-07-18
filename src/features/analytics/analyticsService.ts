import { httpClient } from '@/services/http/httpClient'

/**
 * analyticsService — registra interacciones anónimas de la tienda y consulta
 * el dashboard. Los eventos son "fire and forget": nunca rompen la UX si fallan.
 */

const BASE = '/analytics'
const SID_KEY = 'chipo_sid'

/** Id de sesión anónimo (sin datos personales), estable por navegador. */
function sessionId(): string {
  try {
    let id = localStorage.getItem(SID_KEY)
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)
      localStorage.setItem(SID_KEY, id)
    }
    return id
  } catch {
    return 'anon'
  }
}

type EventType = 'view' | 'cart' | 'favorite' | 'search'

interface EventPayload {
  productId?: string
  searchTerm?: string
  resultCount?: number
}

/** Registra un evento sin bloquear ni propagar errores. */
export function track(type: EventType, payload: EventPayload = {}): void {
  try {
    void httpClient.post(`${BASE}/event`, { type, sessionId: sessionId(), ...payload })
      .catch(() => { /* silencioso */ })
  } catch { /* silencioso */ }
}

// ── Dashboard (admin) ──
export interface ProductStat {
  productId: string
  productName: string
  categoryName?: string | null
  count: number
  views: number
  conversionRate?: number | null
}
export interface SearchStat { term: string; count: number; noResultCount: number }
export interface AnalyticsSummary {
  totalViews: number
  totalAddToCart: number
  totalFavorites: number
  totalSearches: number
  uniqueVisitors: number
  uniqueProductsViewed: number
  viewToCartRate: number
  viewsVsPreviousPeriod: number
  totalUnitsSold: number
}
export interface AnalyticsDashboard {
  from: string
  to: string
  summary: AnalyticsSummary
  topViewed: ProductStat[]
  topAddedToCart: ProductStat[]
  topFavorited: ProductStat[]
  topSold: ProductStat[]
  topSearches: SearchStat[]
  noResultSearches: SearchStat[]
}

export const analyticsService = {
  getDashboard: (from?: string, to?: string): Promise<AnalyticsDashboard> =>
    httpClient.get<AnalyticsDashboard>(`${BASE}/dashboard`, { from, to } as Record<string, unknown>),
}
