import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready } = useAuth()
  if (!ready) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { ready } = useAuth()
  if (ready) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export function RequirePermission({
  permission,
  children,
}: {
  permission: string | string[]
  children: ReactNode
}) {
  const { hasAny } = useAuth()
  const perms = Array.isArray(permission) ? permission : [permission]
  if (hasAny(perms)) return <>{children}</>
  return <Navigate to="/dashboard" replace />
}