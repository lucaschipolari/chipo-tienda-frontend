import { useState, useEffect } from 'react'

/**
 * Evalúa una media query CSS y devuelve si coincide.
 *
 * @example
 *   const isMobile  = useMediaQuery('(max-width: 640px)')
 *   const isTablet  = useMediaQuery('(max-width: 1024px)')
 *   const isDark    = useMediaQuery('(prefers-color-scheme: dark)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQueryList = window.matchMedia(query)
    setMatches(mediaQueryList.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQueryList.addEventListener('change', handler)
    return () => mediaQueryList.removeEventListener('change', handler)
  }, [query])

  return matches
}

// ─── Breakpoints predefinidos ─────────────────────────────────────────────────

export function useIsMobile() {
  return useMediaQuery('(max-width: 640px)')
}

export function useIsTablet() {
  return useMediaQuery('(max-width: 1024px)')
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)')
}
