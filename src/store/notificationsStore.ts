import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type NotificationType = 'info' | 'success' | 'warning' | 'danger'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message?: string
  read: boolean
  createdAt: string
  link?: string
}

interface NotificationsState {
  notifications: AppNotification[]
  unreadCount: number
}

interface NotificationsActions {
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

type NotificationsStore = NotificationsState & NotificationsActions

let idCounter = 0

export const useNotificationsStore = create<NotificationsStore>()(
  devtools(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const newItem: AppNotification = {
          ...notification,
          id: `notif_${Date.now()}_${++idCounter}`,
          read: false,
          createdAt: new Date().toISOString(),
        }
        set(
          (s) => ({
            notifications: [newItem, ...s.notifications].slice(0, 50), // max 50
            unreadCount: s.unreadCount + 1,
          }),
          false,
          'notifications/add',
        )
      },

      markAsRead: (id) =>
        set(
          (s) => {
            const updated = s.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n,
            )
            return {
              notifications: updated,
              unreadCount: updated.filter((n) => !n.read).length,
            }
          },
          false,
          'notifications/markRead',
        ),

      markAllAsRead: () =>
        set(
          (s) => ({
            notifications: s.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
          }),
          false,
          'notifications/markAllRead',
        ),

      removeNotification: (id) =>
        set(
          (s) => {
            const updated = s.notifications.filter((n) => n.id !== id)
            return {
              notifications: updated,
              unreadCount: updated.filter((n) => !n.read).length,
            }
          },
          false,
          'notifications/remove',
        ),

      clearAll: () =>
        set(
          { notifications: [], unreadCount: 0 },
          false,
          'notifications/clearAll',
        ),
    }),
    { name: 'NotificationsStore' },
  ),
)
