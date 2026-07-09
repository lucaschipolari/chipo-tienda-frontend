import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService, type GetProductsParams } from '../productsService'
import type {
  CreateProductRequest,
  UpdateProductRequest,
  AddVariantRequest,
  UpdateVariantRequest,
} from '@/types/catalog.types'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: GetProductsParams) => [...productKeys.lists(), params] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useProducts(params: GetProductsParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsService.getAll(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id!),
    queryFn: () => productsService.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProductRequest) => productsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.lists() }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      productsService.update(id, data),
    onSuccess: (_r, { id }) => {
      qc.invalidateQueries({ queryKey: productKeys.lists() })
      qc.invalidateQueries({ queryKey: productKeys.detail(id) })
    },
  })
}

export function useChangeProductStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      productsService.changeStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  })
}

export function useAddVariant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AddVariantRequest) => productsService.addVariant(data),
    onSuccess: (_r, data) => {
      qc.invalidateQueries({ queryKey: productKeys.detail(data.productId) })
      qc.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

export function useUpdateVariant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateVariantRequest) => productsService.updateVariant(data),
    onSuccess: (_r, data) => {
      qc.invalidateQueries({ queryKey: productKeys.detail(data.productId) })
    },
  })
}

export function useAddProductImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, url }: { productId: string; url: string }) =>
      productsService.addImage(productId, url),
    onSuccess: (_r, { productId }) => {
      qc.invalidateQueries({ queryKey: productKeys.detail(productId) })
      qc.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

export function useRemoveProductImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) =>
      productsService.removeImage(productId, imageId),
    onSuccess: (_r, { productId }) => {
      qc.invalidateQueries({ queryKey: productKeys.detail(productId) })
      qc.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}
