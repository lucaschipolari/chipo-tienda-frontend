import { publicClient } from '@/services/http/axiosInstance'
import { privateClient } from '@/services/http/axiosInstance'
import type { LoginResponse, RefreshTokenResponse } from '@/types/auth.types'

export interface RegisterPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
}

export interface RegisterResponse {
  userId: string
  email: string
  fullName: string
}

export const authService = {
  /**
   * POST /auth/register
   */
  register: (payload: RegisterPayload) =>
    publicClient
      .post<RegisterResponse>('/auth/register', payload)
      .then((r) => r.data),

  /**
   * POST /auth/login
   */
  login: (email: string, password: string) =>
    publicClient
      .post<LoginResponse>('/auth/login', { email, password })
      .then((r) => r.data),

  /**
   * POST /auth/refresh-token
   */
  refreshToken: (refreshToken: string) =>
    publicClient
      .post<RefreshTokenResponse>('/auth/refresh-token', { refreshToken })
      .then((r) => r.data),

  /**
   * POST /auth/logout
   */
  logout: (refreshToken: string) =>
    privateClient
      .post('/auth/logout', { refreshToken })
      .catch(() => {}), // silenciar errores — la sesión local se limpia igualmente
}
