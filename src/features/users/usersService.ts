import { privateClient } from '@/services/http/axiosInstance'
import type { PagedResult } from '@/types/api.types'

// ─── DTOs (espejo del backend) ────────────────────────────────────────────────

export interface UserListItem {
  id: string
  email: string
  fullName: string
  status: 'Active' | 'Suspended' | 'Blocked' | string
  roles: string[]
  createdAt: string
}

export interface UserDetail extends UserListItem {
  firstName: string
  lastName: string
  phoneNumber?: string
  isEmailConfirmed: boolean
  lastLoginAt?: string
}

export interface GetUsersParams {
  page?: number
  pageSize?: number
  search?: string
}

export interface CreateUserPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const usersService = {
  getUsers: (params: GetUsersParams = {}) =>
    privateClient
      .get<PagedResult<UserListItem>>('/users', params as Record<string, unknown>)
      .then((r) => r.data),

  getUserById: (id: string) =>
    privateClient
      .get<UserDetail>(`/users/${id}`)
      .then((r) => r.data),

  // Crear usuario vía el endpoint de registro (admin lo usa también)
  createUser: (payload: CreateUserPayload) =>
    privateClient
      .post<{ id: string }>('/auth/register', payload)
      .then((r) => r.data),

  changeStatus: (id: string, action: 'activate' | 'suspend' | 'block') =>
    privateClient
      .patch(`/users/${id}/status`, { action })
      .then((r) => r.data),

  assignRole: (userId: string, roleId: string) =>
    privateClient
      .post(`/users/${userId}/roles`, { roleId })
      .then((r) => r.data),

  removeRole: (userId: string, roleId: string) =>
    privateClient
      .delete(`/users/${userId}/roles/${roleId}`)
      .then((r) => r.data),
}
