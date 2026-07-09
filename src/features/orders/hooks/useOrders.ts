import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ordersService } from '../ordersService'
import type { CreateOrderRequest, GetOrdersParams } from '@/types/order.types'

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params: GetOrdersParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  byNumber: (n: string) => [...orderKeys.all, 'number', n] as const,
}

export function useOrders(params: GetOrdersParams = {}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersService.getAll(params),
  })
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id!),
    queryFn: () => ordersService.getById(id!),
    enabled: !!id,
  })
}

export function useOrderByNumber(number: string | undefined) {
  return useQuery({
    queryKey: orderKeys.byNumber(number!),
    queryFn: () => ordersService.getByNumber(number!),
    enabled: !!number,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => ordersService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orderKeys.lists() })
      toast.success('Pedido creado correctamente')
    },
  })
}

export function useChangeOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, newStatus, note }: { id: string; newStatus: string; note?: string }) =>
      ordersService.changeStatus(id, newStatus, note),
    onSuccess: (_r, { id }) => {
      qc.invalidateQueries({ queryKey: orderKeys.lists() })
      qc.invalidateQueries({ queryKey: orderKeys.detail(id) })
      toast.success('Estado actualizado correctamente')
    },
  })
}
