import { useState } from 'react'
import { App, Avatar, Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { roleApi, userApi } from '../api/endpoints'
import type { UserResponse } from '../api/types'
import { PageHeader } from '../components/common'
import { useI18n } from '../i18n'
import { getErrorMessage } from '../api/client'

export default function AdminUsersPage() {
  const { t, formatDate } = useI18n()
  const { modal, message } = App.useApp()
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form] = Form.useForm()

  const users = useQuery({
    queryKey: ['users', page],
    queryFn: async () => (await userApi.list({ page, size: 20, sort: 'id,desc' })).data,
  })
  const roles = useQuery({ queryKey: ['roles'], queryFn: async () => (await roleApi.list()).data })

  const createUser = useMutation({
    mutationFn: (v: {
      fullName: string
      email: string
      password: string
      phoneNumber?: string
      roleId: number
    }) => userApi.create(v),
    onSuccess: () => {
      message.success(t('adminUsers.createSuccess'))
      qc.invalidateQueries({ queryKey: ['users'] })
      setCreateOpen(false)
      form.resetFields()
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const updateUser = useMutation({
    mutationFn: (v: { id: number; fullName: string; phoneNumber?: string }) =>
      userApi.update(v.id, { fullName: v.fullName, phoneNumber: v.phoneNumber }),
    onSuccess: () => {
      message.success(t('adminUsers.updateSuccess'))
      qc.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const deactivate = useMutation({
    mutationFn: (id: number) => userApi.remove(id),
    onSuccess: () => {
      message.success(t('adminUsers.deactivateSuccess'))
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const rows = users.data?.content ?? []

  return (
    <div>
      <PageHeader
        title={t('adminUsers.title')}
        subtitle={`${users.data?.totalElements ?? 0} ${t('common.result')}`}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => qc.invalidateQueries({ queryKey: ['users'] })} />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingUser(null)
                form.resetFields()
                setCreateOpen(true)
              }}
            >
              {t('adminUsers.addUser')}
            </Button>
          </Space>
        }
      />

      <Card>
        <Table
          rowKey="id"
          loading={users.isLoading}
          dataSource={rows}
          pagination={{
            current: page + 1,
            pageSize: 20,
            total: users.data?.totalElements,
            onChange: (p) => setPage(p - 1),
          }}
          columns={[
            {
              title: t('common.name'),
              dataIndex: 'fullName',
              render: (v: string, r) => (
                <Space>
                  <Avatar style={{ background: '#ff6b2c' }}>{v.charAt(0)}</Avatar>
                  <div>
                    <div>{v}</div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Typography.Text>
                  </div>
                </Space>
              ),
            },
            { title: t('common.role'), dataIndex: 'roleName', render: (v: string) => <Tag color="orange">{t(`roles.${v}`, v)}</Tag> },
            { title: t('auth.phoneNumber'), dataIndex: 'phoneNumber', render: (v: string) => v || '—' },
            { title: t('adminUsers.created'), dataIndex: 'createdDate', render: (v: string) => formatDate(v) },
            {
              title: t('common.status'),
              dataIndex: 'active',
              render: (v: boolean) => (v ? <Tag color="green">{t('common.active')}</Tag> : <Tag color="red">—</Tag>),
            },
            {
              title: t('common.actions'),
              render: (_, r) => (
                <Space>
                  <Button
                    onClick={() => {
                      setEditingUser(r)
                      form.setFieldsValue({ fullName: r.fullName, phoneNumber: r.phoneNumber ?? '' })
                      setCreateOpen(true)
                    }}
                  >
                    {t('common.edit')}
                  </Button>
                  {r.active ? (
                    <Button
                      danger
                      onClick={() =>
                        modal.confirm({ title: t('adminUsers.deactivateConfirm'), onOk: () => deactivate.mutate(r.id) })
                      }
                    >
                      {t('adminUsers.deactivate')}
                    </Button>
                  ) : null}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={createOpen}
        title={editingUser ? t('adminUsers.editUser') : t('adminUsers.addUser')}
        onCancel={() => {
          setCreateOpen(false)
          setEditingUser(null)
        }}
        onOk={() => form.submit()}
        confirmLoading={editingUser ? updateUser.isPending : createUser.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => {
            if (editingUser) {
              updateUser.mutate({ id: editingUser.id, fullName: v.fullName, phoneNumber: v.phoneNumber || undefined })
            } else {
              createUser.mutate(v)
            }
          }}
        >
          <Form.Item name="fullName" label={t('auth.fullName')} rules={[{ required: true, message: t('common.required') }]}>
            <Input />
          </Form.Item>
          {!editingUser && (
            <>
              <Form.Item
                name="email"
                label={t('auth.email')}
                rules={[{ required: true, message: t('common.required') }, { type: 'email', message: t('errors.validation') }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="password"
                label={t('auth.password')}
                rules={[{ required: true, message: t('common.required') }, { min: 8, message: t('auth.passwordHint') }]}
              >
                <Input.Password />
              </Form.Item>
            </>
          )}
          {!editingUser && (
            <Form.Item name="roleId" label={t('common.role')} rules={[{ required: true, message: t('common.required') }]}>
              <Select
                options={(roles.data ?? []).map((r) => ({ value: r.id, label: r.name }))}
                placeholder={t('adminUsers.selectRole')}
              />
            </Form.Item>
          )}
          <Form.Item name="phoneNumber" label={t('auth.phoneNumber')}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}