import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { queryClient } from './queryClient'

interface ProvidersProps {
  children: React.ReactNode
}

/**
 * Providers — Composición de todos los providers globales.
 * El orden importa: QueryClient > Toaster.
 * El RouterProvider está en App.tsx (necesita ser externo).
 */
export function Providers({ children }: ProvidersProps) {
  const enableDevtools = import.meta.env.VITE_ENABLE_DEVTOOLS === 'true'

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          classNames: {
            toast: 'font-sans text-sm',
          },
        }}
      />

      {/* TanStack Query DevTools — solo en desarrollo */}
      {enableDevtools && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  )
}
