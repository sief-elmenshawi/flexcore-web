import { useMemo } from 'react'
import { Card, Col, Row, Skeleton, Space, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRightOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  DollarOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { subscriptionApi, bookingApi, paymentApi, ptSessionApi } from '../api/endpoints'
import { StatusTag } from '../components/StatusTag'
import { PageHeader, StatCard, EmptyHint } from '../components/common'
import { useI18n } from '../i18n'
import { useAuth } from '../auth/AuthContext'

export default function DashboardPage() {
  const { t, formatMoney, formatDateTime } = useI18n()
  const { profile, hasPermission } = useAuth()

  const subscriptions = useQuery({
    queryKey: ['subscriptions', 'my'],
    queryFn: async () => (await subscriptionApi.my()).data,
  })
  const bookings = useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: async () => (await bookingApi.my({ size: 5 })).data,
  })
  const payments = useQuery({
    queryKey: ['payments', 'my'],
    queryFn: async () => (await paymentApi.my({ size: 5 })).data,
  })
  const pt = useQuery({
    queryKey: ['pt-sessions', 'mine'],
    queryFn: async () => (await ptSessionApi.mine({ size: 5 })).data,
  })

  const mySubscription = useMemo(() => {
    const subs = subscriptions.data ?? []
    if (subs.length > 0) {
      return [...subs].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0]
    }
    return undefined
  }, [subscriptions.data])

  const nextBooking = useMemo(() => {
    const list = bookings.data?.content ?? []
    const upcoming = list
      .filter((b) => b.status !== 'CANCELLED' && new Date(b.startsAt) > new Date())
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    return upcoming[0]
  }, [bookings.data])

  const greetingName = profile?.fullName?.split(' ')[0] ?? ''

  return (
    <div>
      <PageHeader
        title={`${t('dashboard.greeting')}, ${greetingName} 👋`}
        subtitle={
          <Space wrap>
            {profile ? (
              <Tag color="orange" icon={<RiseOutlined />}>
                {t(`roles.${profile.roleName}`, profile.roleName)}
              </Tag>
            ) : null}
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        {/* Subscription card */}
        <Col xs={24} md={12} xl={8}>
          <Card style={{ height: '100%' }}>
            <Typography.Title level={5}>{t('dashboard.mySubscription')}</Typography.Title>
            {subscriptions.isLoading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : mySubscription ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Text strong style={{ fontSize: 16 }}>
                    {mySubscription.planName}
                  </Typography.Text>
                  <StatusTag status={mySubscription.status} />
                </div>
                <div style={{ marginTop: 8 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {t('subscription.end')}: {formatDateTime(mySubscription.endDate)}
                  </Typography.Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Typography.Text style={{ fontWeight: 700, color: '#ff6b2c', fontSize: 18 }}>
                    {formatMoney(mySubscription.price)}
                  </Typography.Text>
                </div>
              </div>
            ) : (
              <EmptyHint
                text={
                  <Space orientation="vertical" align="center">
                    <span>{t('dashboard.noSubscription')}</span>
                    <Link to="/plans">{t('dashboard.viewPlans')}</Link>
                  </Space>
                }
              />
            )}
          </Card>
        </Col>

        {/* Next class */}
        <Col xs={24} md={12} xl={8}>
          <Card style={{ height: '100%' }}>
            <Typography.Title level={5}>{t('dashboard.nextClass')}</Typography.Title>
            {bookings.isLoading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : nextBooking ? (
              <div>
                <Typography.Text strong style={{ fontSize: 16 }}>
                  {nextBooking.className}
                </Typography.Text>
                <div style={{ marginTop: 8 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {t('class.trainer')}: {nextBooking.trainerName}
                  </Typography.Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Space>
                    <CalendarOutlined style={{ color: '#ff6b2c' }} />
                    <Typography.Text>{formatDateTime(nextBooking.startsAt)}</Typography.Text>
                  </Space>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Link to="/classes">→ {t('class.title')}</Link>
                </div>
              </div>
            ) : (
              <EmptyHint
                text={
                  <Space orientation="vertical" align="center">
                    <span>{t('dashboard.noNextClass')}</span>
                    <Link to="/classes">{t('dashboard.bookClass')}</Link>
                  </Space>
                }
              />
            )}
          </Card>
        </Col>

        {/* Stats */}
        <Col xs={24} xl={8}>
          <div style={{ display: 'grid', gap: 12, height: '100%' }}>
            <StatCard
              label={t('dashboard.totalSpent')}
              value={formatMoney(
                (payments.data?.content ?? []).reduce((s, p) => s + (p.status === 'SUCCESS' ? p.amount : 0), 0),
              )}
              icon={<CreditCardOutlined />}
              tone={{ from: '#ff6b2c', to: '#e11d48' }}
            />
            <StatCard
              label={t('dashboard.bookingsCount')}
              value={bookings.data?.content?.filter((b) => b.status !== 'CANCELLED').length ?? 0}
              icon={<CalendarOutlined />}
              tone={{ from: '#38bdf8', to: '#6366f1' }}
            />
            <StatCard
              label={t('dashboard.ptSessionsCount')}
              value={pt.data?.totalElements ?? 0}
              icon={<DollarOutlined />}
              tone={{ from: '#22c55e', to: '#0d9488' }}
            />
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card
            title={t('dashboard.recentPayments')}
            extra={
              <Link to="/payments">
                {t('common.refresh')} <ArrowRightOutlined />
              </Link>
            }
          >
            {payments.isLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : (payments.data?.content ?? []).length === 0 ? (
              <EmptyHint text={t('common.empty')} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(payments.data?.content ?? []).map((p) => (
                  <div
                    key={p.id}
                    className="ant-list-item"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{p.method.replace('MOCK_', '')} · {formatMoney(p.amount)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(242,237,228,0.5)' }}>
                        {p.paidAt ? formatDateTime(p.paidAt) : '—'}
                      </div>
                    </div>
                    <StatusTag status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={t('dashboard.recentBookings')}
            extra={
              <Link to="/bookings">
                {t('common.refresh')} <ArrowRightOutlined />
              </Link>
            }
          >
            {bookings.isLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : (bookings.data?.content ?? []).length === 0 ? (
              <EmptyHint text={t('common.empty')} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(bookings.data?.content ?? [])
              .filter((b) => b.status !== 'CANCELLED')
              .map((b) => (
                  <div
                    key={b.id}
                    className="ant-list-item"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{b.className}</div>
                      <div style={{ fontSize: 12, color: 'rgba(242,237,228,0.5)' }}>
                        {b.trainerName} · {formatDateTime(b.startsAt)}
                      </div>
                    </div>
                    <StatusTag status={b.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {hasPermission('VIEW_REPORTS') ? (
        <Card style={{ marginTop: 16 }} title={t('dashboard.performance')}>
          <Link to="/reports">{t('dashboard.performance')} →</Link>
        </Card>
      ) : null}
    </div>
  )
}