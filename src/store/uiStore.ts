import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface UiState {
  sidebarCollapsed: boolean
  theme: Theme
  isMobileMenuOpen: boolean
  cartDrawerOpen: boolean
}

interface UiActions {
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: Theme) => void
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
  openCartDrawer: () => void
  closeCartDrawer: () => void
  toggleCartDrawer: () => void
}

type UiStore = UiState & UiActions

export const useUiStore = create<UiStore>()(
  devtools(
    persist(
      (set) => ({
        // ─── State ────────────────────────────────────────────────────
        sidebarCollapsed: false,
        theme: 'light',
        isMobileMenuOpen: false,
        cartDrawerOpen: false,

        // ─── Actions ──────────────────────────────────────────────────
        toggleSidebar: () =>
          set(
            (s) => ({ sidebarCollapsed: !s.sidebarCollapsed }),
            false,
            'ui/toggleSidebar',
          ),

        setSidebarCollapsed: (collapsed) =>
          set({ sidebarCollapsed: collapsed }, false, 'ui/setSidebarCollapsed'),

        setTheme: (theme) =>
          set({ theme }, false, 'ui/setTheme'),

        toggleMobileMenu: () =>
          set(
            (s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen }),
            false,
            'ui/toggleMobileMenu',
          ),

        closeMobileMenu: () =>
          set({ isMobileMenuOpen: false }, false, 'ui/closeMobileMenu'),

        openCartDrawer: () =>
          set({ cartDrawerOpen: true }, false, 'ui/openCartDrawer'),

        closeCartDrawer: () =>
          set({ cartDrawerOpen: false }, false, 'ui/closeCartDrawer'),

        toggleCartDrawer: () =>
          set(
            (s) => ({ cartDrawerOpen: !s.cartDrawerOpen }),
            false,
            'ui/toggleCartDrawer',
          ),
      }),
      {
        name: 'chipo_ui',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
        }),
      },
    ),
    { name: 'UiStore' },
  ),
)
