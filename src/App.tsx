import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Spin } from 'antd'
import { AppLayout } from './layout/AppLayout'
import { GuestOnly, RequireAuth, RequirePermission } from './auth/RequireAuth'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PlansPage = lazy(() => import('./pages/PlansPage'))
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage'))
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'))
const FamilyGroupsPage = lazy(() => import('./pages/FamilyGroupsPage'))
const ClassesPage = lazy(() => import('./pages/ClassesPage'))
const BookingsPage = lazy(() => import('./pages/BookingsPage'))
const PTSessionsPage = lazy(() => import('./pages/PTSessionsPage'))
const AttendancePage = lazy(() => import('./pages/AttendancePage'))
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'))
const AdminRolesPage = lazy(() => import('./pages/AdminRolesPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function Loading() {
  return (
    <div style={{ height: '40vh', display: 'grid', placeItems: 'center' }}>
      <Spin size="large" />
    </div>
  )
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Lazy><LoginPage /></Lazy></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Lazy><RegisterPage /></Lazy></GuestOnly>} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Lazy><DashboardPage /></Lazy>} />
        <Route
          path="plans"
          element={
            <RequirePermission permission={['BOOK_CLASS', 'MANAGE_SUBSCRIPTIONS']}>
              <Lazy><PlansPage /></Lazy>
            </RequirePermission>
          }
        />
        <Route
          path="subscriptions"
          element={
            <RequirePermission permission="FREEZE_OWN_SUBSCRIPTION">
              <Lazy><SubscriptionsPage /></Lazy>
            </RequirePermission>
          }
        />
        <Route
          path="payments"
          element={
            <RequirePermission permission={['BOOK_CLASS', 'VIEW_REPORTS', 'MANAGE_SUBSCRIPTIONS']}>
              <Lazy><PaymentsPage /></Lazy>
            </RequirePermission>
          }
        />
        <Route
          path="family"
          element={
            <RequirePermission permission="BOOK_CLASS">
              <Lazy><FamilyGroupsPage /></Lazy>
            </RequirePermission>
          }
        />
        <Route
          path="classes"
          element={
            <RequirePermission permission={['BOOK_CLASS', 'MANAGE_OWN_SCHEDULE']}>
              <Lazy><ClassesPage /></Lazy>
            </RequirePermission>
          }
        />
        <Route
          path="bookings"
          element={
            <RequirePermission permission="BOOK_CLASS">
              <Lazy><BookingsPage /></Lazy>
            </RequirePermission>
          }
        />
        <Route
          path="pt-sessions"
          element={
            <RequirePermission permission={['BOOK_CLASS', 'MANAGE_OWN_SCHEDULE']}>
              <Lazy><PTSessionsPage /></Lazy>
            </RequirePermission>
          }
        />
        <Route
          path="attendance"
          element={
            <RequirePermission permission="CHECK_IN_MEMBER">
              <Lazy><AttendancePage /></Lazy>
            </RequirePermission>
          }
        />
        <Route
          path="admin/users"
          element={
            <RequirePermission permission="MANAGE_STAFF">
              <Lazy><AdminUsersPage /></Lazy>
            </RequirePermission>
          }
        />
        <Route
          path="admin/roles"
          element={
            <RequirePermission permission="MANAGE_STAFF">
              <Lazy><AdminRolesPage /></Lazy>
            </RequirePermission>
          }
        />
        <Route
          path="reports"
          element={
            <RequirePermission permission="VIEW_REPORTS">
              <Lazy><ReportsPage /></Lazy>
            </RequirePermission>
          }
        />
        <Route path="profile" element={<Lazy><ProfilePage /></Lazy>} />
        <Route path="*" element={<Lazy><NotFoundPage /></Lazy>} />
      </Route>
    </Routes>
  )
}