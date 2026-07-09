import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { rolesService, type CreateRolePayload } from '../rolesService'
import { parseErrorMessage } from '@/utils/helpers/errorParser'

export const rolesKeys = {
  all: ['roles'] as const,
  list: () => ['roles', 'list'] as const,
  permissions: () => ['roles', 'permissions'] as const,
}

export function useRoles() {
  return useQuery({
    queryKey: rolesKeys.list(),
    queryFn: rolesService.getRoles,
    staleTime: 60_000,
  })
}

export function usePermissions() {
  return useQuery({
    queryKey: rolesKeys.permissions(),
    queryFn: rolesService.getPermissions,
    staleTime: 5 * 60_000,
  })
}

export function useCreateRole() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateRolePayload) => rolesService.createRole(payload),
    onSuccess: () => {
      toast.success('Rol creado correctamente')
      qc.invalidateQueries({ queryKey: rolesKeys.all })
    },
    onError: (err) => {
      toast.error(parseErrorMessage(err))
    },
  })
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      rolesService.updatePermissions(roleId, permissionIds),
    onSuccess: () => {
      toast.success('Permisos actualizados')
      qc.invalidateQueries({ queryKey: rolesKeys.all })
    },
    onError: (err) => {
      toast.error(parseErrorMessage(err))
    },
  })
}
