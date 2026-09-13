import { Card, Skeleton, Space, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { paymentApi } from '../api/endpoints'
import { StatusTag } from '../components/StatusTag'
import { PageHeader } from '../components/common'
import { useI18n } from '../i18n'

export default function PaymentsPage() {
  const { t, formatMoney, formatDateTime } = useI18n()
  const payments = useQuery({ queryKey: ['payments'], queryFn: async () => (await paymentApi.my({ size: 50 })).data })

  return (
    <div>
      <PageHeader title={t('nav.payments')} />
      <Card>
        {payments.isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(payments.data?.content ?? []).map((p) => (
              <div
                key={p.id}
                className="ant-list-item"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{p.method.replace('MOCK_', '')}</span>
                    <StatusTag status={p.status} />
                  </div>
                  <Space orientation="vertical" size={2}>
                    <Typography.Text type="secondary">#{p.id}</Typography.Text>
                    <span>{p.paidAt ? formatDateTime(p.paidAt) : '—'}</span>
                  </Space>
                </div>
                <Typography.Text style={{ fontWeight: 700, color: '#ff6b2c', fontSize: 16 }}>
                  {formatMoney(p.amount)}
                </Typography.Text>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}