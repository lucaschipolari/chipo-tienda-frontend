import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/**
 * favoritesStore — favoritos del comprador, persistidos en localStorage.
 * Guarda un snapshot del producto para poder renderizar la grilla
 * sin depender de queries adicionales.
 */

export interface FavoriteItem {
  productId: string
  name: string
  categoryName?: string
  basePrice: number
  compareAtPrice?: number
  currency: string
  imageUrl?: string
  addedAt: string
}

interface FavoritesState {
  items: FavoriteItem[]
}

interface FavoritesActions {
  toggle: (item: Omit<FavoriteItem, 'addedAt'>) => void
  remove: (productId: string) => void
  isFavorite: (productId: string) => boolean
}

export const useFavoritesStore = create<FavoritesState & FavoritesActions>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],

        toggle: (item) => {
          const exists = get().items.some(i => i.productId === item.productId)
          set(
            {
              items: exists
                ? get().items.filter(i => i.productId !== item.productId)
                : [...get().items, { ...item, addedAt: new Date().toISOString() }],
            },
            false,
            'favorites/toggle',
          )
        },

        remove: (productId) =>
          set(
            { items: get().items.filter(i => i.productId !== productId) },
            false,
            'favorites/remove',
          ),

        isFavorite: (productId) => get().items.some(i => i.productId === productId),
      }),
      { name: 'chipo-favorites' },
    ),
  ),
)
