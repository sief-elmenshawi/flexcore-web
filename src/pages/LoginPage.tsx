import { useState } from 'react'
import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n'
import { getErrorMessage } from '../api/client'

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true)
    setError(null)
    try {
      await login(values)
      navigate('/dashboard')
    } catch (e) {
      setError(getErrorMessage(e, t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420, padding: '40px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg,#ff6b2c,#ff2d55)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontSize: 24,
              margin: '0 auto 16px',
            }}
          >
            💪
          </div>
          <Typography.Title level={2} style={{ margin: 0 }}>
            {t('auth.signInTitle')}
          </Typography.Title>
          <Typography.Text type="secondary">{t('auth.forgot')}</Typography.Text>
        </div>

        <Card>
          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            {error && (
              <Alert
                style={{ marginBottom: 16 }}
                type="error"
                showIcon
                title={error}
                closable
                onClose={() => setError(null)}
              />
            )}
            <Form.Item
              name="email"
              label={t('auth.email')}
              rules={[{ required: true, message: t('common.required') }, { type: 'email', message: t('errors.validation') }]}
            >
              <Input prefix={<MailOutlined />} placeholder="you@example.com" size="large" />
            </Form.Item>
            <Form.Item
              name="password"
              label={t('auth.password')}
              rules={[{ required: true, message: t('common.required') }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              {t('auth.signIn')}
            </Button>
          </Form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Typography.Text type="secondary">
              {t('auth.noAccount')}{' '}
              <Link to="/register">{t('auth.signUp')}</Link>
            </Typography.Text>
          </div>
        </Card>
      </div>
    </div>
  )
}