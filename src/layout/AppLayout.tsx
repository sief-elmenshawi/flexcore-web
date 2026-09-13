import { useMemo, useState } from 'react'
import { Avatar, Button, Dropdown, Layout, Menu, Space, Typography } from 'antd'
import {
  AuditOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  DollarOutlined,
  GlobalOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SwitcherOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n'

const { Sider, Header, Content } = Layout

export function AppLayout() {
  const { user, profile, logout } = useAuth()
  const { t, lang, setLang } = useI18n()
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const can = useAuth().hasPermission

  const menuItems = useMemo(() => {
    const items: { key: string; icon: React.ReactNode; label: React.ReactNode }[] = []
    items.push({ key: '/dashboard', icon: <DashboardOutlined />, label: t('nav.dashboard') })

    if (can('BOOK_CLASS') || can('MANAGE_OWN_SCHEDULE')) {
      items.push({ key: '/classes', icon: <CalendarOutlined />, label: t('nav.booking') })
    }
    if (can('FREEZE_OWN_SUBSCRIPTION')) {
      items.push({ key: '/subscriptions', icon: <WalletOutlined />, label: t('nav.mySubscriptions') })
    }
    if (can('BOOK_CLASS')) {
      items.push({ key: '/bookings', icon: <CalendarOutlined />, label: t('nav.myBookings') })
      items.push({ key: '/family', icon: <TeamOutlined />, label: t('nav.familyGroups') })
    }
    if (can('BOOK_CLASS') || can('MANAGE_OWN_SCHEDULE')) {
      items.push({ key: '/pt-sessions', icon: <ThunderboltOutlined />, label: t('nav.ptSessions') })
    }
    if (can('BOOK_CLASS') || can('MANAGE_SUBSCRIPTIONS')) {
      items.push({ key: '/plans', icon: <SwitcherOutlined />, label: t('nav.plans') })
    }
    if (can('CHECK_IN_MEMBER')) {
      items.push({ key: '/attendance', icon: <CheckCircleOutlined />, label: t('nav.attendance') })
    }
    if (can('VIEW_REPORTS')) {
      items.push({ key: '/reports', icon: <DollarOutlined />, label: t('nav.reports') })
    }
    if (can('MANAGE_STAFF')) {
      items.push({ key: '/admin/users', icon: <TeamOutlined />, label: t('nav.users') })
      items.push({ key: '/admin/roles', icon: <AuditOutlined />, label: t('nav.roles') })
    }
    return items
  }, [can, t])

  const selectedKey = useMemo(() => {
    const found = menuItems
      .slice()
      .sort((a, b) => b.key.length - a.key.length)
      .find((i) => location.pathname.startsWith(i.key))
    return found?.key ?? '/dashboard'
  }, [location.pathname, menuItems])

  const onLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="dark"
        width={240}
        collapsible
        collapsed={collapsed}
        trigger={null}
        style={{ borderInlineEnd: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '0 12px' : '0 20px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg,#ff6b2c,#ff2d55)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            FC
          </div>
          {!collapsed && (
            <div style={{ userSelect: 'none' }}>
              <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                {t('appName')}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(242,237,228,0.5)', whiteSpace: 'nowrap' }}>
                {t('appTagline')}
              </div>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={(e) => navigate(e.key)}
          style={{ borderInlineEnd: 'none', padding: '0 8px', background: 'transparent' }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            height: 64,
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((c) => !c)}
            />
          </Space>
          <Space size={12}>
            <Button
              icon={<GlobalOutlined />}
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            >
              {lang === 'en' ? 'العربية' : 'English'}
            </Button>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    label: <Link to="/dashboard">{profile?.fullName ?? user?.email}</Link>,
                    icon: <UserOutlined />,
                  },
                  { type: 'divider' },
                  { key: 'logout', label: t('nav.logout'), icon: <LogoutOutlined /> },
                ],
                onClick: ({ key }) => {
                  if (key === 'logout') void onLogout()
                },
              }}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ background: '#ff6b2c' }} src={undefined} size={30}>
                  {(profile?.fullName ?? user?.email ?? '?').charAt(0).toUpperCase()}
                </Avatar>
                <Typography.Text style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile?.fullName ?? user?.email}
                </Typography.Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: '24px' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export function LandingLayout({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang } = useI18n()
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backgroundColor: '#171511',
        }}
      >
        <Space>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg,#ff6b2c,#ff2d55)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 800,
            }}
          >
            FC
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.1 }}>{t('appName')}</div>
            <div style={{ fontSize: 11, color: 'rgba(242,237,228,0.5)' }}>{t('appTagline')}</div>
          </div>
        </Space>
        <Button icon={<GlobalOutlined />} onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>
          {lang === 'en' ? 'العربية' : 'English'}
        </Button>
      </Header>
      <Content>{children}</Content>
    </Layout>
  )
}