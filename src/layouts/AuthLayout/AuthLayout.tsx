import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'

/**
 * AuthLayout — Wrapper para rutas de autenticación (login, register, etc.)
 *
 * Si el usuario ya está autenticado lo redirige automáticamente:
 * - Roles admin → /admin/dashboard
 * - Resto → /
 *
 * El layout visual (fondo, logo, centrado) lo gestiona cada página
 * individualmente para tener flexibilidad de diseño.
 */
export function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isInitialized   = useAuthStore((s) => s.isInitialized)
  const { canAccessAdmin } = usePermissions()

  // Esperar a que se intente restaurar la sesión antes de redirigir
  if (!isInitialized) return null

  if (isAuthenticated) {
    return <Navigate to={canAccessAdmin ? '/admin/dashboard' : '/'} replace />
  }

  return <Outlet />
}
