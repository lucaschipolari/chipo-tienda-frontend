import { httpClient } from '@/services/http/httpClient'

export interface VialCost {
  ml: number
  cost: number
}

const BASE = '/settings'

export const settingsService = {
  getVialCosts: () => httpClient.get<VialCost[]>(`${BASE}/vial-costs`),
  setVialCosts: (items: VialCost[]) => httpClient.put<void>(`${BASE}/vial-costs`, { items }),
}
