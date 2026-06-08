import type { ApiError } from '@/types/api.types'

/**
 * Extrae el mensaje de error principal de cualquier error capturado.
 * Acepta ApiError, Error nativo, o strings.
 */
export function parseErrorMessage(error: unknown): string {
  if (!error) return 'Error desconocido.'

  // ApiError normalizado
  if (isApiError(error)) {
    return error.message
  }

  // Error nativo de JS
  if (error instanceof Error) {
    return error.message
  }

  // String directo
  if (typeof error === 'string') {
    return error
  }

  return 'Ocurrió un error inesperado.'
}

/**
 * Verifica si un valor es un ApiError normalizado.
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  )
}

/**
 * Extrae errores de validación de campo de un ApiError.
 * Útil para mapear errores del backend a React Hook Form.
 *
 * @returns Record<fieldName, firstErrorMessage>
 */
export function extractFieldErrors(
  error: unknown,
): Record<string, string> | null {
  if (!isApiError(error) || !error.errors) return null

  return Object.fromEntries(
    Object.entries(error.errors).map(([field, messages]) => [
      // El backend usa PascalCase, RHF usa camelCase
      field.charAt(0).toLowerCase() + field.slice(1),
      messages[0] ?? 'Error de validación.',
    ]),
  )
}
