import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import type { ErrorResponse } from './types'
import { clearAuth, getAccessToken } from './authStorage'
import { refreshAccessToken } from './refreshCoordinator'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

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
    const url = original?.url ?? ''

    // Login/register/logout returns 401 by nature; attempting an access-token refresh
    // for those would loop or stamp "session expired" over legitimate auth errors.
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/logout')

    if (status === 401 && original && !original._retry && !isAuthCall) {
      const token = getAccessToken()
      // Refresh token itself is expired/invalid -> give up immediately
      if (!token) {
        clearAuth()
        window.dispatchEvent(new Event('auth:expired'))
        return Promise.reject(error)
      }

      original._retry = true
      const ok = await refreshAccessToken()
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
      // Field-level validation errors carry the most specific text; use them first
      // so the generic "please check the fields" banner never hides the real message.
      if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
        const first = Object.values(data.fieldErrors)[0]
        return typeof first === 'string' ? first.split('\n')[0] : (t ? t('errors.validation') : 'Validation failed')
      }
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
  }
  return t ? t('errors.network') : 'Network error'
}