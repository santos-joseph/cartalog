'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Car, Users, Settings, LogOut,
  MessageSquare, ChevronRight, ExternalLink, Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/vehicles', label: 'Veículos', icon: Car },
  { href: '/dashboard/leads', label: 'Leads / CRM', icon: MessageSquare },
  { href: '/dashboard/catalog', label: 'Catálogo', icon: Globe },
  { href: '/dashboard/team', label: 'Equipe', icon: Users },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
]

function getCatalogUrl(slug: string): string {
  if (typeof window === 'undefined') return '#'
  const { protocol, hostname, port } = window.location
  const portPart = port ? `:${port}` : ''
  const parts = hostname.split('.')
  const baseDomain = parts.length > 1 ? parts.slice(1).join('.') : hostname
  return `${protocol}//${slug}.${baseDomain}${portPart}`
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, company, logout } = useAuthStore()

  function handleLogout() {
    logout()
    router.push('/login')
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen">
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <img src="/brand/cartalog-logo.png" alt="Cartalog" className="h-9 w-auto max-w-[142px] object-contain flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{company?.name}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-gradient-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon size={17} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} className="opacity-70" />}
            </Link>
          )
        })}
      </nav>

      {/* Catalog link */}
      {company?.slug && (
        <>
          <Separator />
          <div className="p-3">
            <a
              href={getCatalogUrl(company.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-accent hover:text-primary transition-colors font-medium"
            >
              <ExternalLink size={14} />
              Ver catálogo público
            </a>
          </div>
        </>
      )}

      <Separator />

      {/* User */}
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 px-3 py-2 rounded-lg transition-colors w-full font-medium"
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  )
}
