'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Plus, Search, Car, Pencil, Trash2 } from 'lucide-react'
import { vehiclesService } from '@/services/vehicles.service'
import { Button } from '@/components/ui/button'
import { VehicleStatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatMileage } from '@/lib/utils'
import type { PaginatedResponse, Vehicle } from '@/types'

function vehicleTitle(v: Vehicle) {
  return `${v.model.brand.name} ${v.model.name} ${v.year}`
}

export default function VehiclesPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<PaginatedResponse<Vehicle>>({
    queryKey: ['vehicles', { search, page }],
    queryFn: () => vehiclesService.list({ search: search || undefined, page }).then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehiclesService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })

  function confirmDelete(id: string, title: string) {
    if (confirm(`Tem certeza que deseja excluir "${title}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Veículos</h1>
          <p className="text-gray-500 mt-1">{data?.meta.total ?? 0} veículos cadastrados</p>
        </div>
        <Button onClick={() => router.push('/dashboard/vehicles/new')}>
          <Plus size={16} />
          Novo veículo
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar veículos..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : !data?.data.length ? (
          <div className="p-12 text-center">
            <Car size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Nenhum veículo cadastrado</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard/vehicles/new')}>
              Cadastrar primeiro veículo
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Veículo</th>
                <th className="px-4 py-3">Ano / KM</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.data.map((v) => {
                const title = vehicleTitle(v)
                const coverImage = v.images?.[0]?.imageUrl
                return (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {coverImage ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL}${coverImage}`}
                              alt={title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Car size={16} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{title}</p>
                          <p className="text-xs text-gray-500">
                            {v.color ? `${v.color} · ` : ''}{v.fuel?.name ?? ''}{v.transmission ? ` · ${v.transmission.name}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {v.year} · {formatMileage(v.mileage)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatCurrency(v.price)}
                    </td>
                    <td className="px-4 py-3">
                      <VehicleStatusBadge status={v.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => router.push(`/dashboard/vehicles/${v.id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => confirmDelete(v.id, title)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {data && data.meta.lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
            <p className="text-gray-500">Página {data.meta.page} de {data.meta.lastPage}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page === data.meta.lastPage} onClick={() => setPage((p) => p + 1)}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
