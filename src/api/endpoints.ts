import { api } from './client'
import type {
  AddFamilyMemberRequest,
  AttendanceResponse,
  AuthResponse,
  BookClassRequest,
  BookPTSessionRequest,
  CheckInRequest,
  ClassBookingResponse,
  CreateFamilyGroupRequest,
  CreateGymClassRequest,
  CreateRoleRequest,
  CreateSubscriptionPlanRequest,
  CreateUserRequest,
  FamilyGroupResponse,
  FreezeSubscriptionRequest,
  GymClassResponse,
  InitiatePaymentRequest,
  LoginRequest,
  PagedResponse,
  PaymentResponse,
  PermissionResponse,
  PTSessionResponse,
  PurchaseSubscriptionRequest,
  RefreshTokenRequest,
  RegisterRequest,
  RevenueReportResponse,
  RoleResponse,
  SpringPage,
  SubscriptionPlanResponse,
  SubscriptionResponse,
  UpdateGymClassRequest,
  UpdateProfileRequest,
  UpdateRoleRequest,
  UpdateSubscriptionPlanRequest,
  UpdateUserRequest,
  UserResponse,
} from './types'

export interface PageParams {
  page?: number
  size?: number
  sort?: string
}

export const authApi = {
  register: (body: RegisterRequest) => api.post<AuthResponse>('/auth/register', body),
  login: (body: LoginRequest) => api.post<AuthResponse>('/auth/login', body),
  refresh: (body: RefreshTokenRequest) => api.post<AuthResponse>('/auth/refresh', body),
  logout: (body: RefreshTokenRequest) => api.post<void>('/auth/logout', body),
}

export const userApi = {
  me: () => api.get<UserResponse>('/users/me'),
  updateMe: (body: UpdateProfileRequest) => api.put<UserResponse>('/users/me', body),
  list: (params: PageParams) => api.get<SpringPage<UserResponse>>('/users', { params }),
  get: (id: number) => api.get<UserResponse>(`/users/${id}`),
  create: (body: CreateUserRequest) => api.post<UserResponse>('/users', body),
  update: (id: number, body: UpdateUserRequest) => api.put<UserResponse>(`/users/${id}`, body),
  remove: (id: number) => api.delete<void>(`/users/${id}`),
  trainers: (params?: PageParams) =>
    api.get<SpringPage<UserResponse>>('/users/trainers', { params }),
  members: (params?: PageParams) =>
    api.get<SpringPage<UserResponse>>('/users/members', { params }),
}

export const roleApi = {
  list: () => api.get<RoleResponse[]>('/roles'),
  get: (id: number) => api.get<RoleResponse>(`/roles/${id}`),
  create: (body: CreateRoleRequest) => api.post<RoleResponse>('/roles', body),
  update: (id: number, body: UpdateRoleRequest) => api.put<RoleResponse>(`/roles/${id}`, body),
  remove: (id: number) => api.delete<void>(`/roles/${id}`),
  permissions: () => api.get<PermissionResponse[]>('/roles/permissions'),
}

export const planApi = {
  list: () => api.get<SubscriptionPlanResponse[]>('/plans'),
  create: (body: CreateSubscriptionPlanRequest) => api.post<SubscriptionPlanResponse>('/plans', body),
  update: (id: number, body: UpdateSubscriptionPlanRequest) =>
    api.put<SubscriptionPlanResponse>(`/plans/${id}`, body),
}

export const subscriptionApi = {
  purchase: (body: PurchaseSubscriptionRequest) =>
    api.post<SubscriptionResponse>('/subscriptions/purchase', body),
  freeze: (id: number, body: FreezeSubscriptionRequest) =>
    api.post<SubscriptionResponse>(`/subscriptions/${id}/freeze`, body),
  unfreeze: (id: number) => api.post<SubscriptionResponse>(`/subscriptions/${id}/unfreeze`),
  cancel: (id: number) => api.delete<SubscriptionResponse>(`/subscriptions/${id}`),
  reactivate: (id: number) => api.post<SubscriptionResponse>(`/subscriptions/${id}/reactivate`),
  purge: (id: number) => api.delete<void>(`/subscriptions/${id}/purge`),
  my: () => api.get<SubscriptionResponse[]>('/subscriptions/my'),
  expiringSoon: (params: { withinDays?: number } & PageParams) =>
    api.get<PagedResponse<SubscriptionResponse>>('/subscriptions/expiring-soon', { params }),
}

export const familyGroupApi = {
  create: (body: CreateFamilyGroupRequest) => api.post<FamilyGroupResponse>('/family-groups', body),
  addMember: (id: number, body: AddFamilyMemberRequest) =>
    api.post<FamilyGroupResponse>(`/family-groups/${id}/members`, body),
  purge: (id: number) => api.delete<void>(`/family-groups/${id}/purge`),
  my: () => api.get<FamilyGroupResponse[]>('/family-groups/my'),
}

export const paymentApi = {
  initiate: (body: InitiatePaymentRequest, idempotencyKey?: string) =>
    api.post<PaymentResponse>('/payments/initiate', body, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    }),
  my: (params: PageParams) => api.get<PagedResponse<PaymentResponse>>('/payments/my', { params }),
}

export const classApi = {
  create: (body: CreateGymClassRequest) => api.post<GymClassResponse>('/classes', body),
  update: (id: number, body: UpdateGymClassRequest) => api.put<GymClassResponse>(`/classes/${id}`, body),
  get: (id: number) => api.get<GymClassResponse>(`/classes/${id}`),
  remove: (id: number) => api.delete<void>(`/classes/${id}`),
  upcoming: (params: { name?: string; trainerId?: number; from?: string; to?: string } & PageParams) =>
    api.get<PagedResponse<GymClassResponse>>('/classes/upcoming', { params }),
}

export const bookingApi = {
  create: (body: BookClassRequest) => api.post<ClassBookingResponse>('/bookings', body),
  my: (params: PageParams) => api.get<PagedResponse<ClassBookingResponse>>('/bookings/my', { params }),
  cancel: (id: number) => api.delete<void>(`/bookings/${id}`),
  purge: (id: number) => api.delete<void>(`/bookings/${id}/purge`),
}

export const ptSessionApi = {
  create: (body: BookPTSessionRequest) => api.post<PTSessionResponse>('/pt-sessions', body),
  mine: (params: PageParams) => api.get<PagedResponse<PTSessionResponse>>('/pt-sessions/mine', { params }),
  cancel: (id: number) => api.delete<void>(`/pt-sessions/${id}`),
  purge: (id: number) => api.delete<void>(`/pt-sessions/${id}/purge`),
}

export const attendanceApi = {
  checkIn: (body: CheckInRequest) => api.post<AttendanceResponse>('/attendance/check-in', body),
  history: (params: { userId?: number } & PageParams) =>
    api.get<PagedResponse<AttendanceResponse>>('/attendance', { params }),
}

export const reportApi = {
  revenue: (params: { start?: string; end?: string }) =>
    api.get<RevenueReportResponse>('/reports/revenue', { params }),
}