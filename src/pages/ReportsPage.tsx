import { Card, Col, Row, Statistic, Table } from 'antd'
import { MoneyCollectOutlined, WalletOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { reportApi } from '../api/endpoints'
import { PageHeader } from '../components/common'
import { useI18n } from '../i18n'

export default function ReportsPage() {
  const { t, formatMoney } = useI18n()

  const report = useQuery({
    queryKey: ['reports', 'revenue'],
    queryFn: async () => (await reportApi.revenue({})).data,
  })

  const breakdown = report.data?.breakdown ?? []

  return (
    <div>
      <PageHeader title={t('reports.title')} subtitle={t('reports.range')} />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title={t('reports.totalRevenue')}
              value={report.data?.totalRevenue ?? 0}
              prefix={<MoneyCollectOutlined />}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title={t('reports.totalPayments')}
              value={report.data?.totalPayments ?? 0}
              prefix={<WalletOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title={t('reports.byMethod')} style={{ marginTop: 16 }}>
        <Table
          rowKey="method"
          loading={report.isLoading}
          dataSource={breakdown}
          pagination={false}
          columns={[
            {
              title: t('common.method'),
              dataIndex: 'method',
              render: (v: string) => v.replace('MOCK_', ''),
            },
            {
              title: t('common.total'),
              dataIndex: 'total',
              render: (v: number) => formatMoney(v),
            },
            { title: t('common.count'), dataIndex: 'count' },
          ]}
        />
      </Card>
    </div>
  )
}