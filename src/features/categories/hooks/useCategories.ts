import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesService } from '../categoriesService'
import type { CreateCategoryRequest, UpdateCategoryRequest, Category } from '@/types/catalog.types'

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (includeInactive: boolean) => [...categoryKeys.lists(), { includeInactive }] as const,
  detail: (id: string) => [...categoryKeys.all, 'detail', id] as const,
}

export function useCategories(includeInactive = false) {
  return useQuery({
    queryKey: categoryKeys.list(includeInactive),
    queryFn: () => categoriesService.getAll(includeInactive),
    staleTime: 60_000,
  })
}

export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: categoryKeys.detail(id!),
    queryFn: () => categoriesService.getById(id!),
    enabled: !!id,
    staleTime: 60_000,
  })
}

/** Aplana el árbol de categorías para usar en selects */
export function flattenCategories(cats: Category[], depth = 0): (Category & { depth: number })[] {
  return cats.flatMap((c) => [
    { ...c, depth },
    ...flattenCategories(c.subCategories, depth + 1),
  ])
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoriesService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.lists() }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      categoriesService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.lists() }),
  })
}
