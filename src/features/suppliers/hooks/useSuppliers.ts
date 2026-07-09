import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { suppliersService } from '../suppliersService'
import type { CreateSupplierRequest, UpdateSupplierRequest, GetSuppliersParams } from '@/types/supplier.types'

export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (params: GetSuppliersParams) => [...supplierKeys.lists(), params] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: string) => [...supplierKeys.details(), id] as const,
}

export function useSuppliers(params: GetSuppliersParams = {}) {
  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: () => suppliersService.getAll(params),
  })
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: supplierKeys.detail(id!),
    queryFn: () => suppliersService.getById(id!),
    enabled: !!id,
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSupplierRequest) => suppliersService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.lists() })
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.title  ||
        err?.message                ||
        'Error al crear el proveedor.'
      toast.error(msg)
    },
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierRequest }) =>
      suppliersService.update(id, data),
    onSuccess: (_r, { id }) => {
      qc.invalidateQueries({ queryKey: supplierKeys.lists() })
      qc.invalidateQueries({ queryKey: supplierKeys.detail(id) })
      toast.success('Proveedor actualizado correctamente.')
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.title  ||
        err?.message                ||
        'Error al actualizar el proveedor.'
      toast.error(msg)
    },
  })
}

export function useChangeSupplierStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      suppliersService.changeStatus(id, isActive),
    onSuccess: (_r, { isActive }) => {
      qc.invalidateQueries({ queryKey: supplierKeys.all })
      toast.success(`Proveedor ${isActive ? 'activado' : 'desactivado'} correctamente.`)
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail ||
        err?.message                ||
        'Error al cambiar el estado del proveedor.'
      toast.error(msg)
    },
  })
}
