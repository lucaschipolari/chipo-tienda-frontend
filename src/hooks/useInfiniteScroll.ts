import { useEffect, useRef, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  onLoadMore: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  threshold?: number  // px antes del final para activar (default: 200)
}

/**
 * Activa `onLoadMore` cuando el usuario se acerca al final del contenedor.
 * Usa IntersectionObserver para máximo rendimiento.
 *
 * @example
 *   const { loaderRef } = useInfiniteScroll({ onLoadMore: fetchNextPage, hasNextPage })
 *   return <div ref={loaderRef} />
 */
export function useInfiniteScroll({
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
}: UseInfiniteScrollOptions) {
  const loaderRef = useRef<HTMLDivElement | null>(null)

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        onLoadMore()
      }
    },
    [hasNextPage, isFetchingNextPage, onLoadMore],
  )

  useEffect(() => {
    const element = loaderRef.current
    if (!element) return

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px',
      threshold: 0,
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [handleObserver])

  return { loaderRef }
}
