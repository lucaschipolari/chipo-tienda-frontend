import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'
import { router } from './router'
import { Providers } from './providers'
import { useAuthStore } from '@/store/authStore'
import { httpClient } from '@/services/http/httpClient'
import { tokenStorage } from '@/services/storage/tokenStorage'
import type { LoginResponse } from '@/types/auth.types'

/**
 * App — Punto de entrada de la aplicación.
 *
 * Responsabilidades:
 * 1. Intentar restaurar la sesión al arrancar (si hay refresh token)
 * 2. Proveer QueryClient y otros providers globales
 * 3. Montar el RouterProvider
 */
function AppInitializer({ children }: { children: React.ReactNode }) {
  const { login, logout, initializeAuth, isInitialized } = useAuthStore()

  useEffect(() => {
    initializeAuth()

    const refreshToken = tokenStorage.getRefreshToken()
    if (!refreshToken) {
      // No hay sesión guardada — marcar como inicializado
      useAuthStore.setState({ isInitialized: true })
      return
    }

    // Intentar restaurar la sesión con el refresh token
    httpClient
      .post<LoginResponse>(
        '/auth/refresh-token',
        { refreshToken },
        undefined,
        'public', // usar el cliente público para evitar loop con el interceptor
      )
      .then((response) => {
        login(response)
      })
      .catch(() => {
        // Refresh token inválido o expirado → limpiar y continuar sin sesión
        logout()
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // No renderizar la app hasta que se intente restaurar la sesión
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}

export function App() {
  return (
    <Providers>
      <AppInitializer>
        <RouterProvider router={router} />
      </AppInitializer>
    </Providers>
  )
}
