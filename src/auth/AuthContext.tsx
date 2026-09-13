import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { UserResponse } from '../api/types'
import { userApi } from '../api/endpoints'
import { authApi } from '../api/endpoints'
import {
  clearAuth,
  decodeJwt,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  isTokenExpired,
  persistAuth,
} from '../api/authStorage'
import type { LoginRequest, RegisterRequest } from '../api/types'
import type { StoredUser } from '../auth/authTypes'
import { RequirePermission as PermissionGate } from './RequireAuth'

interface AuthContextValue {
  user: StoredUser | null
  profile: UserResponse | null
  profileLoading: boolean
  ready: boolean
  login: (body: LoginRequest) => Promise<void>
  register: (body: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (perm: string) => boolean
  hasAny: (perms: string[]) => boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const GUEST_ROUTE = '/login'

function hasValidToken(): boolean {
  const token = getAccessToken()
  if (!token) return false
  if (isTokenExpired(token)) {
    // Leave the refresh token in place so the interceptor can rotate it.
    // If refresh fails, the interceptor clears everything and dispatches auth:expired.
    return getRefreshToken() != null
  }
  return true
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser())
  const [profile, setProfile] = useState<UserResponse | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [ready, setReady] = useState(() => hasValidToken())

  const refreshProfile = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return
    setProfileLoading(true)
    try {
      const { data } = await userApi.me()
      setProfile(data)
      setUser({ userId: data.id, email: data.email, roleName: data.roleName })
    } catch {
      // let the interceptor handle 401
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    if (ready && user) {
      void refreshProfile()
    }
  }, [ready, user?.userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onExpired = () => {
      setUser(null)
      setProfile(null)
      setReady(false)
    }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const login = useCallback(async (body: LoginRequest) => {
    const { data } = await authApi.login(body)
    persistAuth(data)
    setUser({ userId: data.userId, email: data.email, roleName: data.roleName })
    setReady(true)
  }, [])

  const register = useCallback(async (body: RegisterRequest) => {
    const { data } = await authApi.register(body)
    persistAuth(data)
    setUser({ userId: data.userId, email: data.email, roleName: data.roleName })
    setReady(true)
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        await authApi.logout({ refreshToken })
      } catch {
        // ignore server-side failure, we clear locally regardless
      }
    }
    clearAuth()
    setUser(null)
    setProfile(null)
    setReady(false)
  }, [])

  const hasPermission = useCallback(
    (perm: string) => {
      const token = getAccessToken()
      if (!token) return false
      const claims = decodeJwt(token)
      return Array.isArray(claims?.permissions) && claims.permissions.includes(perm)
    },
    [],
  )

  const hasAny = useCallback(
    (perms: string[]) => perms.some((p) => hasPermission(p)),
    [hasPermission],
  )

  const value = useMemo(
    () => ({
      user,
      profile,
      profileLoading,
      ready,
      login,
      register,
      logout,
      hasPermission,
      hasAny,
      refreshProfile,
    }),
    [user, profile, profileLoading, ready, login, register, logout, hasPermission, hasAny, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export { PermissionGate }

export { GUEST_ROUTE }