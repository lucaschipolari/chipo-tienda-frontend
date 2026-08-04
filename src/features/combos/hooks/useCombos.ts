import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { combosService } from '../combosService'
import type { CreateComboRequest } from '@/types/combo.types'

const keys = {
  all: ['combos'] as const,
  active: ['combos', 'active'] as const,
  admin: ['combos', 'admin'] as const,
}

export function useActiveCombos() {
  return useQuery({ queryKey: keys.active, queryFn: () => combosService.getActive() })
}

export function useAdminCombos() {
  return useQuery({ queryKey: keys.admin, queryFn: () => combosService.getAllAdmin() })
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: keys.all })
}

export function useCreateCombo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateComboRequest) => combosService.create(data),
    onSuccess: () => invalidate(qc),
  })
}

export function useUpdateCombo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateComboRequest }) => combosService.update(id, data),
    onSuccess: () => invalidate(qc),
  })
}

export function useToggleCombo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => combosService.toggleStatus(id, isActive),
    onSuccess: () => invalidate(qc),
  })
}

export function useDeleteCombo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => combosService.remove(id),
    onSuccess: () => invalidate(qc),
  })
}
