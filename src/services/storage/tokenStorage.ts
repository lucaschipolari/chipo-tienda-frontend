/**
 * Token Storage
 *
 * Access token → memoria (Zustand) — protegido de XSS
 * Refresh token → localStorage — persiste entre sesiones
 *
 * NOTA: La opción ideal es httpOnly cookie para el refresh token (requiere
 * configuración CORS con credentials en el backend). Por ahora va en
 * localStorage con awareness del riesgo.
 */

const REFRESH_TOKEN_KEY = 'chipo_rt'

export const tokenStorage = {
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  },

  clearRefreshToken(): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}
