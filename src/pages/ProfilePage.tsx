import { App, Button, Card, Form, Input, Skeleton, Space, Typography } from 'antd'
import { SaveOutlined, UserOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { userApi } from '../api/endpoints'
import { PageHeader } from '../components/common'
import { useI18n } from '../i18n'
import { getErrorMessage } from '../api/client'

export default function ProfilePage() {
  const { t, formatDate } = useI18n()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const me = useQuery({ queryKey: ['me'], queryFn: async () => (await userApi.me()).data })

  const update = useMutation({
    mutationFn: (v: { fullName: string; phoneNumber?: string }) => userApi.updateMe(v),
    onSuccess: () => {
      message.success(t('profile.updateSuccess'))
      me.refetch()
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  return (
    <div>
      <PageHeader title={t('profile.title')} />
      <Card style={{ maxWidth: 600 }}>
        {me.isLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (
          <>
            <Space style={{ marginBottom: 16 }}>
              <UserOutlined style={{ fontSize: 40, color: '#ff6b2c' }} />
              <div>
                <Typography.Title level={5} style={{ margin: 0 }}>{me.data?.fullName}</Typography.Title>
                <Typography.Text type="secondary">
                  {me.data?.roleName} · {t('profile.memberSince')} {me.data ? formatDate(me.data.createdDate) : ''}
                </Typography.Text>
              </div>
            </Space>
            <Form
              form={form}
              layout="vertical"
              initialValues={{ fullName: me.data?.fullName, phoneNumber: me.data?.phoneNumber }}
              onFinish={(v) => update.mutate({ fullName: v.fullName, phoneNumber: v.phoneNumber || undefined })}
            >
              <Form.Item name="fullName" label={t('auth.fullName')} rules={[{ required: true, message: t('common.required') }]}>
                <Input />
              </Form.Item>
              <Form.Item name="phoneNumber" label={t('auth.phoneNumber')}>
                <Input />
              </Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={update.isPending}>
                {t('profile.update')}
              </Button>
            </Form>
          </>
        )}
      </Card>
    </div>
  )
}