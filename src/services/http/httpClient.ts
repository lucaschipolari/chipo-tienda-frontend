/**
 * HTTP Client
 *
 * Wrapper tipado sobre axios que estandariza las llamadas a la API.
 * Siempre devuelve el `data` de la respuesta, nunca el AxiosResponse completo.
 *
 * Uso:
 *   const products = await httpClient.get<Product[]>('/products', { page: 1 })
 *   const product  = await httpClient.post<Product>('/products', payload)
 */

import type { AxiosRequestConfig } from 'axios'
import { privateClient, publicClient } from './axiosInstance'

type ClientType = 'private' | 'public'

function getClient(type: ClientType) {
  return type === 'public' ? publicClient : privateClient
}

export const httpClient = {
  get<T>(
    url: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig,
    client: ClientType = 'private',
  ): Promise<T> {
    return getClient(client)
      .get<T>(url, { params, ...config })
      .then((res) => res.data)
  },

  post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
    client: ClientType = 'private',
  ): Promise<T> {
    return getClient(client)
      .post<T>(url, data, config)
      .then((res) => res.data)
  },

  put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
    client: ClientType = 'private',
  ): Promise<T> {
    return getClient(client)
      .put<T>(url, data, config)
      .then((res) => res.data)
  },

  patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
    client: ClientType = 'private',
  ): Promise<T> {
    return getClient(client)
      .patch<T>(url, data, config)
      .then((res) => res.data)
  },

  delete<T = void>(
    url: string,
    config?: AxiosRequestConfig,
    client: ClientType = 'private',
  ): Promise<T> {
    return getClient(client)
      .delete<T>(url, config)
      .then((res) => res.data)
  },
}

// Re-export para conveniencia
export { publicClient, privateClient }
