import { httpClient } from '@/services/http/httpClient'

export interface VialCost {
  ml: number
  cost: number
}

export interface VialProduct {
  ml: number
  productId: string
}

const BASE = '/settings'

export const settingsService = {
  getVialCosts: () => httpClient.get<VialCost[]>(`${BASE}/vial-costs`),
  setVialCosts: (items: VialCost[]) => httpClient.put<void>(`${BASE}/vial-costs`, { items }),
  getVialProducts: () => httpClient.get<VialProduct[]>(`${BASE}/vial-products`),
  setVialProducts: (items: VialProduct[]) => httpClient.put<void>(`${BASE}/vial-products`, { items }),
}
