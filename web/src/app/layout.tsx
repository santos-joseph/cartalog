import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Providers } from '@/components/providers'

const geist = localFont({ src: './fonts/geist-latin.woff2', variable: '--font-geist', weight: '100 900' })

export const metadata: Metadata = {
  title: { default: 'Cartalog', template: '%s | Cartalog' },
  description: 'SaaS de catalogação de veículos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="h-full bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
