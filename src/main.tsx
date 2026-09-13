import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, App as AntApp } from 'antd'
import enUS from 'antd/locale/en_US'
import arEG from 'antd/locale/ar_EG'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/ar'
import 'dayjs/locale/en'
import App from './App.tsx'
import { I18nProvider, useI18n } from './i18n'
import { AuthProvider } from './auth/AuthContext'
import { appTheme } from './theme'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})

function Root({ children }: { children: React.ReactNode }) {
  const { lang, dir } = useI18n()
  dayjs.locale(lang === 'ar' ? 'ar' : 'en')

  return (
    <ConfigProvider
      theme={appTheme}
      direction={dir}
      locale={lang === 'ar' ? arEG : enUS}
    >
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <Root>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </QueryClientProvider>
        </Root>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
)