import type { InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

/**
 * Request interceptor — agrega el Bearer token al header Authorization.
 * Lee el accessToken directamente del store de Zustand (en memoria).
 */
export function authRequestInterceptor(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const token = useAuthStore.getState().accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
}
