import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AdminLayout } from '@/layouts/AdminLayout'
import { StoreLayout } from '@/layouts/StoreLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { RequireAuth, RequireAdminRole } from '@/routes/admin/guards'
import { RequireCustomer } from '@/routes/store/guards'

// ─── Page Loader ──────────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="h-6 w-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
    </div>
  )
}

function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

// ─── Lazy pages — Auth ────────────────────────────────────────────────────────

const LoginPage    = lazy(() => import('@/pages/auth/LoginPage'))

// ─── Lazy pages — Admin ───────────────────────────────────────────────────────

const DashboardPage       = lazy(() => import('@/pages/admin/DashboardPage'))

// Estos módulos se crearán en etapas posteriores — placeholders por ahora
const ProductsPage        = lazy(() => import('@/pages/admin/DashboardPage'))
const CategoriesPage      = lazy(() => import('@/pages/admin/DashboardPage'))
const InventoryPage       = lazy(() => import('@/pages/admin/DashboardPage'))
const StockMovementsPage  = lazy(() => import('@/pages/admin/DashboardPage'))
const OrdersPage          = lazy(() => import('@/pages/admin/DashboardPage'))
const SalesPage           = lazy(() => import('@/pages/admin/DashboardPage'))
const CustomersPage       = lazy(() => import('@/pages/admin/DashboardPage'))
const PurchasesPage       = lazy(() => import('@/pages/admin/DashboardPage'))
const SuppliersPage       = lazy(() => import('@/pages/admin/DashboardPage'))
const ExpensesPage        = lazy(() => import('@/pages/admin/DashboardPage'))
const FinancesPage        = lazy(() => import('@/pages/admin/DashboardPage'))
const ReportsPage         = lazy(() => import('@/pages/admin/DashboardPage'))
const DiscountsPage       = lazy(() => import('@/pages/admin/DashboardPage'))
const CouponsPage         = lazy(() => import('@/pages/admin/DashboardPage'))
const UsersPage           = lazy(() => import('@/pages/admin/DashboardPage'))
const RolesPage           = lazy(() => import('@/pages/admin/DashboardPage'))
const SettingsPage        = lazy(() => import('@/pages/admin/DashboardPage'))

// ─── Lazy pages — Store ───────────────────────────────────────────────────────

const HomePage         = lazy(() => import('@/pages/store/HomePage'))
const CatalogPage      = lazy(() => import('@/pages/store/HomePage'))
const ProductPage      = lazy(() => import('@/pages/store/HomePage'))
const CartPage         = lazy(() => import('@/pages/store/HomePage'))
const CheckoutPage     = lazy(() => import('@/pages/store/HomePage'))
const SearchPage       = lazy(() => import('@/pages/store/HomePage'))
const AccountPage      = lazy(() => import('@/pages/store/HomePage'))
const OrderHistoryPage = lazy(() => import('@/pages/store/HomePage'))
const FavoritesPage    = lazy(() => import('@/pages/store/HomePage'))

// ─── Error pages ─────────────────────────────────────────────────────────────

const NotFoundPage     = lazy(() => import('@/pages/NotFoundPage'))
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'))

// ─── Router ──────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // ── Rutas de Auth ───────────────────────────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: '/login',           element: withSuspense(LoginPage) },
    ],
  },

  // ── Panel Administrativo ────────────────────────────────────────────────────
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireAdminRole />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              // Redirect /admin → /admin/dashboard
              { path: '/admin',              element: <Navigate to="/admin/dashboard" replace /> },
              { path: '/admin/dashboard',    element: withSuspense(DashboardPage) },

              // Catálogo
              { path: '/admin/products',            element: withSuspense(ProductsPage) },
              { path: '/admin/products/:id',         element: withSuspense(ProductsPage) },
              { path: '/admin/categories',           element: withSuspense(CategoriesPage) },
              { path: '/admin/inventory',            element: withSuspense(InventoryPage) },
              { path: '/admin/inventory/movements',  element: withSuspense(StockMovementsPage) },

              // Ventas
              { path: '/admin/orders',      element: withSuspense(OrdersPage) },
              { path: '/admin/orders/:id',   element: withSuspense(OrdersPage) },
              { path: '/admin/sales',       element: withSuspense(SalesPage) },
              { path: '/admin/sales/:id',    element: withSuspense(SalesPage) },
              { path: '/admin/customers',   element: withSuspense(CustomersPage) },
              { path: '/admin/customers/:id', element: withSuspense(CustomersPage) },

              // Compras
              { path: '/admin/purchases',        element: withSuspense(PurchasesPage) },
              { path: '/admin/purchases/:id',     element: withSuspense(PurchasesPage) },
              { path: '/admin/suppliers',        element: withSuspense(SuppliersPage) },
              { path: '/admin/suppliers/:id',     element: withSuspense(SuppliersPage) },

              // Finanzas
              { path: '/admin/expenses',  element: withSuspense(ExpensesPage) },
              { path: '/admin/finances',  element: withSuspense(FinancesPage) },
              { path: '/admin/reports',   element: withSuspense(ReportsPage) },

              // Promociones
              { path: '/admin/discounts', element: withSuspense(DiscountsPage) },
              { path: '/admin/coupons',   element: withSuspense(CouponsPage) },

              // Configuración
              { path: '/admin/users',     element: withSuspense(UsersPage) },
              { path: '/admin/users/:id', element: withSuspense(UsersPage) },
              { path: '/admin/roles',     element: withSuspense(RolesPage) },
              { path: '/admin/settings',  element: withSuspense(SettingsPage) },
            ],
          },
        ],
      },
    ],
  },

  // ── Tienda Online ───────────────────────────────────────────────────────────
  {
    element: <StoreLayout />,
    children: [
      // Rutas públicas
      { path: '/',          element: withSuspense(HomePage) },
      { path: '/catalog',   element: withSuspense(CatalogPage) },
      { path: '/product/:id', element: withSuspense(ProductPage) },
      { path: '/category/:slug', element: withSuspense(CatalogPage) },
      { path: '/search',    element: withSuspense(SearchPage) },
      { path: '/cart',      element: withSuspense(CartPage) },

      // Rutas que requieren login
      {
        element: <RequireCustomer />,
        children: [
          { path: '/checkout',              element: withSuspense(CheckoutPage) },
          { path: '/account',               element: withSuspense(AccountPage) },
          { path: '/account/orders',        element: withSuspense(OrderHistoryPage) },
          { path: '/account/orders/:id',    element: withSuspense(OrderHistoryPage) },
          { path: '/account/favorites',     element: withSuspense(FavoritesPage) },
        ],
      },
    ],
  },

  // ── Páginas de error ────────────────────────────────────────────────────────
  { path: '/unauthorized', element: withSuspense(UnauthorizedPage) },
  { path: '*',             element: withSuspense(NotFoundPage) },
])
