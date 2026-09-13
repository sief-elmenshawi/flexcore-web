export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface SpringPage<T> {
  content: T[]
  pageable: {
    sort: { sorted: boolean; unsorted: boolean; empty: boolean }
    offset: number
    pageNumber: number
    pageSize: number
    paged: boolean
    unpaged: boolean
  }
  last: boolean
  totalElements: number
  totalPages: number
  size: number
  number: number
  sort: { sorted: boolean; unsorted: boolean; empty: boolean }
  first: boolean
  numberOfElements: number
  empty: boolean
}

export interface ErrorResponse {
  timestamp: string
  status: number
  error: string
  messageKey: string
  message: string
  path: string
  fieldErrors?: Record<string, string> | null
  arguments?: unknown[]
}

export type PaymentMethod = 'MOCK_FAWRY' | 'MOCK_INSTAPAY' | 'MOCK_VODAFONE_CASH'
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED'
export type SubscriptionStatus = 'ACTIVE' | 'FROZEN' | 'EXPIRED' | 'CANCELLED'
export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED'
export type PTSessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export interface AuthResponse {
  accessToken: string
  tokenType: string
  userId: number
  email: string
  roleName: string
  refreshToken: string
}

export interface UserResponse {
  id: number
  fullName: string
  email: string
  phoneNumber: string
  roleName: string
  active: boolean
  createdDate: string
}

export interface PermissionResponse {
  id: number
  code: string
  description: string
}

export interface RoleResponse {
  id: number
  name: string
  permissions: PermissionResponse[]
}

export interface SubscriptionPlanResponse {
  id: number
  name: string
  price: number
  durationInDays: number
  maxFamilyMembers: number | null
  familyPlan: boolean
}

export interface SubscriptionResponse {
  id: number
  userId: number
  userName: string
  planId: number
  planName: string
  price: number
  status: SubscriptionStatus
  startDate: string
  endDate: string
  frozenAt: string | null
  frozenUntil: string | null
  familyGroupId: number | null
}

export interface FamilyGroupResponse {
  id: number
  ownerUserId: number
  ownerName: string
  planId: number
  planName: string
  maxMembers: number | null
}

export interface PaymentResponse {
  id: number
  subscriptionId: number
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  paidAt: string | null
}

export interface GymClassResponse {
  id: number
  name: string
  trainerId: number
  trainerName: string
  capacity: number
  bookedCount: number
  availableSpots: number
  startsAt: string
  durationMinutes: number
}

export interface ClassBookingResponse {
  id: number
  userId: number
  userName: string
  classId: number
  className: string
  trainerName: string
  startsAt: string
  status: BookingStatus
  bookedAt: string
}

export interface PTSessionResponse {
  id: number
  memberId: number
  memberName: string
  trainerId: number
  trainerName: string
  scheduledAt: string
  durationMinutes: number
  status: PTSessionStatus
}

export interface AttendanceResponse {
  id: number
  userId: number
  userName: string
  subscriptionId: number
  checkedInByName: string
  checkInAt: string
}

export interface RevenueReportResponse {
  startDate: string
  endDate: string
  totalRevenue: number
  totalPayments: number
  breakdown: { method: string; total: number; count: number }[]
}

// ----- Request DTOs -----

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  phoneNumber?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface UpdateProfileRequest {
  fullName: string
  phoneNumber?: string
}

export interface CreateUserRequest {
  fullName: string
  email: string
  password: string
  phoneNumber?: string
  roleId: number
}

export interface UpdateUserRequest {
  fullName: string
  phoneNumber?: string
}

export interface CreateRoleRequest {
  name: string
  permissionCodes: string[]
}

export interface UpdateRoleRequest {
  name: string
  permissionCodes: string[]
}

export interface CreateSubscriptionPlanRequest {
  name: string
  price: number
  durationInDays: number
  maxFamilyMembers?: number | null
}

export interface UpdateSubscriptionPlanRequest {
  name: string
  price: number
  durationInDays: number
  maxFamilyMembers?: number | null
}

export interface PurchaseSubscriptionRequest {
  userId?: number
  planId: number
  familyGroupId?: number
}

export interface FreezeSubscriptionRequest {
  days: number
}

export interface InitiatePaymentRequest {
  subscriptionId: number
  method: PaymentMethod
}

export interface CreateFamilyGroupRequest {
  planId: number
}

export interface AddFamilyMemberRequest {
  userId: number
}

export interface CreateGymClassRequest {
  name: string
  trainerId: number
  capacity: number
  startsAt: string
  durationMinutes: number
}

export interface UpdateGymClassRequest {
  name: string
  trainerId: number
  capacity: number
  startsAt: string
  durationMinutes: number
}

export interface BookClassRequest {
  classId: number
}

export interface BookPTSessionRequest {
  trainerId: number
  scheduledAt: string
  durationMinutes?: number
}

export interface CheckInRequest {
  userId: number
}