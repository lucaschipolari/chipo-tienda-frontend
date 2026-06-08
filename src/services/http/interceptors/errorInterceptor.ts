import type { AxiosError, AxiosResponse } from 'axios'
import type { ApiError } from '@/types/api.types'

/**
 * Normaliza cualquier error de Axios en un ApiError consistente.
 * El backend (ExceptionHandlingMiddleware) ya devuelve:
 *   { status, errors, traceId } o { status, message, errors, traceId }
 */
export function normalizeError(error: AxiosError): ApiError {
  if (!error.response) {
    // Error de red — sin respuesta del servidor
    return {
      status: 0,
      message: 'No se pudo conectar al servidor. Verificá tu conexión.',
    }
  }

  const { status, data } = error.response as AxiosResponse<{
    status?: number
    message?: string
    errors?: Record<string, string[]>
    traceId?: string
    title?: string   // fallback para errores de ASP.NET sin middleware
    detail?: string
  }>

  return {
    status,
    message:
      data?.message ??
      data?.detail ??
      data?.title ??
      getDefaultMessage(status),
    errors:  data?.errors,
    traceId: data?.traceId,
  }
}

function getDefaultMessage(status: number): string {
  switch (status) {
    case 400: return 'La solicitud contiene datos inválidos.'
    case 401: return 'No autenticado. Por favor iniciá sesión.'
    case 403: return 'No tenés permiso para realizar esta acción.'
    case 404: return 'El recurso solicitado no existe.'
    case 409: return 'Conflicto con el estado actual del recurso.'
    case 422: return 'No se pudo procesar la solicitud.'
    case 429: return 'Demasiadas solicitudes. Esperá un momento.'
    case 500: return 'Error interno del servidor. Intentá de nuevo.'
    case 503: return 'Servicio no disponible temporalmente.'
    default:  return `Error inesperado (${status}).`
  }
}
