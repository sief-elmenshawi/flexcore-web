import { App, Avatar, Button, Card, Col, Row, Skeleton } from 'antd'
import { CalendarOutlined, FieldTimeOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bookingApi } from '../api/endpoints'
import type { GymClassResponse } from '../api/types'
import { StatusTag } from '../components/StatusTag'
import { PageHeader } from '../components/common'
import { useI18n } from '../i18n'
import { getErrorMessage } from '../api/client'

export default function BookingsPage() {
  const { t, formatDateTime } = useI18n()
  const { modal, message } = App.useApp()
  const qc = useQueryClient()
  const bookings = useQuery({ queryKey: ['bookings', 'my'], queryFn: async () => (await bookingApi.my({ size: 50 })).data })

  const cancelBooking = useMutation({
    mutationFn: (id: number) => bookingApi.cancel(id),
    onSuccess: (_data, id) => {
      message.success(t('subscription.cancelSuccess'))
      const booking = bookings.data?.content.find((b) => b.id === id)
      if (booking) {
        qc.setQueriesData({ queryKey: ['classes'] }, (old) => {
          const page = old as { content?: GymClassResponse[] } | undefined
          if (!page?.content) return old
          return {
            ...page,
            content: page.content.map((c) =>
              c.id === booking.classId
                ? {
                    ...c,
                    bookedCount: Math.max(0, c.bookedCount - 1),
                    availableSpots: c.availableSpots + 1,
                  }
                : c,
            ),
          }
        })
      }
      qc.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const purgeBooking = useMutation({
    mutationFn: (id: number) => bookingApi.purge(id),
    onSuccess: () => {
      message.success(t('class.purgeBookingSuccess'))
      qc.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  return (
    <div>
      <PageHeader title={t('nav.myBookings')} subtitle={`${bookings.data?.totalElements ?? 0} ${t('common.result')}`} />
      {bookings.isLoading ? (
        <Card><Skeleton active paragraph={{ rows: 8 }} /></Card>
      ) : (
        <Row gutter={[16, 16]}>
          {(bookings.data?.content ?? []).map((b) => (
            <Col xs={24} sm={12} lg={8} key={b.id}>
              <Card styles={{ body: { padding: 16 } }} style={{ height: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar style={{ background: 'rgba(255,107,44,0.18)', color: '#ff6b2c', fontWeight: 700 }}>
                      {b.className.charAt(0)}
                    </Avatar>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.className}
                      </div>
                      <StatusTag status={b.status} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, opacity: 0.75 }}>
                    <CalendarOutlined style={{ color: '#ff6b2c' }} />
                    <span>{formatDateTime(b.startsAt)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, opacity: 0.75 }}>
                    <FieldTimeOutlined style={{ color: '#ff6b2c' }} />
                    <span>{b.trainerName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    {b.status === 'CONFIRMED' ? (
                      <Button
                        danger
                        size="small"
                        onClick={() =>
                          modal.confirm({ title: t('class.cancelConfirm'), onOk: () => cancelBooking.mutate(b.id) })
                        }
                        loading={cancelBooking.isPending && cancelBooking.variables === b.id}
                      >
                        {t('class.cancelBooking')}
                      </Button>
                    ) : null}
                    {b.status === 'CANCELLED' ? (
                      <Button
                        danger
                        size="small"
                        onClick={() =>
                          modal.confirm({ title: t('class.purgeBookingConfirm'), onOk: () => purgeBooking.mutate(b.id) })
                        }
                        loading={purgeBooking.isPending && purgeBooking.variables === b.id}
                      >
                        {t('class.purgeBooking')}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}