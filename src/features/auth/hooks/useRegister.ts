import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { authService } from '@/services/auth/authService'
import { useAuthStore } from '@/store/authStore'
import { parseErrorMessage } from '@/utils/helpers/errorParser'

const ADMIN_ROLES = ['SuperAdmin', 'Admin', 'Supervisor', 'Vendedor', 'Almacen', 'Finance']

/**
 * Hook de registro.
 *
 * Flujo:
 * 1. POST /auth/register → crea la cuenta
 * 2. POST /auth/login   → inicia sesión automáticamente con las mismas credenciales
 * 3. Redirige al dashboard, tienda o ?redirect= según corresponda
 */
export function useRegister() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  return useMutation({
    mutationFn: async (values: {
      email: string
      password: string
      firstName: string
      lastName: string
      phoneNumber?: string
    }) => {
      // 1. Crear cuenta
      await authService.register(values)

      // 2. Login automático con las mismas credenciales
      const session = await authService.login(values.email, values.password)
      return session
    },

    onSuccess: (session) => {
      login(session)

      const redirectTo = searchParams.get('redirect')
      if (redirectTo) {
        navigate(decodeURIComponent(redirectTo), { replace: true })
        toast.success(`¡Bienvenido, ${session.user.fullName}!`)
        return
      }

      const isAdmin = session.user.roles.some((r) => ADMIN_ROLES.includes(r))
      navigate(isAdmin ? '/admin/dashboard' : '/', { replace: true })
      toast.success(`¡Bienvenido, ${session.user.fullName}!`)
    },

    onError: (error) => {
      toast.error(parseErrorMessage(error))
    },
  })
}
