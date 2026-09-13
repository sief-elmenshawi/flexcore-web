import { theme } from 'antd'

const brand = {
  primary: '#ff6b2c',
  primaryHover: '#ff8a55',
  primaryActive: '#e6551a',
  primaryBg: '#2a1608',
}

export const appTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: brand.primary,
    colorInfo: brand.primary,
    colorLink: brand.primary,
    colorLinkHover: brand.primaryHover,
    colorLinkActive: brand.primaryActive,
    colorBgBase: '#0e0d0b',
    colorBgContainer: '#171511',
    colorBgElevated: '#1d1a15',
    colorBgLayout: '#0e0d0b',
    colorBorder: '#2e2a23',
    colorBorderSecondary: '#262219',
    colorText: '#f2ede4',
    colorTextSecondary: 'rgba(242, 237, 228, 0.65)',
    colorTextTertiary: 'rgba(242, 237, 228, 0.45)',
    borderRadius: 10,
    borderRadiusLG: 14,
    controlHeight: 38,
    fontFamily:
      "'Segoe UI', 'Tajawal', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Layout: {
      siderBg: '#121009',
      headerBg: '#171511',
      bodyBg: '#0e0d0b',
      headerHeight: 64,
    },
    Menu: {
      darkItemBg: '#121009',
      darkSubMenuItemBg: '#0e0d0b',
      darkItemSelectedBg: 'rgba(255, 107, 44, 0.18)',
      darkItemSelectedColor: brand.primary,
      darkItemColor: 'rgba(242, 237, 228, 0.7)',
      itemBorderRadius: 8,
    },
    Card: {
      colorBgContainer: '#171511',
    },
    Table: {
      headerBg: '#1f1c16',
      headerColor: 'rgba(242, 237, 228, 0.9)',
      rowHoverBg: '#1c1a14',
    },
    Button: {
      primaryShadow: '0 2px 8px rgba(255, 107, 44, 0.35)',
      fontWeight: 600,
    },
    Tag: {
      borderRadiusSM: 6,
    },
  },
}

export const brandColors = brand