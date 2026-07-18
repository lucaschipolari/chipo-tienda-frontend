import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
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
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))

// ─── Lazy pages — Admin ───────────────────────────────────────────────────────

const DashboardPage       = lazy(() => import('@/pages/admin/DashboardPage'))
const UsersPage           = lazy(() => import('@/pages/admin/UsersPage'))
const RolesPage           = lazy(() => import('@/pages/admin/RolesPage'))
const ProductsPage        = lazy(() => import('@/pages/admin/ProductsPage'))
const CategoriesPage      = lazy(() => import('@/pages/admin/CategoriesPage'))
const InventoryPage       = lazy(() => import('@/pages/admin/InventoryPage'))
const StockMovementsPage  = lazy(() => import('@/pages/admin/StockMovementsPage'))
const OrdersPage          = lazy(() => import('@/pages/admin/OrdersAdminPage'))
const NewOrderPage        = lazy(() => import('@/pages/admin/NewOrderPage'))
const SalesPage           = lazy(() => import('@/pages/admin/SalesPage'))
const NewSalePage         = lazy(() => import('@/pages/admin/NewSalePage'))
const SalesReportsPage    = lazy(() => import('@/pages/admin/SalesReportsPage'))
const CustomersPage       = lazy(() => import('@/pages/admin/CustomersPage'))
const NewCustomerPage     = lazy(() => import('@/pages/admin/NewCustomerPage'))
const PurchasesPage          = lazy(() => import('@/pages/admin/PurchasesPage'))
const NewPurchaseOrderPage   = lazy(() => import('@/pages/admin/NewPurchaseOrderPage'))
const SuppliersPage       = lazy(() => import('@/pages/admin/SuppliersPage'))
const NewSupplierPage     = lazy(() => import('@/pages/admin/NewSupplierPage'))
const ExpensesPage        = lazy(() => import('@/pages/admin/ExpensesPage'))
const FinancesPage        = lazy(() => import('@/pages/admin/FinanceDashboardPage'))
const AnalyticsPage       = lazy(() => import('@/pages/admin/AnalyticsPage'))
const ReportsPage         = lazy(() => import('@/pages/admin/ReportsPage'))
const DiscountsPage       = lazy(() => import('@/pages/admin/DiscountsPage'))
const PromotionsPage      = lazy(() => import('@/pages/admin/PromotionsPage'))
const CouponsPage         = lazy(() => import('@/pages/admin/CouponsPage'))
const SettingsPage        = lazy(() => import('@/pages/admin/DashboardPage'))

// ─── Lazy pages — Store ───────────────────────────────────────────────────────

const HomePage         = lazy(() => import('@/pages/store/HomePage'))
const CartPage         = lazy(() => import('@/pages/store/CartPage'))
const CheckoutPage     = lazy(() => import('@/pages/store/CheckoutPage'))
const AccountPage      = lazy(() => import('@/pages/store/AccountPage'))
const OrderHistoryPage = lazy(() => import('@/pages/store/OrderHistoryPage'))
const FavoritesPage    = lazy(() => import('@/pages/store/FavoritesPage'))

// Redirige /product/:id (links viejos o ctrl+click) al catálogo con el modal abierto
function ProductRedirect() {
  const { id } = useParams()
  return <Navigate to={`/?p=${id ?? ''}`} replace />
}

// ─── Error pages ─────────────────────────────────────────────────────────────

const NotFoundPage     = lazy(() => import('@/pages/NotFoundPage'))
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'))

// ─── Router ──────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // ── Rutas de Auth ───────────────────────────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: '/login',    element: withSuspense(LoginPage) },
      { path: '/register', element: withSuspense(RegisterPage) },
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
              { path: '/admin/orders',           element: withSuspense(OrdersPage) },
              { path: '/admin/orders/new',       element: withSuspense(NewOrderPage) },
              { path: '/admin/orders/:id',        element: withSuspense(OrdersPage) },
              { path: '/admin/sales',            element: withSuspense(SalesPage) },
              { path: '/admin/sales/new',        element: withSuspense(NewSalePage) },
              { path: '/admin/sales/reports',    element: withSuspense(SalesReportsPage) },
              { path: '/admin/customers',        element: withSuspense(CustomersPage) },
              { path: '/admin/customers/new',    element: withSuspense(NewCustomerPage) },
              { path: '/admin/customers/:id',     element: withSuspense(CustomersPage) },

              // Compras
              { path: '/admin/purchases',        element: withSuspense(PurchasesPage) },
              { path: '/admin/purchases/new',    element: withSuspense(NewPurchaseOrderPage) },
              { path: '/admin/purchases/:id',     element: withSuspense(PurchasesPage) },
              { path: '/admin/suppliers',             element: withSuspense(SuppliersPage) },
              { path: '/admin/suppliers/new',      element: withSuspense(NewSupplierPage) },
              { path: '/admin/suppliers/:id/edit', element: withSuspense(NewSupplierPage) },

              // Finanzas
              { path: '/admin/expenses', element: withSuspense(ExpensesPage) },
              { path: '/admin/finance',  element: withSuspense(FinancesPage) },
              { path: '/admin/analytics', element: withSuspense(AnalyticsPage) },
              { path: '/admin/reports',  element: withSuspense(ReportsPage) },

              // Promociones
              { path: '/admin/discounts',   element: withSuspense(DiscountsPage) },
              { path: '/admin/promotions', element: withSuspense(PromotionsPage) },
              { path: '/admin/coupons',    element: withSuspense(CouponsPage) },

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
      // Catálogo (= home). El detalle de producto es un modal vía ?p=<id>.
      { path: '/',          element: withSuspense(HomePage) },
      { path: '/cart',      element: withSuspense(CartPage) },
      { path: '/checkout',  element: withSuspense(CheckoutPage) },

      // Redirects de rutas viejas para no romper links existentes
      { path: '/catalog',        element: <Navigate to="/" replace /> },
      { path: '/search',         element: <Navigate to="/" replace /> },
      { path: '/category/:slug', element: <Navigate to="/" replace /> },
      { path: '/product/:id',    element: <ProductRedirect /> },

      // Rutas que requieren login
      {
        element: <RequireCustomer />,
        children: [
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
