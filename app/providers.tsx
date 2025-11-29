'use client'

import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import { ThemeProvider } from '@/components/theme/theme-provider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ServiceWorkerRegister />
      {children}
    </ThemeProvider>
  )
}
