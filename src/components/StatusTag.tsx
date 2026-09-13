import { Tag } from 'antd'
import { useI18n } from '../i18n'

const statusColors: Record<string, string> = {
  ACTIVE: 'green',
  FROZEN: 'blue',
  EXPIRED: 'gold',
  CANCELLED: 'default',
  PENDING: 'gold',
  SUCCESS: 'green',
  FAILED: 'red',
  CONFIRMED: 'green',
  WAITLISTED: 'orange',
  SCHEDULED: 'blue',
  COMPLETED: 'green',
  NO_SHOW: 'red',
}

export function StatusTag({ status }: { status: string }) {
  const { t } = useI18n()
  return (
    <Tag color={statusColors[status] ?? 'default'}>{t(`status.${status}`, status)}</Tag>
  )
}