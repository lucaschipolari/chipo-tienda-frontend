import { httpClient } from '@/services/http/httpClient'
import type { PagedResult } from '@/types/api.types'
import type {
  Expense,
  ExpenseCategory,
  ExpenseListItem,
  ExpenseDashboard,
  CreateExpenseCategoryRequest,
  UpdateExpenseCategoryRequest,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  GetExpensesParams,
  ExpenseStatus,
} from '@/types/expense.types'

const CATEGORIES_BASE = '/expense-categories'
const EXPENSES_BASE = '/expenses'

export const expensesService = {
  // Categories
  getCategories: (isActive?: boolean): Promise<ExpenseCategory[]> => {
    const params: Record<string, unknown> = {}
    if (isActive !== undefined) params.isActive = isActive
    return httpClient.get<ExpenseCategory[]>(CATEGORIES_BASE, params)
  },

  createCategory: (data: CreateExpenseCategoryRequest): Promise<{ id: string }> =>
    httpClient.post<{ id: string }>(CATEGORIES_BASE, data),

  updateCategory: (id: string, data: UpdateExpenseCategoryRequest): Promise<void> =>
    httpClient.put<void>(`${CATEGORIES_BASE}/${id}`, data),

  toggleCategoryStatus: (id: string, isActive: boolean): Promise<void> =>
    httpClient.patch<void>(`${CATEGORIES_BASE}/${id}/status`, { isActive }),

  // Expenses
  getAll: (params: GetExpensesParams = {}): Promise<PagedResult<ExpenseListItem>> =>
    httpClient.get<PagedResult<ExpenseListItem>>(EXPENSES_BASE, params as Record<string, unknown>),

  getById: (id: string): Promise<Expense> =>
    httpClient.get<Expense>(`${EXPENSES_BASE}/${id}`),

  getDashboard: (from?: string, to?: string): Promise<ExpenseDashboard> => {
    const params: Record<string, unknown> = {}
    if (from) params.from = from
    if (to) params.to = to
    return httpClient.get<ExpenseDashboard>(`${EXPENSES_BASE}/dashboard`, params)
  },

  create: (data: CreateExpenseRequest): Promise<{ id: string }> =>
    httpClient.post<{ id: string }>(EXPENSES_BASE, data),

  update: (id: string, data: UpdateExpenseRequest): Promise<void> =>
    httpClient.put<void>(`${EXPENSES_BASE}/${id}`, data),

  changeStatus: (id: string, newStatus: ExpenseStatus): Promise<void> =>
    httpClient.patch<void>(`${EXPENSES_BASE}/${id}/status`, { newStatus }),
}
