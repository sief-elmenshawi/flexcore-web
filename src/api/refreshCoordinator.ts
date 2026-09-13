import axios from 'axios'
import type { AuthResponse } from './types'
import { clearAuth, getRefreshToken, persistAuth } from './authStorage'

const LOCK_KEY = 'flexcore.refresh.lock'
const DONE_KEY = 'flexcore.refresh.result'
const REFRESH_URL = `${(import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1'}/auth/refresh`

const WAIT_ROUND_MS = 2_000
const LOCK_LEASE_MS = 30_000
const MAX_ATTEMPTS = 20

let inFlight: Promise<boolean> | null = null

/**
 * Runs a single cross-tab-coordinated refresh of the access token.
 *
 * The backend rotates the refresh token on every use, and treats presenting an
 * already-rotated token as a replay: it revokes the whole token family. Two browser
 * tabs racing to refresh could therefore trip that detection and log the user out for
 * no reason. This coordinator elects a single "leader" tab (localStorage lock); the
 * other tabs wait for the leader's outcome instead of firing their own refresh.
 */
export function refreshAccessToken(): Promise<boolean> {
  if (inFlight) return inFlight
  inFlight = run(1).finally(() => {
    inFlight = null
  })
  return inFlight
}

async function run(attempt: number): Promise<boolean> {
  const myId = createId()
  if (acquireLock(myId)) {
    let ok = false
    try {
      ok = await performRefresh()
    } finally {
      localStorage.removeItem(LOCK_KEY)
    }
    localStorage.setItem(DONE_KEY, JSON.stringify({ ok, ts: Date.now() }))
    return ok
  }

  const outcome = await waitForLeader(WAIT_ROUND_MS)
  if (outcome !== null) return outcome

  // No tab signalled completion in time: the leader either died mid-refresh,
  // or is still working but beyond an active lease. Loop and try to lead,
  // unless we already spinned long enough.
  return attempt < MAX_ATTEMPTS ? run(attempt + 1) : false
}

function acquireLock(myId: string): boolean {
  const now = Date.now()
  try {
    const raw = localStorage.getItem(LOCK_KEY)
    if (raw) {
      const lock = JSON.parse(raw) as { id: string; ts: number }
      if (lock.ts && now - lock.ts < LOCK_LEASE_MS) return false
    }
  } catch {
    // corrupt lock entry -> safe to take over
  }
  localStorage.setItem(LOCK_KEY, JSON.stringify({ id: myId, ts: now }))
  try {
    const stored = JSON.parse(localStorage.getItem(LOCK_KEY) ?? '') as { id?: string }
    return stored.id === myId
  } catch {
    return false
  }
}

function waitForLeader(timeoutMs: number): Promise<boolean | null> {
  return new Promise((resolve) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === DONE_KEY) {
        cleanup()
        resolve(readResult())
      }
    }
    const timer = setTimeout(() => {
      cleanup()
      resolve(null)
    }, timeoutMs)
    const cleanup = () => {
      clearTimeout(timer)
      window.removeEventListener('storage', onStorage)
    }
    window.addEventListener('storage', onStorage)
  })
}

function readResult(): boolean {
  try {
    const raw = localStorage.getItem(DONE_KEY)
    if (!raw) return false
    return (JSON.parse(raw) as { ok?: boolean }).ok === true
  } catch {
    return false
  }
}

async function performRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  try {
    const { data } = await axios.post<AuthResponse>(
      REFRESH_URL,
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

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}