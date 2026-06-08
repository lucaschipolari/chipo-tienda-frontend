/**
 * Utilidades de texto.
 */

/**
 * Trunca un string agregando "..." si supera la longitud máxima.
 */
export function truncate(text: string, maxLength: number, ellipsis = '...'): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - ellipsis.length) + ellipsis
}

/**
 * Capitaliza la primera letra.
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Capitaliza cada palabra.
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(capitalize)
    .join(' ')
}

/**
 * Genera un slug URL-friendly: "Hola Mundo!" → "hola-mundo"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos
    .replace(/[^a-z0-9\s-]/g, '')    // quita caracteres especiales
    .replace(/\s+/g, '-')            // reemplaza espacios por guiones
    .replace(/-+/g, '-')             // colapsa guiones múltiples
    .trim()
}

/**
 * Obtiene las iniciales de un nombre: "Juan García" → "JG"
 */
export function getInitials(name: string, maxChars = 2): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, maxChars)
    .join('')
}

/**
 * Pluraliza un texto condicionalmente.
 * @example pluralize(1, 'producto', 'productos') → "1 producto"
 */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}
