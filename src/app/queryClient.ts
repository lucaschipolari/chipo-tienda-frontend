import { QueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/helpers/errorParser'
import { toast } from 'sonner'

/**
 * Instancia global de QueryClient.
 * Configuración centralizada para toda la app.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo antes de que los datos se consideren "stale" y se refresque
      staleTime: 5 * 60 * 1000, // 5 minutos por defecto

      // Tiempo que los datos inactivos se mantienen en caché
      gcTime: 10 * 60 * 1000, // 10 minutos

      // Reintentos automáticos — solo en errores de servidor
      retry: (failureCount, error) => {
        if (failureCount >= 1) return false
        const apiError = error as { status?: number }
        if (apiError?.status && apiError.status < 500) return false
        return true
      },

      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 30_000),

      // Refetch al volver a la ventana (útil para tablas de admin)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },

    mutations: {
      // Error handling global para mutaciones
      onError: (error) => {
        const message = parseErrorMessage(error)
        toast.error(message)
      },
    },
  },
})

// ─── Query keys centralizados ────────────────────────────────────────────────

/**
 * Fábrica de query keys.
 * Centralizar los keys evita typos y facilita la invalidación.
 *
 * @example
 *   queryKeys.products.list({ page: 1 })
 *   queryKeys.products.detail('abc-123')
 */
export const queryKeys = {
  // Auth
  auth: {
    me: () => ['auth', 'me'] as const,
  },

  // Users
  users: {
    all: () => ['users'] as const,
    list: (filters?: object) => ['users', 'list', filters] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },

  // Roles
  roles: {
    all: () => ['roles'] as const,
    list: () => ['roles', 'list'] as const,
    permissions: () => ['roles', 'permissions'] as const,
  },

  // Products
  products: {
    all: () => ['products'] as const,
    list: (filters?: object) => ['products', 'list', filters] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    public: {
      list: (filters?: object) => ['products', 'public', 'list', filters] as const,
      detail: (id: string) => ['products', 'public', 'detail', id] as const,
    },
  },

  // Categories
  categories: {
    all: () => ['categories'] as const,
    list: () => ['categories', 'list'] as const,
    tree: () => ['categories', 'tree'] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
  },

  // Inventory
  inventory: {
    all: () => ['inventory'] as const,
    list: (filters?: object) => ['inventory', 'list', filters] as const,
    movements: (filters?: object) => ['inventory', 'movements', filters] as const,
  },

  // Orders
  orders: {
    all: () => ['orders'] as const,
    list: (filters?: object) => ['orders', 'list', filters] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    myOrders: (filters?: object) => ['orders', 'mine', filters] as const,
  },

  // Sales
  sales: {
    all: () => ['sales'] as const,
    list: (filters?: object) => ['sales', 'list', filters] as const,
    detail: (id: string) => ['sales', 'detail', id] as const,
  },

  // Purchases
  purchases: {
    all: () => ['purchases'] as const,
    list: (filters?: object) => ['purchases', 'list', filters] as const,
    detail: (id: string) => ['purchases', 'detail', id] as const,
  },

  // Customers
  customers: {
    all: () => ['customers'] as const,
    list: (filters?: object) => ['customers', 'list', filters] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },

  // Suppliers
  suppliers: {
    all: () => ['suppliers'] as const,
    list: (filters?: object) => ['suppliers', 'list', filters] as const,
    detail: (id: string) => ['suppliers', 'detail', id] as const,
  },

  // Dashboard
  dashboard: {
    metrics: (period?: string) => ['dashboard', 'metrics', period] as const,
    salesChart: (period?: string) => ['dashboard', 'salesChart', period] as const,
    topProducts: (period?: string) => ['dashboard', 'topProducts', period] as const,
  },

  // Catalog (store public)
  catalog: {
    search: (term?: string) => ['catalog', 'search', term] as const,
    suggestions: (term?: string) => ['catalog', 'suggestions', term] as const,
  },

  // Reports
  reports: {
    sales: (filters?: object) => ['reports', 'sales', filters] as const,
    inventory: (filters?: object) => ['reports', 'inventory', filters] as const,
    customers: (filters?: object) => ['reports', 'customers', filters] as const,
  },

  // Coupons
  coupons: {
    all: () => ['coupons'] as const,
    list: (filters?: object) => ['coupons', 'list', filters] as const,
    validate: (code: string) => ['coupons', 'validate', code] as const,
  },

  // Discounts
  discounts: {
    all: () => ['discounts'] as const,
    list: (filters?: object) => ['discounts', 'list', filters] as const,
  },

  // Expenses
  expenses: {
    all: () => ['expenses'] as const,
    list: (filters?: object) => ['expenses', 'list', filters] as const,
  },

  // Audit
  audit: {
    list: (filters?: object) => ['audit', 'list', filters] as const,
  },
}
