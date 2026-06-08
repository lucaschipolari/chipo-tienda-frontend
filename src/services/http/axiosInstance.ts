import axios from 'axios'
import { authRequestInterceptor } from './interceptors/authInterceptor'
import { setupRefreshInterceptor } from './interceptors/refreshInterceptor'
import { normalizeError } from './interceptors/errorInterceptor'

const BASE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api`

// ─── Cliente público ──────────────────────────────────────────────────────────
// Para login, registro, catálogo público — sin auth interceptor

export const publicClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Normalizar errores del cliente público también
publicClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeError(error)),
)

// ─── Cliente privado ──────────────────────────────────────────────────────────
// Para todos los endpoints autenticados

export const privateClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// 1. Adjuntar Bearer token a cada request
privateClient.interceptors.request.use(authRequestInterceptor)

// 2. Manejar 401 → refresh token → reintentar (debe registrarse ANTES del error normalizer)
setupRefreshInterceptor(privateClient)

// 3. Normalizar errores al formato ApiError
privateClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // El refreshInterceptor ya maneja los 401 — el resto se normaliza aquí
    if (error.response?.status !== 401) {
      return Promise.reject(normalizeError(error))
    }
    return Promise.reject(error)
  },
)
