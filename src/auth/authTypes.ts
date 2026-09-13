import type { LoginRequest, RegisterRequest } from '../api/types'

export interface StoredUser {
  userId: number
  email: string
  roleName: string
}

export type { LoginRequest, RegisterRequest }