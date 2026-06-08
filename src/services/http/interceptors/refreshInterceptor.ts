import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from '@/services/storage/tokenStorage'
import { useAuthStore } from '@/store/authStore'
import type { RefreshTokenResponse } from '@/types/auth.types'

// ─── Estado del refresh ─────────────────────────────────────────────────────

let isRefreshing = false

// Cola de requests que fallaron con 401 mientras se estaba refrescando
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else if (token) {
      resolve(token)
    }
  })
  failedQueue = []
}

// ─── Interceptor de respuesta ───────────────────────────────────────────────

export function setupRefreshInterceptor(axiosInstance: AxiosInstance): void {
  axiosInstance.interceptors.response.use(
    // Respuesta exitosa → pass-through
    (response) => response,

    // Error → intentar refresh si es 401
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean
      }

      // Solo actuar ante 401 y requests que no se han reintentado ya
      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error)
      }

      // Evitar loop infinito si el endpoint de refresh también falla
      if (originalRequest.url?.includes('/auth/refresh-token')) {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      originalRequest._retry = true

      // Si ya hay un refresh en curso → encolar esta request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      // Iniciar refresh
      isRefreshing = true
      const refreshToken = tokenStorage.getRefreshToken()

      if (!refreshToken) {
        isRefreshing = false
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      try {
        // Llamada directa con axios base para evitar interceptors
        const { data } = await axiosInstance.post<RefreshTokenResponse>(
          '/auth/refresh-token',
          { refreshToken },
        )

        const { accessToken, refreshToken: newRefreshToken } = data

        // Actualizar stores y storage
        useAuthStore.getState().setAccessToken(accessToken)
        tokenStorage.setRefreshToken(newRefreshToken)

        // Reintentar las requests encoladas con el nuevo token
        processQueue(null, accessToken)

        // Reintentar la request original
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        tokenStorage.clearRefreshToken()
        // Redirigir a login — el router lo manejará via authStore
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    },
  )
}
