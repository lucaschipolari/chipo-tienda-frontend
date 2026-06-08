import { useState, useEffect } from 'react'

/**
 * Retarda la actualización de un valor hasta que el usuario deje de escribir.
 * Ideal para búsquedas en tiempo real.
 *
 * @param value   El valor a debouncear
 * @param delay   Tiempo en ms (default: 300)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
