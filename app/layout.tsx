import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import Providers from './providers'
import { Shell } from '@/components/layout/shell'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk' })

export const metadata: Metadata = {
  title: 'Personal PWA starter',
  description: 'Next.js + TypeScript + Tailwind minimal shell with PWA ready.',
  manifest: '/manifest.webmanifest',
  icons: [
    { rel: 'icon', url: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
    { rel: 'icon', url: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
  ],
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f6fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1224' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${grotesk.variable} bg-background font-sans antialiased`}>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  )
}
