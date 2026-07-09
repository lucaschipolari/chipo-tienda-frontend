import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersService } from '../customersService'
import type { CreateCustomerRequest, UpdateCustomerRequest, GetCustomersParams } from '@/types/customer.types'

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params: GetCustomersParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
}

export function useCustomers(params: GetCustomersParams = {}) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customersService.getAll(params),
  })
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id!),
    queryFn: () => customersService.getById(id!),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => customersService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.lists() }),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerRequest }) =>
      customersService.update(id, data),
    onSuccess: (_r, { id }) => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() })
      qc.invalidateQueries({ queryKey: customerKeys.detail(id) })
    },
  })
}

export function useChangeCustomerStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      customersService.changeStatus(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  })
}
