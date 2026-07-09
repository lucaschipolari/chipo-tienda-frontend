import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { privateClient } from '@/services/http/axiosInstance'
import { parseErrorMessage } from '@/utils/helpers/errorParser'

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      privateClient
        .post('/auth/change-password', payload)
        .then((r) => r.data),

    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente')
    },
    onError: (err) => {
      toast.error(parseErrorMessage(err))
    },
  })
}
