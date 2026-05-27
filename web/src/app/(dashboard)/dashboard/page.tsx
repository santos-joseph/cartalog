'use client'

import { useQuery } from '@tanstack/react-query'
import { Car, MessageSquare, TrendingUp, Eye } from 'lucide-react'
import { dashboardService } from '@/services/dashboard.service'
import { StatCard } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth.store'
import { formatCurrency, formatRelativeDate } from '@/lib/utils'
import type { DashboardOverview } from '@/types'

function vehicleTitle(v: { model: { name: string; brand: { name: string } }; year: number }) {
  return `${v.model.brand.name} ${v.model.name} ${v.year}`
}

export default function DashboardPage() {
  const company = useAuthStore((s) => s.company)

  const { data, isLoading } = useQuery<DashboardOverview>({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.overview().then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!data) return null

  const negotiating = data.leads.byStatus.find((s) => s.name === 'Negociando')?.count ?? 0
  const contacted = data.leads.byStatus.find((s) => s.name === 'Contactado')?.count ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">{company?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Veículos disponíveis"
          value={data.vehicles.available}
          icon={<Car size={20} />}
          change={`${data.vehicles.total} total`}
          changeType="neutral"
        />
        <StatCard
          title="Leads este mês"
          value={data.leads.newThisMonth}
          icon={<TrendingUp size={20} />}
          change={`${data.leads.total} total`}
          changeType="neutral"
        />
        <StatCard
          title="Em negociação"
          value={negotiating}
          icon={<MessageSquare size={20} />}
          change={`${contacted} contactados`}
          changeType="neutral"
        />
        <StatCard
          title="Veículos vendidos"
          value={data.vehicles.sold}
          icon={<Eye size={20} />}
          change={`${data.vehicles.reserved} reservados`}
          changeType="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top viewed vehicles */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Veículos mais vistos</h3>
          {data.topViewedVehicles.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum veículo cadastrado ainda</p>
          ) : (
            <div className="space-y-3">
              {data.topViewedVehicles.map((v) => (
                <div key={v.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {v.images[0]?.imageUrl ? (
                      <img src={`${process.env.NEXT_PUBLIC_API_URL}${v.images[0].imageUrl}`} alt={vehicleTitle(v)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Car size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{vehicleTitle(v)}</p>
                    <p className="text-xs text-gray-500">{v.year} · {formatCurrency(v.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Eye size={12} />
                    {v.viewCount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent leads */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Leads recentes</h3>
          {data.recentLeads.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum lead ainda</p>
          ) : (
            <div className="space-y-3">
              {data.recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold flex-shrink-0">
                    {lead.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {lead.vehicle ? vehicleTitle(lead.vehicle) : 'Sem veículo'} · {formatRelativeDate(lead.createdAt)}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{lead.status?.name ?? '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Funil de leads */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Funil de vendas</h3>
        <div className="flex gap-3 flex-wrap">
          {data.leads.byStatus.map((step, i) => {
            const colors = [
              'bg-purple-100 text-purple-700',
              'bg-yellow-100 text-yellow-700',
              'bg-blue-100 text-blue-700',
              'bg-green-100 text-green-700',
              'bg-red-100 text-red-700',
            ]
            return (
              <div key={step.id} className={`rounded-lg p-4 text-center flex-1 min-w-[80px] ${colors[i % colors.length]}`}>
                <p className="text-2xl font-bold">{step.count}</p>
                <p className="text-xs font-medium mt-1">{step.name}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
