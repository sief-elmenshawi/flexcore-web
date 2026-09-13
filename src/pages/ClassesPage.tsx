import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Typography,
} from 'antd'
import {
  CalendarOutlined,
  CompassOutlined,
  EditOutlined,
  FireOutlined,
  HeartOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { classApi, bookingApi, userApi } from '../api/endpoints'
import type { GymClassResponse } from '../api/types'
import { PageHeader } from '../components/common'
import { useI18n } from '../i18n'
import { useAuth } from '../auth/AuthContext'
import { getErrorMessage } from '../api/client'
import dayjs from 'dayjs'

interface CategoryMeta {
  key: string
  icon: ReactNode
  from: string
  to: string
}

const CATEGORY_ORDER = ['zumba', 'yoga', 'fitness', 'physique', 'bodyBuilding'] as const
type CategoryKey = (typeof CATEGORY_ORDER)[number] | 'other' | 'all'

const CATEGORIES: Record<string, CategoryMeta> = {
  zumba: { key: 'zumba', icon: <FireOutlined />, from: '#f97316', to: '#e11d48' },
  yoga: { key: 'yoga', icon: <CompassOutlined />, from: '#38bdf8', to: '#6366f1' },
  fitness: { key: 'fitness', icon: <ThunderboltOutlined />, from: '#22c55e', to: '#0d9488' },
  physique: { key: 'physique', icon: <HeartOutlined />, from: '#a855f7', to: '#6d28d9' },
  bodyBuilding: { key: 'bodyBuilding', icon: <TrophyOutlined />, from: '#f59e0b', to: '#b45309' },
  other: { key: 'other', icon: <CalendarOutlined />, from: '#64748b', to: '#334155' },
}

function detectCategory(name: string): CategoryKey {
  const n = name.toLowerCase()
  if (n.includes('zumba')) return 'zumba'
  if (n.includes('yoga')) return 'yoga'
  if (n.includes('fitness')) return 'fitness'
  if (n.includes('physique')) return 'physique'
  if (n.includes('body')) return 'bodyBuilding'
  return 'other'
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function slotLabel(hour: number): 'dayMorning' | 'dayEvening' | 'dayLate' {
  if (hour < 12) return 'dayMorning'
  if (hour < 18) return 'dayEvening'
  return 'dayLate'
}

export default function ClassesPage() {
  const { t, formatDateTime } = useI18n()
  const { hasPermission } = useAuth()
  const { modal, message } = App.useApp()
  const qc = useQueryClient()
  const canManage = hasPermission('MANAGE_OWN_SCHEDULE')
  const canBook = hasPermission('BOOK_CLASS')

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryKey>('all')
  const [form] = Form.useForm()
  const [editingClass, setEditingClass] = useState<GymClassResponse | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const classes = useQuery({
    queryKey: ['classes', 'upcoming', search],
    queryFn: async () =>
      (await classApi.upcoming({ size: 100, ...(search ? { name: search } : {}) })).data,
  })

  const trainers = useQuery({
    queryKey: ['trainers-list'],
    queryFn: async () => {
      const { data } = await userApi.trainers({ size: 200 })
      return Array.isArray(data.content) ? data.content : []
    },
    enabled: canManage,
  })

  const bookClass = useMutation({
    mutationFn: (classId: number) => bookingApi.create({ classId }),
    onSuccess: (_data, classId) => {
      message.success(t('class.bookingSuccess'))
      qc.setQueriesData({ queryKey: ['classes'] }, (old: unknown) => {
        if (!old || typeof old !== 'object') return old
        const page = old as { content?: GymClassResponse[] }
        if (Array.isArray(page.content)) {
          return {
            ...page,
            content: page.content.map((c) =>
              c.id === classId
                ? { ...c, bookedCount: c.bookedCount + 1, availableSpots: Math.max(0, c.availableSpots - 1) }
                : c,
            ),
          }
        }
        if (Array.isArray(old)) {
          return (old as GymClassResponse[]).map((c) =>
            c.id === classId
              ? { ...c, bookedCount: c.bookedCount + 1, availableSpots: Math.max(0, c.availableSpots - 1) }
              : c,
          )
        }
        return old
      })
      qc.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const saveClass = useMutation({
    mutationFn: (values: any) => {
      const payload = {
        name: values.name,
        trainerId: values.trainerId,
        capacity: values.capacity,
        durationMinutes: values.durationMinutes,
        startsAt: values.startsAt?.toISOString?.() ?? values.startsAt,
      }
      return editingClass ? classApi.update(editingClass.id, payload) : classApi.create(payload)
    },
    onSuccess: () => {
      message.success(editingClass ? t('class.updateSuccess') : t('class.createSuccess'))
      qc.invalidateQueries({ queryKey: ['classes'] })
      setCreateOpen(false)
      setEditingClass(null)
      form.resetFields()
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const deleteClass = useMutation({
    mutationFn: (id: number) => classApi.remove(id),
    onSuccess: () => {
      message.success(t('class.deleteSuccess'))
      qc.invalidateQueries({ queryKey: ['classes'] })
    },
    onError: (e) => message.error(getErrorMessage(e, t)),
  })

  const all = useMemo(() => classes.data?.content ?? [], [classes.data])

  const totals = useMemo(() => {
    const map: Record<string, number> = { all: all.length }
    for (const k of CATEGORY_ORDER) map[k] = 0
    for (const cls of all) {
      const k = detectCategory(cls.name)
      map[k] = (map[k] ?? 0) + 1
    }
    return map
  }, [all])

  const visible = useMemo(
    () => (category === 'all' ? all : all.filter((c) => detectCategory(c.name) === category)),
    [all, category],
  )

  const groups = useMemo(() => {
    const byDay = new Map<number, GymClassResponse[]>()
    for (const cls of visible) {
      const key = dayjs(cls.startsAt).startOf('day').valueOf()
      if (!byDay.has(key)) byDay.set(key, [])
      byDay.get(key)!.push(cls)
    }
    return [...byDay.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([key, items]) => ({
        key,
        label: dayjs(key),
        items: items.sort((a, b) => dayjs(a.startsAt).valueOf() - dayjs(b.startsAt).valueOf()),
      }))
  }, [visible])

  return (
    <div>
      <PageHeader
        title={t('class.upcoming')}
        subtitle={`${visible.length} ${t('common.result')}`}
        extra={
          canManage ? (
            <Space>
              <Input
                placeholder={t('class.searchByName')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingClass(null)
                  form.resetFields()
                  setCreateOpen(true)
                }}
              >
                {t('class.schedule')}
              </Button>
            </Space>
          ) : null
        }
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {(['all', ...CATEGORY_ORDER] as CategoryKey[]).map((key) => {
          const meta = CATEGORIES[key] ?? CATEGORIES.other
          const active = category === key
          return (
            <button
              key={key}
              onClick={() => setCategory(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 14px',
                borderRadius: 999,
                border: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? '#fff' : 'rgba(242,237,228,0.75)',
                background: active ? `linear-gradient(135deg, ${meta.from}, ${meta.to})` : 'rgba(255,255,255,0.03)',
                transition: 'all .15s ease',
              }}
            >
              <span style={{ fontSize: 14, opacity: active ? 1 : 0.8 }}>{meta.icon}</span>
              {t(`classCategory.${key}`)}
              <span
                style={{
                  minWidth: 18,
                  height: 18,
                  padding: '0 5px',
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  background: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                }}
              >
                {totals[key] ?? 0}
              </span>
            </button>
          )
        })}
      </div>

      {classes.isLoading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3].map((i) => (
            <Col xs={24} sm={12} lg={8} key={i}>
              <Card>
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 16,
            alignItems: 'start',
          }}
        >
          {groups.map((g) => {
          const todayLabel = g.label.format('dddd, D MMM')
          return (
            <div key={g.key} style={{ minWidth: 0 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <CalendarOutlined style={{ color: '#ff6b2c' }} />
                <Typography.Text strong style={{ fontSize: 13, textTransform: 'capitalize' }}>
                  {todayLabel}
                </Typography.Text>
                <span style={{ fontSize: 11, color: 'rgba(242,237,228,0.45)' }}>· {g.items.length} {t('class.title')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {g.items.map((cls) => {
                  const meta = CATEGORIES[detectCategory(cls.name)] ?? CATEGORIES.other
                  const full = cls.availableSpots === 0
                  const pct = Math.round((cls.bookedCount / Math.max(cls.capacity, 1)) * 100)
                  const hour = dayjs(cls.startsAt).hour()
                  return (
                    <div
                      key={cls.id}
                      style={{
                        borderRadius: 14,
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.07)',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div
                        style={{
                          background: `linear-gradient(135deg, ${meta.from}, ${meta.to})`,
                          padding: '12px 14px',
                          color: '#fff',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <Space size={10}>
                            <span
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.22)',
                                display: 'grid',
                                placeItems: 'center',
                                fontSize: 15,
                                flexShrink: 0,
                              }}
                            >
                              {meta.icon}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <Typography.Text strong style={{ color: '#fff', fontSize: 14, margin: 0, display: 'block' }}>
                                {cls.name}
                              </Typography.Text>
                              <div style={{ fontSize: 11, opacity: 0.95 }}>
                                {formatDateTime(cls.startsAt)} · {cls.durationMinutes} {t('class.minutes')} ·{' '}
                                <span style={{ textTransform: 'capitalize' }}>{t(`class.${slotLabel(hour)}`)}</span>
                              </div>
                            </div>
                          </Space>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '12px 14px',
                          background: 'rgba(255,255,255,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          flex: 1,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar style={{ background: 'rgba(255,107,44,0.18)', color: '#ff6b2c', fontWeight: 700 }}>
                            {initialsOf(cls.trainerName)}
                          </Avatar>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11, color: 'rgba(242,237,228,0.5)' }}>{t('class.leadTrainer')}</div>
                            <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {cls.trainerName}
                            </div>
                          </div>
                          <div
                            style={{
                              marginInlineStart: 'auto',
                              padding: '3px 9px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                              background: full ? 'rgba(255,107,44,0.18)' : 'rgba(82,196,26,0.14)',
                              color: full ? '#ff7a45' : '#52c41a',
                            }}
                          >
                            {full ? t('class.allBooked') : `${cls.availableSpots} ${t('class.seatsLeft')}`}
                          </div>
                        </div>

                        <Progress
                          percent={pct}
                          showInfo={false}
                          strokeColor={full ? '#f5222d' : meta.from}
                          railColor="rgba(255,255,255,0.08)"
                          size="small"
                        />

                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                          {canBook && !full ? (
                            <Button
                              type="primary"
                              size="small"
                              style={{ background: `linear-gradient(135deg, ${meta.from}, ${meta.to})`, border: 'none' }}
                              onClick={() => bookClass.mutate(cls.id)}
                              loading={bookClass.isPending && bookClass.variables === cls.id}
                            >
                              {t('class.bookNow')}
                            </Button>
                          ) : null}
                          {canManage ? (
                            <>
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => {
                                  setEditingClass(cls)
                                  form.setFieldsValue({
                                    name: cls.name,
                                    trainerId: cls.trainerId,
                                    capacity: cls.capacity,
                                    durationMinutes: cls.durationMinutes,
                                    startsAt: dayjs(cls.startsAt),
                                  })
                                  setCreateOpen(true)
                                }}
                              />
                              <Button
                                size="small"
                                danger
                                icon={<MinusCircleOutlined />}
                                onClick={() => {
                                  modal.confirm({
                                    title: t('class.deleteConfirm'),
                                    onOk: () => deleteClass.mutate(cls.id),
                                  })
                                }}
                              />
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        </div>
      )}

      {visible.length === 0 && !classes.isLoading && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 0',
            color: 'rgba(242,237,228,0.4)',
          }}
        >
          {t('common.empty')}
        </div>
      )}

      <Modal
        open={createOpen}
        title={editingClass ? t('class.editClass') : t('class.schedule')}
        onCancel={() => {
          setCreateOpen(false)
          setEditingClass(null)
        }}
        onOk={() => form.submit()}
        confirmLoading={saveClass.isPending}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveClass.mutate(v)}>
          <Form.Item name="name" label={t('class.name')} rules={[{ required: true, message: t('common.required') }]}>
            <Input />
          </Form.Item>
          <Form.Item name="trainerId" label={t('class.trainer')} rules={[{ required: true, message: t('common.required') }]}>
            <Select
              options={(trainers.data ?? []).map((u: any) => ({
                value: u.id,
                label: `${u.fullName} (${u.roleName})`,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="capacity" label={t('class.capacity')} rules={[{ required: true, message: t('common.required') }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="startsAt" label={t('class.startsAt')} rules={[{ required: true, message: t('common.required') }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="durationMinutes" label={`${t('class.duration')} (${t('class.minutes')})`} rules={[{ required: true, message: t('common.required') }]}>
            <InputNumber min={15} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}