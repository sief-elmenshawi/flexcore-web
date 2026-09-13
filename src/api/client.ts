import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import type { AuthResponse, ErrorResponse } from './types'
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  persistAuth,
} from './authStorage'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

let refreshPromise: Promise<boolean> | null = null

async function attemptRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  try {
    const { data } = await axios.post<AuthResponse>(
      `${BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    )
    persistAuth(data)
    return true
  } catch {
    clearAuth()
    return false
  }
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['Accept-Language'] = localStorage.getItem('flexcore.lang') ?? 'en'
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined
    const status = error.response?.status

    if (status === 401 && original && !original._retry) {
      const token = getAccessToken()
      // Refresh token itself is expired/invalid -> give up immediately
      if (!token) {
        clearAuth()
        window.dispatchEvent(new Event('auth:expired'))
        return Promise.reject(error)
      }

      original._retry = true
      refreshPromise = refreshPromise ?? attemptRefresh().finally(() => (refreshPromise = null))
      const ok = await refreshPromise

      if (ok) {
        original.headers = original.headers ?? {}
        ;(original.headers as Record<string, string>).Authorization = `Bearer ${getAccessToken()}`
        return api(original)
      }

      window.dispatchEvent(new Event('auth:expired'))
    }

    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown, t?: (key: string, fallback?: string, ...args: unknown[]) => string): string {
  if (axios.isAxiosError<ErrorResponse>(error)) {
    const data = error.response?.data
    if (data) {
      const args = Array.isArray(data.arguments) ? data.arguments : []
      if (t && typeof data.messageKey === 'string') {
        const translated = t(data.messageKey, data.message, ...args)
        return translated ?? data.message ?? data.messageKey
      }
      if (data.message) return data.message
      if (typeof data.messageKey === 'string') return data.messageKey
    }
    if (error.response?.status === 401) return t ? t('errors.unauthorized') : 'Unauthorized'
    if (error.response?.status === 403) return t ? t('errors.forbidden') : 'Forbidden'
    if (error.response?.status === 404) return t ? t('errors.notFound') : 'Not Found'
    if (error.response?.status === 409) return t ? t('errors.conflict') : 'Conflict'
    if (error.response?.status === 400 && data?.fieldErrors) {
      const first = Object.values(data.fieldErrors)[0]
      return typeof first === 'string' ? first : (t ? t('errors.validation') : 'Validation failed')
    }
  }
  return t ? t('errors.network') : 'Network error'
}