export type ExpenseStatus = 'Pending' | 'Paid' | 'Cancelled'

export interface ExpenseCategory {
  id: string
  name: string
  description?: string
  color: string
  isActive: boolean
  expenseCount: number
}

export interface Expense {
  id: string
  categoryId: string
  categoryName: string
  categoryColor: string
  date: string
  amount: number
  currency: string
  description: string
  observations?: string
  receiptUrl?: string
  status: ExpenseStatus
  createdByUserId?: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseListItem {
  id: string
  categoryId: string
  categoryName: string
  categoryColor: string
  date: string
  amount: number
  currency: string
  description: string
  status: ExpenseStatus
  createdAt: string
}

export interface ExpenseByCategoryItem {
  categoryId: string
  categoryName: string
  color: string
  total: number
  count: number
  percentage: number
}

export interface ExpenseTrendItem {
  month: string
  total: number
}

export interface ExpenseDashboard {
  todayTotal: number
  weekTotal: number
  monthTotal: number
  yearTotal: number
  byCategory: ExpenseByCategoryItem[]
  monthlyTrend: ExpenseTrendItem[]
}

export interface CreateExpenseCategoryRequest {
  name: string
  description?: string
  color?: string
}

export interface UpdateExpenseCategoryRequest {
  name: string
  description?: string
  color?: string
}

export interface CreateExpenseRequest {
  categoryId: string
  date: string
  amount: number
  currency: string
  description: string
  observations?: string
}

export interface UpdateExpenseRequest {
  id: string
  categoryId: string
  date: string
  amount: number
  currency: string
  description: string
  observations?: string
}

export interface GetExpensesParams {
  page?: number
  pageSize?: number
  categoryId?: string
  status?: ExpenseStatus
  from?: string
  to?: string
  search?: string
}
