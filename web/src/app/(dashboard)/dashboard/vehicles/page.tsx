'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Plus, Search, Car, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { vehiclesService } from '@/services/vehicles.service'
import { formatCurrency, formatMileage } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { VehicleStatusBadge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import type { PaginatedResponse, Vehicle } from '@/types'

function vehicleTitle(v: Vehicle) {
  return `${v.model.brand.name} ${v.model.name} ${v.year}`
}

export default function VehiclesPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useQuery<PaginatedResponse<Vehicle>>({
    queryKey: ['vehicles', { search, page }],
    queryFn: () => vehiclesService.list({ search: search || undefined, page }).then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehiclesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      setDeleteId(null)
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Veículos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{data?.meta.total ?? 0} veículos cadastrados</p>
        </div>
        <Button variant="gradient" onClick={() => router.push('/dashboard/vehicles/new')}>
          <Plus size={17} />
          Novo Veículo
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por marca, modelo..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full pl-9 pr-4 h-10 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : !data?.data.length ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
              <Car size={28} className="text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">Nenhum veículo cadastrado</p>
            <p className="text-sm text-muted-foreground mb-4">Adicione seu primeiro veículo ao catálogo</p>
            <Button variant="gradient" onClick={() => router.push('/dashboard/vehicles/new')}>
              <Plus size={16} />
              Cadastrar veículo
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Ano / Km</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((v) => {
                const title = vehicleTitle(v)
                const coverImage = v.images?.[0]?.imageUrl
                return (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-primary flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {coverImage ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL}${coverImage}`}
                              alt={title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Car className="text-white" size={18} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{title}</p>
                          <p className="text-xs text-muted-foreground">
                            {v.color && `${v.color} • `}
                            {v.fuel?.name ?? ''}
                            {v.transmission ? ` • ${v.transmission.name}` : ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {v.year} · {formatMileage(v.mileage)}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {formatCurrency(v.price)}
                    </TableCell>
                    <TableCell>
                      <VehicleStatusBadge status={v.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => router.push(`/dashboard/vehicles/${v.id}`)}
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteId(v.id)}
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {data && data.meta.lastPage > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Página {data.meta.page} de {data.meta.lastPage}
            </p>
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

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <DialogContent>
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center mb-2">
              <AlertCircle className="text-destructive" size={20} />
            </div>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
