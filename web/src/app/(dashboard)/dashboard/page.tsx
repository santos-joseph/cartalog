'use client'

import { useQuery } from '@tanstack/react-query'
import { Car, MessageSquare, TrendingUp, BarChart3 } from 'lucide-react'
import { dashboardService } from '@/services/dashboard.service'
import { useAuthStore } from '@/stores/auth.store'
import { formatCurrency, formatRelativeDate } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardOverview } from '@/types'

function vehicleTitle(v: { model: { name: string; brand: { name: string } }; year: number }) {
  return `${v.model.brand.name} ${v.model.name}`
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const company = useAuthStore((s) => s.company)
  const { data, isLoading } = useQuery<DashboardOverview>({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.overview().then((r) => r.data),
  })

  if (isLoading) return <DashboardSkeleton />
  if (!data) return null

  const negotiating = data.leads.byStatus.find((s) => s.name === 'Negociando')?.count ?? 0
  const contacted = data.leads.byStatus.find((s) => s.name === 'Contactado')?.count ?? 0

  const kpis = [
    {
      title: 'Veículos Disponíveis',
      value: data.vehicles.available,
      sub: `${data.vehicles.total} total`,
      icon: Car,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Leads este Mês',
      value: data.leads.newThisMonth,
      sub: `${data.leads.total} total`,
      icon: TrendingUp,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      title: 'Em Negociação',
      value: negotiating,
      sub: `${contacted} contactados`,
      icon: MessageSquare,
      iconBg: 'bg-warning/15',
      iconColor: 'text-warning-foreground',
    },
    {
      title: 'Vendidos',
      value: data.vehicles.sold,
      sub: `${data.vehicles.reserved} reservados`,
      icon: BarChart3,
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-primary rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 right-24 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative">
          <h1 className="text-3xl font-bold mb-1">Bem-vindo de volta 👋</h1>
          <p className="text-white/70 text-sm">Confira o desempenho do catálogo de <span className="font-semibold text-white">{company?.name}</span></p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.title} className="p-6 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center mb-4`}>
                <Icon className={`${item.iconColor}`} size={22} />
              </div>
              <p className="text-muted-foreground text-sm font-medium mb-1">{item.title}</p>
              <p className="text-3xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-2">{item.sub}</p>
            </Card>
          )
        })}
      </div>

      {/* Top Vehicles + Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 pb-4 flex items-center gap-2 border-b border-border">
            <Car className="text-primary" size={18} />
            <h3 className="font-semibold text-foreground">Veículos Mais Vistos</h3>
          </div>
          <div className="p-4">
            {data.topViewedVehicles.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Nenhum veículo com visualizações ainda
              </div>
            ) : (
              <div className="space-y-1">
                {data.topViewedVehicles.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary flex-shrink-0 flex items-center justify-center">
                      <Car className="text-white" size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{vehicleTitle(v)} {v.year}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(v.price)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-foreground text-sm">{v.viewCount}</p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6 pb-4 flex items-center gap-2 border-b border-border">
            <MessageSquare className="text-primary" size={18} />
            <h3 className="font-semibold text-foreground">Leads Recentes</h3>
          </div>
          <div className="p-4">
            {data.recentLeads.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Nenhum lead ainda</div>
            ) : (
              <div className="space-y-1">
                {data.recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-primary flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeDate(lead.createdAt)}</p>
                    </div>
                    <Badge variant="muted">{lead.status?.name ?? '—'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Sales Funnel */}
      {data.leads.byStatus.length > 0 && (
        <Card>
          <div className="p-6 pb-4 flex items-center gap-2 border-b border-border">
            <BarChart3 className="text-primary" size={18} />
            <h3 className="font-semibold text-foreground">Funil de Vendas</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {data.leads.byStatus.map((status, i) => (
                <div key={status.id} className="relative">
                  <div className="bg-accent rounded-xl p-4 text-center border border-border">
                    <p className="text-2xl font-bold text-primary">{status.count}</p>
                    <p className="text-xs font-medium text-muted-foreground mt-1">{status.name}</p>
                  </div>
                  {i < data.leads.byStatus.length - 1 && (
                    <div className="hidden md:block absolute -right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg z-10">›</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
