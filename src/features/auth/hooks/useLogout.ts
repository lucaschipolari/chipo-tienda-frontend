import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth/authService'
import { useAuthStore } from '@/store/authStore'
import { tokenStorage } from '@/services/storage/tokenStorage'

/**
 * Hook para cerrar sesión.
 *
 * Flujo:
 * 1. Llama a POST /auth/logout en el backend (revoca el refresh token)
 * 2. Limpia el estado del store (logout) — accesToken en memoria + RT en LS
 * 3. Limpia el cache de TanStack Query para evitar datos stale
 * 4. Redirige a /login
 *
 * El paso 1 puede fallar silenciosamente — la sesión local se elimina igual.
 */
export function useLogout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { mutate: logoutMutate, isPending } = useMutation({
    mutationFn: async () => {
      const refreshToken = tokenStorage.getRefreshToken()
      if (refreshToken) {
        // Silencia cualquier error — no queremos bloquear el logout local
        await authService.logout(refreshToken).catch(() => {})
      }
    },

    onSettled: () => {
      // Siempre ejecutar el cleanup local, independientemente del resultado
      logout()
      queryClient.clear()
      navigate('/login', { replace: true })
    },
  })

  return {
    logout: logoutMutate,
    isLoggingOut: isPending,
  }
}
