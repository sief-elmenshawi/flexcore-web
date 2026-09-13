import { useState } from 'react'
import { App, Button, Card, Form, Input, Modal, Select, Space, Tag, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { roleApi } from '../api/endpoints'
import type { RoleResponse } from '../api/types'
import { PageHeader } from '../components/common'
import { useI18n } from '../i18n'
import { getErrorMessage } from '../api/client'

export default function AdminRolesPage() {
  const { t } = useI18n()
  const { modal, message } = App.useApp()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<RoleResponse | null>(null)
  const [form] = Form.useForm()

  const roles = useQuery({ queryKey: ['roles'], queryFn: async () => (await roleApi.list()).data })
  const permissions = useQuery({ queryKey: ['permissions'], queryFn: async () => (await roleApi.permissions()).data })

  const save = useMutation({
    mutationFn: (v: { name: string; permissionCodes: string[] }) =>
      editing ? roleApi.update(editing.id, v) : roleApi.create(v),
    onSuccess: () => {
      message.success(editing ? t('adminRoles.updateSuccess') : t('adminRoles.createSuccess'))
      qc.invalidateQueries({ queryKey: ['roles'] })
      setOpen(false)
      setEditing(null)
      form.resetFields()
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const remove = useMutation({
    mutationFn: (id: number) => roleApi.remove(id),
    onSuccess: () => {
      message.success(t('adminRoles.deleteSuccess'))
      qc.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  return (
    <div>
      <PageHeader
        title={t('adminRoles.title')}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null)
              form.resetFields()
              setOpen(true)
            }}
          >
            {t('adminRoles.addRole')}
          </Button>
        }
      />
      <Card>
        {(roles.data ?? []).map((r) => (
          <div
            key={r.id}
            className="ant-list-item"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
              <Space>
                <Tag color="orange">{r.name}</Tag>
                <Typography.Text type="secondary">#{r.id}</Typography.Text>
              </Space>
              <Space size={[4, 4]} wrap>
                {r.permissions.map((p) => (
                  <Tag key={p.code}>{t(`perms.${p.code}`, p.code)}</Tag>
                ))}
              </Space>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                onClick={() => {
                  setEditing(r)
                  form.setFieldsValue({ name: r.name, permissionCodes: r.permissions.map((p) => p.code) })
                  setOpen(true)
                }}
              >
                {t('common.edit')}
              </Button>
              <Button danger onClick={() => modal.confirm({ title: t('adminRoles.deleteConfirm'), onOk: () => remove.mutate(r.id) })}>
                {t('common.delete')}
              </Button>
            </div>
          </div>
        ))}
      </Card>

      <Modal
        open={open}
        title={editing ? t('adminRoles.editRole') : t('adminRoles.addRole')}
        onCancel={() => {
          setOpen(false)
          setEditing(null)
        }}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate({ name: v.name, permissionCodes: v.permissionCodes ?? [] })}>
          <Form.Item name="name" label={t('adminRoles.roleName')} rules={[{ required: true, message: t('common.required') }]}>
            <Input />
          </Form.Item>
          <Form.Item name="permissionCodes" label={t('adminRoles.permissionsLabel')}>
            <Select
              mode="multiple"
              options={(permissions.data ?? []).map((p) => ({ value: p.code, label: `${p.code} — ${p.description}` }))}
              optionFilterProp="label"
              placeholder={t('adminRoles.permissionsLabel')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}