import type { ReactNode } from 'react'
import { Space, Typography } from 'antd'

const { Text } = Typography

export function PageHeader({
  title,
  subtitle,
  extra,
}: {
  title: string
  subtitle?: ReactNode
  extra?: ReactNode
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }} align="center">
        <Space orientation="vertical" size={0}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {subtitle ? (
            <Text type="secondary" style={{ fontWeight: 400 }}>
              {subtitle}
            </Text>
          ) : null}
        </Space>
        {extra}
      </Space>
    </div>
  )
}

export function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  tone?: { from: string; to: string }
}) {
  const from = tone?.from ?? 'rgba(255,107,44,0.15)'
  const textColor = tone?.from ?? '#ff6b2c'
  return (
    <div
      style={{
        background: tone
          ? `linear-gradient(135deg, ${tone.from}22, ${tone.to}14)`
          : 'rgba(255,255,255,0.02)',
        border: `1px solid ${tone ? `${tone.from}33` : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 14,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      {icon ? (
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: tone ? `${tone.from}2b` : from,
            color: textColor,
            display: 'grid',
            placeItems: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      ) : null}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'rgba(242,237,228,0.55)' }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3, whiteSpace: 'nowrap' }}>{value}</div>
      </div>
    </div>
  )
}

export function EmptyHint({ text }: { text: ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(242,237,228,0.4)' }}>
      {text}
    </div>
  )
}