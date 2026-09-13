import { useState } from 'react'
import { App, Button, Card, Col, Form, Input, InputNumber, Modal, Radio, Row, Space, Skeleton, Typography } from 'antd'
import { CheckOutlined, EditOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentApi, planApi, subscriptionApi } from '../api/endpoints'
import type { PaymentMethod, SubscriptionPlanResponse } from '../api/types'
import { PageHeader } from '../components/common'
import { useI18n } from '../i18n'
import { useAuth } from '../auth/AuthContext'
import { getErrorMessage } from '../api/client'

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'MOCK_FAWRY', label: 'Fawry' },
  { value: 'MOCK_INSTAPAY', label: 'InstaPay' },
  { value: 'MOCK_VODAFONE_CASH', label: 'Vodafone Cash' },
]

export default function PlansPage() {
  const { t, formatMoney } = useI18n()
  const { hasPermission } = useAuth()
  const { message } = App.useApp()
  const qc = useQueryClient()
  const canManage = hasPermission('MANAGE_SUBSCRIPTIONS')

  const plans = useQuery({ queryKey: ['plans'], queryFn: async () => (await planApi.list()).data })
  const [purchaseTarget, setPurchaseTarget] = useState<SubscriptionPlanResponse | null>(null)
  const [payMethod, setPayMethod] = useState<PaymentMethod>('MOCK_FAWRY')
  const [editing, setEditing] = useState<SubscriptionPlanResponse | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const [form] = Form.useForm()

  const buy = useMutation({
    mutationFn: async (planId: number): Promise<void> => {
      const { data: sub } = await subscriptionApi.purchase({ planId })
      const key = crypto.randomUUID()
      const { data: payment } = await paymentApi.initiate(
        { subscriptionId: sub.id, method: payMethod },
        key,
      )
      if (payment.status === 'FAILED') {
        throw new Error('error.payment.failed')
      }
    },
    onSuccess: () => {
      message.success(t('subscription.purchaseSuccess'))
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setPurchaseTarget(null)
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const savePlan = useMutation({
    mutationFn: (values: {
      name: string
      price: number
      durationInDays: number
      maxFamilyMembers?: number | null
    }) => (editing ? planApi.update(editing.id, values) : planApi.create(values)),
    onSuccess: () => {
      message.success(editing ? t('class.updateSuccess') : 'Plan created')
      qc.invalidateQueries({ queryKey: ['plans'] })
      setCreateOpen(false)
      setEditing(null)
      form.resetFields()
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  return (
    <div>
      <PageHeader
        title={t('plans.title')}
        subtitle={t('plans.subtitle')}
        extra={
          canManage ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null)
                form.resetFields()
                setCreateOpen(true)
              }}
            >
              {t('common.create')}
            </Button>
          ) : null
        }
      />

      {plans.isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <Row gutter={[16, 16]}>
          {(plans.data ?? []).map((plan) => (
            <Col xs={24} sm={12} lg={8} key={plan.id}>
              <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography.Title level={5} style={{ marginBottom: 4 }}>
                  {plan.name}
                </Typography.Title>
                <Typography.Text type="secondary">
                  {plan.durationInDays} {t('plans.durationDays')}
                  {plan.familyPlan && plan.maxFamilyMembers
                    ? ` · ${t('plans.familyMembers')}: ${plan.maxFamilyMembers}`
                    : ''}
                </Typography.Text>
                <div style={{ margin: '16px 0', fontSize: 28, fontWeight: 800, color: '#ff6b2c' }}>
                  {formatMoney(plan.price)}
                </div>
                <div style={{ flex: 1 }}>
                  <Space orientation="vertical" size={4}>
                    <Space>
                      <CheckOutlined style={{ color: '#52c41a' }} />
                      <Typography.Text>{plan.durationInDays} {t('plans.durationDays')}</Typography.Text>
                    </Space>
                    {plan.familyPlan ? (
                      <Space>
                        <CheckOutlined style={{ color: '#52c41a' }} />
                        <Typography.Text>Family: {plan.maxFamilyMembers ?? 0}</Typography.Text>
                      </Space>
                    ) : null}
                  </Space>
                </div>
                <Space style={{ marginTop: 16 }}>
                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    disabled={buy.isPending}
                    loading={buy.isPending && purchaseTarget?.id === plan.id}
                    onClick={() => setPurchaseTarget(plan)}
                  >
                    {t('common.buy')}
                  </Button>
                  {canManage ? (
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => {
                        setEditing(plan)
                        form.setFieldsValue({
                          name: plan.name,
                          price: plan.price,
                          durationInDays: plan.durationInDays,
                          maxFamilyMembers: plan.maxFamilyMembers,
                        })
                        setCreateOpen(true)
                      }}
                    />
                  ) : null}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Purchase modal */}
      <Modal
        open={!!purchaseTarget}
        title={`${purchaseTarget?.name} — ${purchaseTarget ? formatMoney(purchaseTarget.price) : ''}`}
        onCancel={() => setPurchaseTarget(null)}
        footer={
          <Button
            type="primary"
            loading={buy.isPending}
            onClick={() => purchaseTarget && buy.mutate(purchaseTarget.id)}
          >
            {t('common.confirm')}
          </Button>
        }
      >
        <Typography.Paragraph>
          {purchaseTarget?.durationInDays} {t('plans.durationDays')}
        </Typography.Paragraph>
        {purchaseTarget?.familyPlan ? (
          <Typography.Text type="secondary">
            {t('plans.familyMembers')}: {purchaseTarget.maxFamilyMembers ?? 0}
          </Typography.Text>
        ) : null}
        <Form layout="vertical">
          <Form.Item label={t('subscription.paymentMethod')}>
            <Radio.Group
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              options={paymentMethods.map((m) => ({ label: m.label, value: m.value }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create/Edit modal */}
      <Modal
        open={createOpen}
        title={editing ? `${t('common.edit')} ${editing.name}` : t('common.create')}
        onCancel={() => {
          setCreateOpen(false)
          setEditing(null)
        }}
        onOk={() => form.submit()}
        confirmLoading={savePlan.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => savePlan.mutate(v)}>
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true, message: t('common.required') }]}>
            <Input />
          </Form.Item>
          <Form.Item name="price" label={t('common.price')} rules={[{ required: true, message: t('common.required') }]}>
            <Space.Compact style={{ width: '100%' }}>
              <InputNumber min={1} style={{ width: '100%' }} />
              <div
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  padding: '0 12px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '0 8px 8px 0',
                  color: 'rgba(242,237,228,0.6)',
                  fontSize: 14,
                }}
              >
                {t('common.currency')}
              </div>
            </Space.Compact>
          </Form.Item>
          <Form.Item
            name="durationInDays"
            label={t('plans.durationDays')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="maxFamilyMembers" label={`${t('plans.familyMembers')} (0/blank = not family)`}>
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}