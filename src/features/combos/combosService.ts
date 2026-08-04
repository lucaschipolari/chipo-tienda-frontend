import { httpClient } from '@/services/http/httpClient'
import type { Combo, CreateComboRequest } from '@/types/combo.types'

const BASE = '/combos'

export const combosService = {
  getActive: () => httpClient.get<Combo[]>(BASE, { onlyActive: true }),
  getAllAdmin: () => httpClient.get<Combo[]>(`${BASE}/all`),
  getById: (id: string) => httpClient.get<Combo>(`${BASE}/${id}`),
  create: (data: CreateComboRequest) => httpClient.post<{ id: string }>(BASE, data),
  update: (id: string, data: CreateComboRequest) => httpClient.put<void>(`${BASE}/${id}`, { ...data, id }),
  toggleStatus: (id: string, isActive: boolean) => httpClient.patch<void>(`${BASE}/${id}/status`, { isActive }),
  remove: (id: string) => httpClient.delete<void>(`${BASE}/${id}`),
}
