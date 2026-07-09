import { privateClient } from '@/services/http/axiosInstance'

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface PermissionDto {
  id: string
  resource: string
  action: string
  fullName: string
  description?: string
}

export interface RoleListItem {
  id: string
  name: string
  description?: string
  isSystem: boolean
  permissionCount: number
}

export interface CreateRolePayload {
  name: string
  description?: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const rolesService = {
  getRoles: () =>
    privateClient
      .get<RoleListItem[]>('/roles')
      .then((r) => r.data),

  getPermissions: () =>
    privateClient
      .get<PermissionDto[]>('/roles/permissions')
      .then((r) => r.data),

  createRole: (payload: CreateRolePayload) =>
    privateClient
      .post<{ id: string }>('/roles', payload)
      .then((r) => r.data),

  updatePermissions: (roleId: string, permissionIds: string[]) =>
    privateClient
      .put(`/roles/${roleId}/permissions`, { permissionIds })
      .then((r) => r.data),
}
