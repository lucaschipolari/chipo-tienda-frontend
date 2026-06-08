import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { UserProfile, LoginResponse } from '@/types/auth.types'
import { tokenStorage } from '@/services/storage/tokenStorage'

interface AuthActions {
  login: (response: LoginResponse) => void
  logout: () => void
  setAccessToken: (token: string) => void
  setUser: (user: UserProfile) => void
  initializeAuth: () => void
}

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  isAuthenticated: boolean
  isInitialized: boolean
}

type AuthStore = AuthState & AuthActions

/**
 * Auth Store
 *
 * - accessToken: en memoria (no persiste) — protegido de XSS
 * - refreshToken: en localStorage via tokenStorage — persiste entre sesiones
 * - isInitialized: true una vez que se intentó restaurar la sesión al arrancar
 */
export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      // ─── State ──────────────────────────────────────────────────────
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isInitialized: false,

      // ─── Actions ─────────────────────────────────────────────────────

      /**
       * Llamado tras login exitoso.
       * Guarda access token en memoria y refresh token en localStorage.
       */
      login: (response: LoginResponse) => {
        tokenStorage.setRefreshToken(response.refreshToken)
        set(
          {
            user: response.user,
            accessToken: response.accessToken,
            isAuthenticated: true,
            isInitialized: true,
          },
          false,
          'auth/login',
        )
      },

      /**
       * Limpia todo el estado de autenticación.
       * El queryClient.clear() se llama desde el hook useLogout para
       * evitar dependencias circulares con TanStack Query aquí.
       */
      logout: () => {
        tokenStorage.clearRefreshToken()
        set(
          {
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isInitialized: true,
          },
          false,
          'auth/logout',
        )
      },

      /**
       * Actualiza solo el access token (tras refresh exitoso).
       */
      setAccessToken: (token: string) => {
        set({ accessToken: token }, false, 'auth/setAccessToken')
      },

      /**
       * Actualiza los datos del usuario (tras editar perfil, etc.).
       */
      setUser: (user: UserProfile) => {
        set({ user }, false, 'auth/setUser')
      },

      /**
       * Llamado al arrancar la app.
       * Si existe un refresh token en localStorage, la app sabe que
       * puede intentar renovar la sesión. El access token se obtiene
       * via el refreshInterceptor en la primera request protegida,
       * o en App.tsx con una llamada explícita a /auth/refresh-token.
       */
      initializeAuth: () => {
        const hasRefreshToken = !!tokenStorage.getRefreshToken()
        set(
          {
            isInitialized: !hasRefreshToken, // si hay RT, esperar el refresh
          },
          false,
          'auth/initialize',
        )
      },
    }),
    { name: 'AuthStore' },
  ),
)

// ─── Selector helpers ─────────────────────────────────────────────────────────

export const selectUser = (state: AuthStore) => state.user
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated
export const selectIsInitialized = (state: AuthStore) => state.isInitialized
export const selectUserRoles = (state: AuthStore) => state.user?.roles ?? []
