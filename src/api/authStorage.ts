import type { AuthResponse } from './types'

export interface JwtClaims {
  sub: string
  email: string
  role: string
  permissions: string[]
  iat: number
  exp: number
}

const TOKEN_KEY = 'flexcore.accessToken'
const REFRESH_KEY = 'flexcore.refreshToken'
const USER_KEY = 'flexcore.user'

export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1]
    // base64url -> base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(json) as JwtClaims
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const claims = decodeJwt(token)
  if (!claims) return true
  return claims.exp * 1000 <= Date.now()
}

export interface StoredUser {
  userId: number
  email: string
  roleName: string
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function getPermissions(): string[] {
  const token = getAccessToken()
  if (!token) return []
  const claims = decodeJwt(token)
  return claims?.permissions ?? []
}

export function persistAuth(res: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, res.accessToken)
  localStorage.setItem(REFRESH_KEY, res.refreshToken)
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({ userId: res.userId, email: res.email, roleName: res.roleName } satisfies StoredUser),
  )
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}