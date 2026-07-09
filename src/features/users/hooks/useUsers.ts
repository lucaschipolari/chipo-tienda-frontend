import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usersService, type GetUsersParams } from '../usersService'
import { parseErrorMessage } from '@/utils/helpers/errorParser'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const usersKeys = {
  all: ['users'] as const,
  list: (params: GetUsersParams) => ['users', 'list', params] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
}

// ─── Lista paginada ───────────────────────────────────────────────────────────

export function useUsers(params: GetUsersParams = {}) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersService.getUsers(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

// ─── Detalle de usuario ───────────────────────────────────────────────────────

export function useUser(id: string) {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => usersService.getUserById(id),
    enabled: !!id,
  })
}

// ─── Crear usuario ────────────────────────────────────────────────────────────

export function useCreateUser() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: usersService.createUser,
    onSuccess: () => {
      toast.success('Usuario creado correctamente')
      qc.invalidateQueries({ queryKey: usersKeys.all })
    },
    onError: (err) => {
      toast.error(parseErrorMessage(err))
    },
  })
}

// ─── Cambiar estado ───────────────────────────────────────────────────────────

export function useChangeUserStatus() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'activate' | 'suspend' | 'block' }) =>
      usersService.changeStatus(id, action),
    onSuccess: () => {
      toast.success('Estado actualizado')
      qc.invalidateQueries({ queryKey: usersKeys.all })
    },
    onError: (err) => {
      toast.error(parseErrorMessage(err))
    },
  })
}

// ─── Asignar / quitar rol ─────────────────────────────────────────────────────

export function useAssignRole() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      usersService.assignRole(userId, roleId),
    onSuccess: () => {
      toast.success('Rol asignado correctamente')
      qc.invalidateQueries({ queryKey: usersKeys.all })
    },
    onError: (err) => {
      toast.error(parseErrorMessage(err))
    },
  })
}

export function useRemoveRole() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      usersService.removeRole(userId, roleId),
    onSuccess: () => {
      toast.success('Rol removido')
      qc.invalidateQueries({ queryKey: usersKeys.all })
    },
    onError: (err) => {
      toast.error(parseErrorMessage(err))
    },
  })
}
