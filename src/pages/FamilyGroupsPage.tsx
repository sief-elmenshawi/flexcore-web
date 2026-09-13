import { useState } from 'react'
import { App, Button, Card, Col, Form, InputNumber, Modal, Row, Select, Skeleton, Space, Typography } from 'antd'
import { PlusOutlined, TeamOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { familyGroupApi, planApi } from '../api/endpoints'
import { PageHeader } from '../components/common'
import { useI18n } from '../i18n'
import { getErrorMessage } from '../api/client'

export default function FamilyGroupsPage() {
  const { t } = useI18n()
  const { modal, message } = App.useApp()
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [addTo, setAddTo] = useState<{ id: number; ownerName: string } | null>(null)
  const [form] = Form.useForm()
  const [memberForm] = Form.useForm()

  const groups = useQuery({
    queryKey: ['family-groups'],
    queryFn: async () => (await familyGroupApi.my()).data,
  })
  const plans = useQuery({ queryKey: ['plans'], queryFn: async () => (await planApi.list()).data })

  const create = useMutation({
    mutationFn: (planId: number) => familyGroupApi.create({ planId }),
    onSuccess: () => {
      message.success(t('family.memberAdded'))
      qc.invalidateQueries({ queryKey: ['family-groups'] })
      setCreateOpen(false)
      form.resetFields()
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const addMember = useMutation({
    mutationFn: (v: { groupId: number; userId: number }) => familyGroupApi.addMember(v.groupId, { userId: v.userId }),
    onSuccess: () => {
      message.success(t('family.memberAdded'))
      qc.invalidateQueries({ queryKey: ['family-groups'] })
      setAddTo(null)
      memberForm.resetFields()
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const purge = useMutation({
    mutationFn: (id: number) => familyGroupApi.purge(id),
    onSuccess: () => {
      message.success(t('family.deleteGroupSuccess'))
      qc.invalidateQueries({ queryKey: ['family-groups'] })
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const familyPlans = (plans.data ?? []).filter((p) => p.familyPlan)

  return (
    <div>
      <PageHeader
        title={t('family.title')}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            {t('common.create')}
          </Button>
        }
      />
      {groups.isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <Row gutter={[16, 16]}>
          {(groups.data ?? []).map((g) => (
            <Col xs={24} md={12} key={g.id}>
<Card style={{ height: '100%' }}>
                <div
                  style={{
                    height: 4,
                    margin: '-16px -16px 12px',
                    background: 'linear-gradient(90deg, #ff6b2c, #ff9a44)',
                    borderRadius: '16px 16px 0 0',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: 'rgba(255,107,44,0.15)',
                      color: '#ff6b2c',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    <TeamOutlined />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      {g.planName}
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {t('family.owner')}: {g.ownerName}
                    </Typography.Text>
                  </div>
                </div>
                <Space wrap size={[6, 6]} style={{ marginBottom: 12 }}>
                  <Typography.Text style={{ fontSize: 12, padding: '2px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
                    {t('family.members')}: {g.maxMembers ?? '∞'}
                  </Typography.Text>
                </Space>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="primary" ghost onClick={() => setAddTo({ id: g.id, ownerName: g.ownerName })}>
                    {t('family.addMember')}
                  </Button>
                  <Button
                    danger
                    onClick={() =>
                      modal.confirm({ title: t('family.deleteGroupConfirm'), onOk: () => purge.mutate(g.id) })
                    }
                    loading={purge.isPending && purge.variables === g.id}
                  >
                    {t('family.deleteGroup')}
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
          {(groups.data ?? []).length === 0 && (
            <Col span={24}><Card><Typography.Text type="secondary">{t('common.empty')}</Typography.Text></Card></Col>
          )}
        </Row>
      )}

      <Modal
        open={createOpen}
        title={t('family.title')}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={create.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => create.mutate(v.planId)}>
          <Form.Item name="planId" label={t('family.plan')} rules={[{ required: true, message: t('common.required') }]}>
            <Select
              options={familyPlans.map((p) => ({ value: p.id, label: `${p.name} (${p.maxFamilyMembers} ${t('family.maxMembers')})` }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={!!addTo}
        title={`${t('family.addMember')} — ${addTo?.ownerName}`}
        onCancel={() => setAddTo(null)}
        onOk={() => memberForm.submit()}
        confirmLoading={addMember.isPending}
      >
        <Form form={memberForm} layout="vertical" onFinish={(v) => addMember.mutate({ groupId: addTo!.id, userId: v.userId })}>
          <Form.Item name="userId" label={t('family.memberId')} rules={[{ required: true, message: t('common.required') }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}