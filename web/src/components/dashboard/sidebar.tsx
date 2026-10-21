'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowUpRight, CarFront, LayoutGrid, LogOut, MessageCircleMore } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Visão geral', icon: LayoutGrid, exact: true },
  { href: '/dashboard/vehicles', label: 'Veículos', icon: CarFront },
  { href: '/dashboard/leads', label: 'Leads', icon: MessageCircleMore },
]

function catalogUrl(slug: string) {
  if (typeof window === 'undefined') return '#'
  const { protocol, hostname, port } = window.location
  const base = hostname.includes('.') ? hostname.split('.').slice(1).join('.') : hostname
  return `${protocol}//${slug}.${base}${port ? `:${port}` : ''}`
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, company, logout } = useAuthStore()
  const visible = links.filter((item) => user?.role === 'OWNER' || item.href === '/dashboard/leads')

  function handleLogout() {
    queryClient.clear()
    logout()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-5">
      <div className="mx-auto max-w-[1240px] rounded-[26px] border border-black/[.07] bg-white/90 shadow-[0_8px_32px_rgba(20,20,25,.06)] backdrop-blur-2xl">
        <div className="flex min-h-[70px] items-center gap-3 px-4 sm:px-6">
          <Link href={user?.role === 'SELLER' ? '/dashboard/leads' : '/dashboard'} className="shrink-0" aria-label="Cartalog, início">
            <img src="/brand/cartalog-logo.png" alt="Cartalog" className="h-9 w-auto max-w-[146px] object-contain" />
          </Link>
          <div className="mx-3 hidden h-7 w-px bg-border lg:block" />
          <span className="hidden max-w-36 truncate text-xs font-medium text-muted-foreground lg:block">{company?.name}</span>
          <nav className="ml-auto hidden items-center rounded-full bg-[#f5f5f7] p-1 md:flex" aria-label="Menu principal">
            {visible.map((item) => {
              const Icon = item.icon
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return <Link key={item.href} href={item.href} className={cn('flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors', active ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}><Icon size={16} className={active ? 'text-primary' : ''} />{item.label}</Link>
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-2">
            {company?.slug && <a href={catalogUrl(company.slug)} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1 rounded-full border border-border px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40 hover:text-primary sm:inline-flex">Catálogo <ArrowUpRight size={14} /></a>}
            <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#fff0f1] text-xs font-bold text-primary sm:flex" title={user?.name}>{user?.name?.charAt(0).toUpperCase()}</div>
            <button onClick={handleLogout} aria-label="Sair" title="Sair" className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><LogOut size={17} /></button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-border/70 px-3 py-2 md:hidden" aria-label="Menu principal">
          {visible.map((item) => {
            const Icon = item.icon
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return <Link key={item.href} href={item.href} className={cn('flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold', active ? 'bg-[#fff0f1] text-primary' : 'text-muted-foreground')}><Icon size={15} />{item.label}</Link>
          })}
        </nav>
      </div>
    </header>
  )
}
