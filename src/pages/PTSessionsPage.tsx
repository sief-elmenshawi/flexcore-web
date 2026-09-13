import { useState } from 'react'
import { App, Avatar, Button, Card, Col, DatePicker, Form, InputNumber, Modal, Row, Select, Skeleton } from 'antd'
import { FieldTimeOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ptSessionApi, userApi } from '../api/endpoints'
import { StatusTag } from '../components/StatusTag'
import { PageHeader } from '../components/common'
import { useI18n } from '../i18n'
import { useAuth } from '../auth/AuthContext'
import { getErrorMessage } from '../api/client'

export default function PTSessionsPage() {
  const { t, formatDateTime } = useI18n()
  const { profile, hasPermission } = useAuth()
  const { modal, message } = App.useApp()
  const qc = useQueryClient()
  const can = hasPermission
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const sessions = useQuery({
    queryKey: ['pt-sessions', 'mine'],
    queryFn: async () => (await ptSessionApi.mine({ size: 50 })).data,
  })

  const trainers = useQuery({
    queryKey: ['trainers-list'],
    queryFn: async () => {
      const { data } = await userApi.trainers({ size: 200 })
      return Array.isArray(data.content) ? data.content : []
    },
  })

  const book = useMutation({
    mutationFn: (v: { trainerId: number; scheduledAt: string; durationMinutes?: number }) =>
      ptSessionApi.create(v),
    onSuccess: () => {
      message.success(t('pt.bookSuccess'))
      qc.invalidateQueries({ queryKey: ['pt-sessions'] })
      setOpen(false)
      form.resetFields()
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const cancelSession = useMutation({
    mutationFn: (id: number) => ptSessionApi.cancel(id),
    onSuccess: () => {
      message.success(t('subscription.cancelSuccess'))
      qc.invalidateQueries({ queryKey: ['pt-sessions'] })
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const purgeSession = useMutation({
    mutationFn: (id: number) => ptSessionApi.purge(id),
    onSuccess: () => {
      message.success(t('pt.purgeSuccess'))
      qc.invalidateQueries({ queryKey: ['pt-sessions'] })
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  return (
    <div>
      <PageHeader
        title={t('nav.ptSessions')}
        subtitle={profile?.roleName === 'TRAINER' ? t('roles.TRAINER') : undefined}
        extra={
          can('BOOK_CLASS') ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
              {t('pt.book')}
            </Button>
          ) : null
        }
      />
{sessions.isLoading ? (
        <Card><Skeleton active paragraph={{ rows: 8 }} /></Card>
      ) : (
        <Row gutter={[16, 16]}>
          {(sessions.data?.content ?? []).map((s) => (
            <Col xs={24} sm={12} lg={8} key={s.id}>
              <Card styles={{ body: { padding: 16 } }} style={{ height: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar style={{ background: 'rgba(255,107,44,0.18)', color: '#ff6b2c', fontWeight: 700 }}>
                      {(profile?.roleName === 'TRAINER' ? s.memberName : s.trainerName).charAt(0)}
                    </Avatar>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {profile?.roleName === 'TRAINER' ? s.memberName : s.trainerName}
                      </div>
                      <StatusTag status={s.status} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, opacity: 0.75 }}>
                    <UserOutlined style={{ color: '#ff6b2c' }} />
                    <span>
                      {profile?.roleName === 'TRAINER' ? s.trainerName : t('pt.member').replace('{name}', s.memberName)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, opacity: 0.75 }}>
                    <FieldTimeOutlined style={{ color: '#ff6b2c' }} />
                    <span>
                      {formatDateTime(s.scheduledAt)} · {s.durationMinutes} {t('class.minutes')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    {s.status === 'SCHEDULED' ? (
                      <Button
                        danger
                        size="small"
                        onClick={() =>
                          modal.confirm({ title: t('pt.cancelConfirm'), onOk: () => cancelSession.mutate(s.id) })
                        }
                        loading={cancelSession.isPending && cancelSession.variables === s.id}
                      >
                        {t('common.cancel')}
                      </Button>
                    ) : null}
                    {s.status === 'CANCELLED' ? (
                      <Button
                        danger
                        size="small"
                        onClick={() =>
                          modal.confirm({ title: t('pt.purgeConfirm'), onOk: () => purgeSession.mutate(s.id) })
                        }
                        loading={purgeSession.isPending && purgeSession.variables === s.id}
                      >
                        {t('pt.deletePermanent')}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        open={open}
        title={t('pt.book')}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={book.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) =>
            book.mutate({
              trainerId: values.trainerId,
              scheduledAt: values.scheduledAt.toISOString(),
              durationMinutes: values.durationMinutes ?? 60,
            })
          }
        >
          <Form.Item name="trainerId" label={t('class.trainer')} rules={[{ required: true, message: t('common.required') }]}>
            <Select
              options={(trainers.data ?? []).map((u) => ({ value: u.id, label: `${u.fullName} (${u.roleName})` }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="scheduledAt" label={t('pt.schedule')} rules={[{ required: true, message: t('common.required') }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="durationMinutes" label={`${t('pt.durationMinutes')} (${t('class.minutes')})`} initialValue={60}>
            <InputNumber min={30} max={120} step={15} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}