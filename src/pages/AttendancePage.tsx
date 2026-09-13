import { useState } from 'react'
import { Alert, App, Button, Card, Form, InputNumber, Select, Skeleton, Space, Typography } from 'antd'
import { CheckCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { attendanceApi, userApi } from '../api/endpoints'
import { PageHeader } from '../components/common'
import { useI18n } from '../i18n'
import { useAuth } from '../auth/AuthContext'
import { getErrorMessage } from '../api/client'

export default function AttendancePage() {
  const { t, formatDateTime } = useI18n()
  const { hasPermission } = useAuth()
  const { message } = App.useApp()
  const qc = useQueryClient()
  const canCheckIn = hasPermission('CHECK_IN_MEMBER')
  const [form] = Form.useForm()
  const [checkedInName, setCheckedInName] = useState<string | null>(null)
  const [memberId, setMemberId] = useState<number | undefined>(undefined)

  const history = useQuery({
    queryKey: ['attendance', memberId],
    queryFn: async () => (await attendanceApi.history({ size: 100, ...(memberId ? { userId: memberId } : {}) })).data,
    enabled: memberId !== undefined,
  })

  const members = useQuery({
    queryKey: ['members-list'],
    queryFn: async () => {
      const { data } = await userApi.members({ size: 200 })
      return Array.isArray(data.content) ? data.content : []
    },
    enabled: canCheckIn,
  })

  const checkIn = useMutation({
    mutationFn: (userId: number) => attendanceApi.checkIn({ userId }),
    onSuccess: (res) => {
      message.success(t('attendance.success'))
      setCheckedInName(res.data.userName)
      qc.invalidateQueries({ queryKey: ['attendance'] })
      form.resetFields()
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  return (
    <div>
      <PageHeader title={t('attendance.title')} />

      {canCheckIn && (
        <Card title={<Space><CheckCircleOutlined />{t('attendance.checkInMember')}</Space>} style={{ marginBottom: 16 }}>
          {checkedInName && (
            <Alert
              style={{ marginBottom: 12 }}
              type="success"
              showIcon
              title={`${t('attendance.by')}: ${checkedInName}`}
              closable
              onClose={() => setCheckedInName(null)}
            />
          )}
          <Form
            form={form}
            layout="inline"
            onFinish={(v) => checkIn.mutate(v.userId)}
          >
            <Form.Item name="userId" label={t('attendance.memberId')} rules={[{ required: true, message: t('common.required') }]}>
              <InputNumber min={1} style={{ width: 200 }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={checkIn.isPending}>
              {t('attendance.checkIn')}
            </Button>
          </Form>
        </Card>
      )}

      <Card title={t('attendance.history')}>
        {canCheckIn ? (
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={t('attendance.memberId')}
            style={{ width: 280, marginBottom: 12 }}
            options={(members.data ?? []).map((m) => ({
              value: m.id,
              label: `${m.fullName} (${m.email})`,
            }))}
            value={memberId}
            onChange={(v) => setMemberId(v)}
          />
        ) : null}
        {!memberId ? (
          <Typography.Text type="secondary">{t('attendance.selectMemberHint')}</Typography.Text>
        ) : history.isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(history.data?.content ?? []).map((a) => (
              <div
                key={a.id}
                className="ant-list-item"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{a.userName}</div>
                  <Space>
                    <Typography.Text type="secondary">
                      {t('attendance.checkInTime')}: {formatDateTime(a.checkInAt)}
                    </Typography.Text>
                  </Space>
                </div>
                <Typography.Text type="secondary">
                  {t('attendance.by')}: {a.checkedInByName}
                </Typography.Text>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}