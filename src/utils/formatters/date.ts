/**
 * Formatea fechas de forma consistente en toda la aplicación.
 */

const DEFAULT_LOCALE = 'es-AR'

/**
 * Formatea fecha completa: "15 de enero de 2024"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/**
 * Formatea fecha corta: "15/01/2024"
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

/**
 * Formatea fecha y hora: "15/01/2024, 14:30"
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Tiempo relativo: "hace 3 minutos", "ayer", "hace 2 días"
 */
export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHrs = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHrs / 24)

  if (diffSec < 60)   return 'Hace un momento'
  if (diffMin < 60)   return `Hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`
  if (diffHrs < 24)   return `Hace ${diffHrs} ${diffHrs === 1 ? 'hora' : 'horas'}`
  if (diffDays < 7)   return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
  if (diffDays < 30)  return `Hace ${Math.floor(diffDays / 7)} semanas`

  return formatDateShort(d)
}

/**
 * Solo la hora: "14:30"
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}
