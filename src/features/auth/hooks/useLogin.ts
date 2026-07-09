import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { authService } from '@/services/auth/authService'
import { useAuthStore } from '@/store/authStore'
import { parseErrorMessage } from '@/utils/helpers/errorParser'

const ADMIN_ROLES = ['SuperAdmin', 'Admin', 'Supervisor', 'Vendedor', 'Almacen', 'Finance']

export function useLogin() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),

    onSuccess: (data) => {
      login(data)

      // Respetar el ?redirect= que dejan los guards (RequireAuth / RequireCustomer)
      const redirectTo = searchParams.get('redirect')
      if (redirectTo) {
        navigate(decodeURIComponent(redirectTo), { replace: true })
        toast.success(`Bienvenido, ${data.user.fullName}`)
        return
      }

      // Redirigir según el rol cuando no hay redirect explícito
      const isAdmin = data.user.roles.some((r) => ADMIN_ROLES.includes(r))
      navigate(isAdmin ? '/admin/dashboard' : '/', { replace: true })
      toast.success(`Bienvenido, ${data.user.fullName}`)
    },

    onError: (error) => {
      toast.error(parseErrorMessage(error))
    },
  })
}
