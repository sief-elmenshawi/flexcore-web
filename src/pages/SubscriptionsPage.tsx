import { useMemo, useState } from 'react'
import { Alert, App, Button, Card, Col, Form, InputNumber, Modal, Radio, Row, Space, Skeleton, Spin, Typography } from 'antd'
import { CreditCardOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentApi, subscriptionApi } from '../api/endpoints'
import type { PaymentMethod, SubscriptionResponse } from '../api/types'
import { StatusTag } from '../components/StatusTag'
import { PageHeader } from '../components/common'
import { useI18n } from '../i18n'
import { getErrorMessage } from '../api/client'

const methods: { value: PaymentMethod; label: string }[] = [
  { value: 'MOCK_FAWRY', label: 'Fawry' },
  { value: 'MOCK_INSTAPAY', label: 'InstaPay' },
  { value: 'MOCK_VODAFONE_CASH', label: 'Vodafone Cash' },
]

export default function SubscriptionsPage() {
  const { t, formatMoney, formatDateTime } = useI18n()
  const { modal, message } = App.useApp()
  const qc = useQueryClient()
  const subs = useQuery({ queryKey: ['subscriptions', 'my'], queryFn: async () => (await subscriptionApi.my()).data })

  const [freezeTarget, setFreezeTarget] = useState<SubscriptionResponse | null>(null)
  const [paymentTarget, setPaymentTarget] = useState<SubscriptionResponse | null>(null)
  const [payMethod, setPayMethod] = useState<PaymentMethod>('MOCK_FAWRY')
  const [form] = Form.useForm()

  const hasExpired = useMemo(() => (subs.data ?? []).some((s) => s.status === 'EXPIRED'), [subs.data])

  const freeze = useMutation({
    mutationFn: (v: { id: number; days: number }) => subscriptionApi.freeze(v.id, { days: v.days }),
    onSuccess: () => {
      message.success(t('subscription.freezeSuccess'))
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
      setFreezeTarget(null)
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const unfreeze = useMutation({
    mutationFn: (id: number) => subscriptionApi.unfreeze(id),
    onSuccess: () => {
      message.success(t('subscription.unfreezeSuccess'))
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const cancel = useMutation({
    mutationFn: (id: number) => subscriptionApi.cancel(id),
    onSuccess: () => {
      message.success(t('subscription.cancelSuccess'))
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const reactivate = useMutation({
    mutationFn: (id: number) => subscriptionApi.reactivate(id),
    onSuccess: () => {
      message.success(t('subscription.reactivateSuccess'))
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const purge = useMutation({
    mutationFn: (id: number) => subscriptionApi.purge(id),
    onSuccess: () => {
      message.success(t('subscription.purgeSuccess'))
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const pay = useMutation({
    mutationFn: (v: { subscriptionId: number; method: PaymentMethod; key: string }) =>
      paymentApi.initiate({ subscriptionId: v.subscriptionId, method: v.method }, v.key),
    onSuccess: async (res) => {
      switch (res.data.status) {
        case 'SUCCESS':
          message.success(t('payment.success'))
          break
        case 'FAILED':
          message.error(t('payment.failed'))
          break
        default:
          message.info(t('payment.pending'))
      }
      setPaymentTarget(null)
      await qc.invalidateQueries({ queryKey: ['subscriptions'] })
      await qc.invalidateQueries({ queryKey: ['payments'] })
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const runPayment = () => {
    if (!paymentTarget) return
    const key = crypto.randomUUID()
    pay.mutate({ subscriptionId: paymentTarget.id, method: payMethod, key })
  }

  return (
    <div>
      <PageHeader title={t('nav.mySubscriptions')} />

      {hasExpired ? (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          title={t('subscription.expiredHint')}
        />
      ) : null}

      {subs.isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <Row gutter={[16, 16]}>
          {(subs.data ?? []).map((s) => (
            <Col xs={24} md={12} key={s.id}>
              <Card style={{ height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    {s.planName}
                  </Typography.Title>
                  <StatusTag status={s.status} />
                </div>
                <Space orientation="vertical" size={2}>
                  <Typography.Text type="secondary">
                    {t('subscription.start')}: {formatDateTime(s.startDate)}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    {t('subscription.end')}: {formatDateTime(s.endDate)}
                  </Typography.Text>
                  {s.frozenUntil ? (
                    <Typography.Text style={{ color: '#177ddc' }}>
                      {t('subscription.frozenUntil')}: {formatDateTime(s.frozenUntil)}
                    </Typography.Text>
                  ) : null}
                  <div style={{ fontWeight: 700, color: '#ff6b2c', fontSize: 18, marginTop: 4 }}>
                    {formatMoney(s.price)}
                  </div>
                </Space>
                <Space style={{ marginTop: 12 }}>
                  {s.status === 'ACTIVE' ? (
                    <Button onClick={() => { setFreezeTarget(s); form.resetFields() }}>
                      {t('subscription.freeze')}
                    </Button>
                  ) : null}
                  {s.status === 'FROZEN' ? (
                    <Button type="primary" ghost onClick={() => unfreeze.mutate(s.id)} loading={unfreeze.isPending}>
                      {t('subscription.unfreeze')}
                    </Button>
                  ) : null}
                  {s.status === 'EXPIRED' ? (
                    <Button
                      type="primary"
                      icon={<CreditCardOutlined />}
                      onClick={() => {
                        setPaymentTarget(s)
                        setPayMethod('MOCK_FAWRY')
                      }}
                    >
                      {t('subscription.renewFor')}
                    </Button>
                  ) : null}
                  {['ACTIVE', 'FROZEN'].includes(s.status) ? (
                    <Button danger onClick={() => cancel.mutate(s.id)} loading={cancel.isPending}>
                      {t('subscription.cancel')}
                    </Button>
                  ) : null}
                  {s.status === 'CANCELLED' ? (
                    <>
                      <Button type="primary" ghost onClick={() => reactivate.mutate(s.id)} loading={reactivate.isPending}>
                        {t('subscription.reactivate')}
                      </Button>
                      <Button
                        danger
                        onClick={() =>
                          modal.confirm({ title: t('subscription.purgeConfirm'), onOk: () => purge.mutate(s.id) })
                        }
                      >
                        {t('subscription.deletePermanent')}
                      </Button>
                    </>
                  ) : null}
                </Space>
              </Card>
            </Col>
          ))}
          {(subs.data ?? []).length === 0 && (
            <Col span={24}>
              <Card>
                <Typography.Text type="secondary">{t('common.empty')}</Typography.Text>
              </Card>
            </Col>
          )}
        </Row>
      )}

      <Modal open={!!freezeTarget} title={t('subscription.freeze')} onCancel={() => setFreezeTarget(null)} footer={
        <Button type="primary" loading={freeze.isPending} onClick={() => form.submit()}>
          {t('common.confirm')}
        </Button>
      }>
        <Form form={form} layout="vertical" onFinish={(v) => freeze.mutate({ id: freezeTarget!.id, days: v.days })}>
          <Form.Item name="days" label={t('subscription.freezeDays')} rules={[{ required: true, message: t('common.required') }]}>
            <InputNumber min={1} max={60} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={!!paymentTarget}
        title={`${t('payment.title')} — ${paymentTarget?.planName}`}
        onCancel={() => setPaymentTarget(null)}
        footer={
          <Button type="primary" icon={<CreditCardOutlined />} loading={pay.isPending} onClick={runPayment}>
            {pay.isPending ? t('payment.processing') : t('payment.payNow')}
          </Button>
        }
      >
        {pay.isPending ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin size="large" />
            <div style={{ marginTop: 12 }}>{t('payment.processing')}</div>
          </div>
        ) : (
          <div>
            <Space orientation="vertical" size={4} style={{ width: '100%' }}>
              <Typography.Text type="secondary">{t('payment.amount')}</Typography.Text>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#ff6b2c' }}>
                {paymentTarget ? formatMoney(paymentTarget.price) : ''}
              </div>
            </Space>
            <div style={{ marginTop: 16 }}>
              <Typography.Text type="secondary">{t('payment.chooseMethod')}</Typography.Text>
              <Radio.Group
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}
                optionType="button"
                buttonStyle="solid"
                options={methods}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}