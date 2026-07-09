import { useQuery } from '@tanstack/react-query'
import { privateClient } from '@/services/http/axiosInstance'
import { useAuthStore } from '@/store/authStore'
import type { UserProfile } from '@/types/auth.types'

// ─── DTO que devuelve GET /auth/me ────────────────────────────────────────────

interface CurrentUserResponse {
  id: string
  email: string
  fullName: string
  firstName: string
  lastName: string
  phoneNumber?: string
  status: string
  roles: string[]
  lastLoginAt?: string
}

// ─── Query key ────────────────────────────────────────────────────────────────

export const currentUserQueryKey = ['auth', 'me'] as const

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchCurrentUser(): Promise<CurrentUserResponse> {
  const { data } = await privateClient.get<CurrentUserResponse>('/auth/me')
  return data
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Obtiene el perfil completo del usuario autenticado desde el backend.
 *
 * - Solo ejecuta la query si el usuario está autenticado.
 * - Actualiza el store de auth con los datos más frescos del servidor.
 * - Usa staleTime de 5 min — los datos no cambian con frecuencia.
 */
export function useCurrentUser() {
  const { isAuthenticated, setUser } = useAuthStore()

  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: async () => {
      const user = await fetchCurrentUser()

      // Mantener el store sincronizado con los datos del servidor
      const profile: UserProfile = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles,
      }
      setUser(profile)

      return user
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,   // 5 minutos
    gcTime:    10 * 60 * 1000,   // 10 minutos
    retry: false,                // No reintentar — el refreshInterceptor maneja 401
  })
}
