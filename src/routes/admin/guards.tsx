import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'

/**
 * RequireAuth — Redirige a /login si el usuario no está autenticado.
 * Preserva la URL de origen para redirigir de vuelta tras el login.
 */
export function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const location = useLocation()

  // Mientras se intenta restaurar la sesión (refresh token en vuelo)
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-sm text-neutral-500">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    )
  }

  return <Outlet />
}

/**
 * RequireAdminRole — Redirige a /unauthorized si el usuario no tiene
 * rol de administración.
 */
export function RequireAdminRole() {
  const { canAccessAdmin } = usePermissions()

  if (!canAccessAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

/**
 * RequireSuperAdmin — Solo SuperAdmin puede acceder.
 */
export function RequireSuperAdmin() {
  const { isSuperAdmin } = usePermissions()

  if (!isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
