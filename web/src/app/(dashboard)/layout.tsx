'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { Sidebar } from '@/components/dashboard/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const sellerBlocked = user?.role === 'SELLER' && pathname.startsWith('/dashboard/vehicles')

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return
    if (!isAuthenticated()) {
      router.replace('/login')
    } else if (sellerBlocked) {
      router.replace('/dashboard/leads')
    }
  }, [isAuthenticated, router, sellerBlocked, mounted])

  if (!mounted || !isAuthenticated() || sellerBlocked) return null

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_50%_-15%,#fff0f1_0%,#fbfbfd_38%)]">
      <Sidebar />
      <main>
        <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-9 sm:px-6 sm:pt-12">{children}</div>
      </main>
    </div>
  )
}
