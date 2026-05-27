'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { MessageSquare, Search } from 'lucide-react'
import { leadsService } from '@/services/leads.service'
import { Button } from '@/components/ui/button'
import { formatRelativeDate } from '@/lib/utils'
import type { PaginatedResponse, Lead, LeadStatus } from '@/types'

function vehicleLabel(v: Lead['vehicle']) {
  if (!v) return null
  return `${v.model.brand.name} ${v.model.name} ${v.year}`
}

export default function LeadsPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusId, setStatusId] = useState('')
  const [page, setPage] = useState(1)

  const { data: statuses = [] } = useQuery<LeadStatus[]>({
    queryKey: ['lead-statuses'],
    queryFn: () => leadsService.statuses().then((r) => r.data),
  })

  const { data, isLoading } = useQuery<PaginatedResponse<Lead>>({
    queryKey: ['leads', { search, statusId, page }],
    queryFn: () =>
      leadsService.list({ search: search || undefined, statusId: statusId || undefined, page }).then((r) => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, newStatusId }: { id: string; newStatusId: string }) =>
      leadsService.update(id, { statusId: newStatusId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leads / CRM</h1>
        <p className="text-gray-500 mt-1">{data?.meta.total ?? 0} leads no total</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar nome, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => { setStatusId(''); setPage(1) }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusId === '' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Todos
          </button>
          {statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => { setStatusId(s.id); setPage(1) }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusId === s.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : !data?.data.length ? (
          <div className="p-12 text-center">
            <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhum lead encontrado</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Veículo</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.data.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/dashboard/leads/${lead.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center">
                        {lead.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{lead.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                    {vehicleLabel(lead.vehicle) ?? <span className="text-gray-400 italic">Geral</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {lead.phone ?? lead.email ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status?.id ?? ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateMutation.mutate({ id: lead.id, newStatusId: e.target.value })}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Sem status</option>
                      {statuses.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatRelativeDate(lead.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/leads/${lead.id}`) }}>
                      Ver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data && data.meta.lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
            <p className="text-gray-500">Página {data.meta.page} de {data.meta.lastPage}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page === data.meta.lastPage} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
