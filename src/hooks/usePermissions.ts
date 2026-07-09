import { useAuthStore } from '@/store/authStore'

/**
 * Hook para verificar roles y permisos del usuario autenticado.
 *
 * IMPORTANTE: Esto es solo para la capa de UI (visibilidad de elementos).
 * La autorización real siempre ocurre en el backend.
 *
 * Roles del sistema (tal como están en la BD):
 *   SuperAdmin | Admin | Supervisor | Vendedor | Almacen | Finance | Customer
 *
 * @example
 *   const { hasRole, canManageProducts, isAdmin } = usePermissions()
 *   if (canManageProducts) { ... }
 *   if (hasRole('Supervisor')) { ... }
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user)
  const roles = user?.roles ?? []

  /** Verifica si el usuario tiene alguno de los roles especificados. */
  const hasRole = (role: string | string[]): boolean => {
    if (Array.isArray(role)) {
      return role.some((r) => roles.includes(r))
    }
    return roles.includes(role)
  }

  // ─── Flags de rol ──────────────────────────────────────────────────────────
  const isSuperAdmin  = hasRole('SuperAdmin')
  const isAdmin       = hasRole(['SuperAdmin', 'Admin'])
  const isSupervisor  = hasRole(['SuperAdmin', 'Admin', 'Supervisor'])
  const isVendedor    = hasRole('Vendedor')
  const isAlmacen     = hasRole('Almacen')   // ← sin tilde, tal como está en la BD
  const isFinance     = hasRole('Finance')
  const isCustomer    = hasRole('Customer')

  // ─── Permisos por recurso (reflejan los [Authorize] del backend) ───────────

  /** Puede ver el panel de administración */
  const canAccessAdmin    = isSuperAdmin || isAdmin || isSupervisor || isVendedor || isAlmacen || isFinance

  /** Puede crear/editar/eliminar productos y categorías */
  const canManageProducts = isSuperAdmin || isAdmin || isSupervisor

  /** Puede gestionar inventario y ajustar stock */
  const canManageInventory = isSuperAdmin || isAdmin || isSupervisor || isAlmacen

  /** Puede gestionar usuarios y roles */
  const canManageUsers    = isSuperAdmin || isAdmin

  /** Puede acceder a reportes financieros */
  const canViewFinances   = isSuperAdmin || isAdmin || isFinance

  /**
   * Verifica si el usuario tiene el permiso "Resource:Action".
   * Cuando el backend emita claims de permiso en el JWT, reemplazar
   * esta lógica por lectura directa de los claims.
   */
  const can = (resource: string, _action: string): boolean => {
    switch (resource) {
      case 'products':   return canManageProducts
      case 'categories': return canManageProducts
      case 'inventory':  return canManageInventory
      case 'users':      return canManageUsers
      case 'roles':      return canManageUsers
      case 'finances':   return canViewFinances
      default:           return isAdmin
    }
  }

  return {
    roles,
    hasRole,
    can,
    // Flags simples
    isSuperAdmin,
    isAdmin,
    isSupervisor,
    isVendedor,
    isAlmacen,
    isFinance,
    isCustomer,
    // Permisos compuestos
    canAccessAdmin,
    canManageProducts,
    canManageInventory,
    canManageUsers,
    canViewFinances,
  }
}
