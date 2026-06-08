import { useAuthStore } from '@/store/authStore'

/**
 * Hook para verificar roles y permisos del usuario autenticado.
 *
 * IMPORTANTE: Esto es solo para la capa de UI (visibilidad de elementos).
 * La autorización real siempre ocurre en el backend.
 *
 * @example
 *   const { hasRole, can, isAdmin } = usePermissions()
 *   if (can('products', 'write')) { ... }
 *   if (hasRole('Admin')) { ... }
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user)
  const roles = user?.roles ?? []

  /**
   * Verifica si el usuario tiene alguno de los roles especificados.
   */
  const hasRole = (role: string | string[]): boolean => {
    if (Array.isArray(role)) {
      return role.some((r) => roles.includes(r))
    }
    return roles.includes(role)
  }

  /**
   * Convenientes flags de rol.
   */
  const isSuperAdmin = hasRole('SuperAdmin')
  const isAdmin = hasRole(['SuperAdmin', 'Admin'])
  const isSupervisor = hasRole(['SuperAdmin', 'Admin', 'Supervisor'])
  const isVendedor = hasRole('Vendedor')
  const isAlmacen = hasRole('Almacén')
  const isFinance = hasRole('Finance')
  const isCustomer = hasRole('Customer')

  /**
   * Verifica si el usuario tiene el permiso "Resource:Action".
   * Los permisos no están embebidos en el JWT actual — se verifican
   * por rol. Extender cuando el backend envíe claims de permiso.
   */
  const can = (_resource: string, _action: string): boolean => {
    // Por ahora la autorización granular se delega al backend.
    // Los admins tienen acceso a todo en el frontend.
    return isAdmin
  }

  /**
   * Verifica si puede acceder a una sección específica del admin.
   */
  const canAccessAdmin = isAdmin || isSupervisor || isVendedor || isAlmacen || isFinance

  return {
    roles,
    hasRole,
    can,
    canAccessAdmin,
    isSuperAdmin,
    isAdmin,
    isSupervisor,
    isVendedor,
    isAlmacen,
    isFinance,
    isCustomer,
  }
}
