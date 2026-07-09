import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { expensesService } from '../expensesService'
import type {
  CreateExpenseCategoryRequest,
  UpdateExpenseCategoryRequest,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  GetExpensesParams,
  ExpenseStatus,
} from '@/types/expense.types'

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (params: GetExpensesParams) => [...expenseKeys.lists(), params] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
  dashboard: (from?: string, to?: string) => [...expenseKeys.all, 'dashboard', from, to] as const,
  categories: (isActive?: boolean) => [...expenseKeys.all, 'categories', isActive] as const,
}

// ── Categories ──────────────────────────────────────────────────────────────

export function useExpenseCategories(isActive?: boolean) {
  return useQuery({
    queryKey: expenseKeys.categories(isActive),
    queryFn: () => expensesService.getCategories(isActive),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateExpenseCategoryRequest) => expensesService.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.categories() })
      toast.success('Categoria creada correctamente')
    },
    onError: () => {
      toast.error('Error al crear la categoria')
    },
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseCategoryRequest }) =>
      expensesService.updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.categories() })
      toast.success('Categoria actualizada correctamente')
    },
    onError: () => {
      toast.error('Error al actualizar la categoria')
    },
  })
}

export function useToggleCategoryStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      expensesService.toggleCategoryStatus(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.categories() })
      toast.success('Estado de categoria actualizado')
    },
    onError: () => {
      toast.error('Error al actualizar el estado de la categoria')
    },
  })
}

// ── Expenses ─────────────────────────────────────────────────────────────────

export function useExpenses(params: GetExpensesParams = {}) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => expensesService.getAll(params),
  })
}

export function useExpense(id?: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id!),
    queryFn: () => expensesService.getById(id!),
    enabled: !!id,
  })
}

export function useExpenseDashboard(from?: string, to?: string) {
  return useQuery({
    queryKey: expenseKeys.dashboard(from, to),
    queryFn: () => expensesService.getDashboard(from, to),
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateExpenseRequest) => expensesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.lists() })
      qc.invalidateQueries({ queryKey: expenseKeys.dashboard() })
      toast.success('Gasto registrado correctamente')
    },
    onError: () => {
      toast.error('Error al registrar el gasto')
    },
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseRequest }) =>
      expensesService.update(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: expenseKeys.lists() })
      qc.invalidateQueries({ queryKey: expenseKeys.detail(id) })
      qc.invalidateQueries({ queryKey: expenseKeys.dashboard() })
      toast.success('Gasto actualizado correctamente')
    },
    onError: () => {
      toast.error('Error al actualizar el gasto')
    },
  })
}

export function useChangeExpenseStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: ExpenseStatus }) =>
      expensesService.changeStatus(id, newStatus),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: expenseKeys.lists() })
      qc.invalidateQueries({ queryKey: expenseKeys.detail(id) })
      qc.invalidateQueries({ queryKey: expenseKeys.dashboard() })
      toast.success('Estado del gasto actualizado')
    },
    onError: () => {
      toast.error('Error al cambiar el estado del gasto')
    },
  })
}
