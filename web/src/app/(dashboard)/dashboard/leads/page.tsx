'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { MessageSquare, Search, Eye, Phone, Mail, LayoutGrid, List } from 'lucide-react'
import { leadsService } from '@/services/leads.service'
import { formatRelativeDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { PaginatedResponse, Lead, LeadStatus } from '@/types'

// ── Color logic ──────────────────────────────────────────────────────────────

function getStatusDotColor(name?: string | null) {
  if (!name) return 'bg-muted-foreground/40'
  const n = name.toLowerCase()
  if (/vend|fech|conclu|ganho/.test(n)) return 'bg-green-500'
  if (/perd|descard|cancel|recus/.test(n)) return 'bg-red-500'
  return 'bg-amber-400'
}

function getStatusColumnStyle(name?: string | null) {
  if (!name) return { header: 'border-border', dot: 'bg-muted-foreground/40' }
  const n = name.toLowerCase()
  if (/vend|fech|conclu|ganho/.test(n)) return { header: 'border-green-500/40', dot: 'bg-green-500' }
  if (/perd|descard|cancel|recus/.test(n)) return { header: 'border-red-500/40', dot: 'bg-red-500' }
  return { header: 'border-amber-400/40', dot: 'bg-amber-400' }
}

// ── Vehicle label ─────────────────────────────────────────────────────────────

function vehicleLabel(v: Lead['vehicle']) {
  if (!v) return null
  return `${v.model.brand.name} ${v.model.name} ${v.year}`
}

// ── Kanban lead card ──────────────────────────────────────────────────────────

function KanbanCard({
  lead,
  onDragStart,
  isUpdating,
  onClick,
}: {
  lead: Lead
  onDragStart: (id: string) => void
  isUpdating: boolean
  onClick: () => void
}) {
  const dotColor = getStatusDotColor(lead.status?.name)

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', lead.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(lead.id)
      }}
      onClick={onClick}
      className={cn(
        'bg-card rounded-lg border border-border p-3 cursor-grab active:cursor-grabbing',
        'shadow-sm hover:shadow-md transition-all select-none',
        isUpdating && 'opacity-50 pointer-events-none',
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-1', dotColor)} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{lead.name}</p>
          {vehicleLabel(lead.vehicle) && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {vehicleLabel(lead.vehicle)}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {lead.phone && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone size={10} />{lead.phone}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {formatRelativeDate(lead.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Kanban column ─────────────────────────────────────────────────────────────

function KanbanColumn({
  statusId,
  title,
  leads,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onCardDragStart,
  updatingLeadId,
  onLeadClick,
}: {
  statusId: string
  title: string
  leads: Lead[]
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onCardDragStart: (id: string) => void
  updatingLeadId: string | null
  onLeadClick: (id: string) => void
}) {
  const style = getStatusColumnStyle(title === 'Sem status' ? null : title)

  return (
    <div
      className={cn(
        'flex-shrink-0 w-72 rounded-xl border bg-muted/30 flex flex-col overflow-hidden transition-colors',
        isDragOver
          ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/30'
          : `border-border hover:border-border/80`,
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Column header */}
      <div className={cn('px-3 py-2.5 border-b flex items-center gap-2', style.header)}>
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', style.dot)} />
        <span className="text-sm font-medium text-foreground truncate flex-1">{title}</span>
        <span className="text-xs text-muted-foreground bg-background/80 rounded-full px-2 py-0.5 border border-border">
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <div className={cn(
        'flex-1 p-2 space-y-2 min-h-[120px] transition-colors',
        isDragOver && 'bg-primary/5',
      )}>
        {leads.map((lead) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            onDragStart={onCardDragStart}
            isUpdating={updatingLeadId === lead.id}
            onClick={() => onLeadClick(lead.id)}
          />
        ))}
        {leads.length === 0 && !isDragOver && (
          <div className="flex items-center justify-center h-16">
            <p className="text-xs text-muted-foreground">Arraste leads aqui</p>
          </div>
        )}
        {isDragOver && (
          <div className="h-14 rounded-lg border-2 border-dashed border-primary/40 flex items-center justify-center">
            <p className="text-xs text-primary font-medium">Soltar aqui</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusId, setStatusId] = useState('')
  const [page, setPage] = useState(1)
  const [view, setView] = useState<'table' | 'kanban'>('table')

  const [statusError, setStatusError] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const updatingLeadId = useRef<string | null>(null)

  const { data: statuses = [] } = useQuery<LeadStatus[]>({
    queryKey: ['lead-statuses'],
    queryFn: () => leadsService.statuses().then((r) => r.data),
  })

  // Table view query (paginated)
  const { data: tableData, isLoading: tableLoading } = useQuery<PaginatedResponse<Lead>>({
    queryKey: ['leads', { search, statusId, page }],
    queryFn: () =>
      leadsService
        .list({ search: search || undefined, statusId: statusId || undefined, page })
        .then((r) => r.data),
    enabled: view === 'table',
  })

  // Kanban view query (up to 100 leads, all statuses)
  const { data: kanbanData, isLoading: kanbanLoading } = useQuery<PaginatedResponse<Lead>>({
    queryKey: ['leads-kanban', { search }],
    queryFn: () =>
      leadsService
        .list({ search: search || undefined, page: 1, perPage: 100 })
        .then((r) => r.data),
    enabled: view === 'kanban',
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, newStatusId }: { id: string; newStatusId: string | null }) =>
      leadsService.update(id, { statusId: newStatusId }),
    onSuccess: () => {
      setStatusError(null)
      updatingLeadId.current = null
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['leads-kanban'] })
    },
    onError: (err) => {
      console.error('Update Mutation Error:', err)
      updatingLeadId.current = null
      setStatusError('Erro ao alterar status. Tente novamente.')
    },
  })

  function handleDrop(e: React.DragEvent, targetStatusId: string) {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('text/plain')
    if (!leadId) return
    setDraggingId(null)
    updatingLeadId.current = leadId

    const resolvedStatusId = targetStatusId === '__none__' ? null : targetStatusId

    // Optimistic update in kanban cache
    qc.setQueryData<PaginatedResponse<Lead>>(
      ['leads-kanban', { search }],
      (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  status: resolvedStatusId
                    ? (statuses.find((s) => s.id === resolvedStatusId) ?? null)
                    : null,
                }
              : l,
          ),
        }
      },
    )

    updateMutation.mutate({ id: leadId, newStatusId: resolvedStatusId })
  }

  const kanbanLeads = kanbanData?.data ?? []
  const kanbanColumns = [
    { id: '__none__', name: 'Sem status', leads: kanbanLeads.filter((l) => !l.status) },
    ...statuses.map((s) => ({
      id: s.id,
      name: s.name,
      leads: kanbanLeads.filter((l) => l.status?.id === s.id),
    })),
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads / CRM</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {view === 'table' ? (tableData?.meta.total ?? 0) : (kanbanData?.meta.total ?? 0)} leads no total
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setView('table')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              view === 'table' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
            title="Visualização em tabela"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setView('kanban')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              view === 'kanban' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
            title="Visualização Kanban"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 h-10 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
          />
        </div>

        {view === 'table' && (
          <div className="flex gap-1 bg-muted rounded-lg p-1 overflow-x-auto">
            {[{ id: '', name: 'Todos' }, ...statuses].map((s) => (
              <button
                key={s.id}
                onClick={() => { setStatusId(s.id); setPage(1) }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap',
                  statusId === s.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {statusError && (
        <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <span>⚠</span> {statusError}
          <button onClick={() => setStatusError(null)} className="ml-auto text-destructive/70 hover:text-destructive">
            <span className="text-xs">✕</span>
          </button>
        </div>
      )}

      {/* ── TABLE VIEW ──────────────────────────────────────────────────────── */}
      {view === 'table' && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {tableLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : !tableData?.data.length ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
                <MessageSquare size={28} className="text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground mb-1">Nenhum lead encontrado</p>
              <p className="text-sm text-muted-foreground">Os leads aparecerão aqui quando chegarem via catálogo</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.data.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-gradient-primary flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div className={cn(
                            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card',
                            getStatusDotColor(lead.status?.name),
                          )} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {vehicleLabel(lead.vehicle) ?? <span className="italic text-muted-foreground/70">Geral</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs">
                            <Phone size={11} />{lead.phone}
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs">
                            <Mail size={11} />{lead.email}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', getStatusDotColor(lead.status?.name))} />
                        <select
                          value={lead.status?.id ?? ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            setStatusError(null)
                            updateMutation.mutate({ id: lead.id, newStatusId: e.target.value || null })
                          }}
                          className="text-xs rounded-lg border border-input bg-background px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                        >
                          <option value="">Sem status</option>
                          {statuses.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatRelativeDate(lead.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                      >
                        <Eye size={14} />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {tableData && tableData.meta.lastPage > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Página {tableData.meta.page} de {tableData.meta.lastPage}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page === tableData.meta.lastPage} onClick={() => setPage((p) => p + 1)}>
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── KANBAN VIEW ─────────────────────────────────────────────────────── */}
      {view === 'kanban' && (
        <div>
          {kanbanLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-72 h-96 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                Arraste os leads entre as colunas para alterar o status.
                {kanbanLeads.length === 100 && ' Exibindo até 100 leads.'}
              </p>
              <div className="flex gap-4 overflow-x-auto pb-6">
                {kanbanColumns.map((col) => (
                  <KanbanColumn
                    key={col.id}
                    statusId={col.id}
                    title={col.name}
                    leads={col.leads}
                    isDragOver={dragOverCol === col.id}
                    onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id) }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverCol(null)
                      }
                    }}
                    onDrop={(e) => { handleDrop(e, col.id); setDragOverCol(null) }}
                    onCardDragStart={(id) => setDraggingId(id)}
                    updatingLeadId={updatingLeadId.current}
                    onLeadClick={(id) => router.push(`/dashboard/leads/${id}`)}
                  />
                ))}

                {kanbanColumns.every((c) => c.leads.length === 0) && !search && (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
                      <MessageSquare size={28} className="text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground mb-1">Nenhum lead ainda</p>
                    <p className="text-sm text-muted-foreground">Os leads aparecerão aqui quando chegarem via catálogo</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
