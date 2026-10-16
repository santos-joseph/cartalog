'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Car, Phone, Mail, Clock } from 'lucide-react'
import Link from 'next/link'
import { leadsService } from '@/services/leads.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatRelativeDate } from '@/lib/utils'
import type { Lead, LeadStatus } from '@/types'

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ['lead', id],
    queryFn: () => leadsService.findById(id).then(r => r.data),
  })

  const { data: statuses = [] } = useQuery<LeadStatus[]>({
    queryKey: ['lead-statuses'],
    queryFn: () => leadsService.statuses().then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: (statusId: string) => leadsService.update(id, { statusId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead', id] }),
  })

  if (isLoading) return (
    <div className="space-y-6 max-w-3xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  )

  if (!lead) return <div className="text-muted-foreground">Lead não encontrado.</div>

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push('/dashboard/leads')}>
          <ArrowLeft size={16} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{lead.name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Recebido {formatRelativeDate(lead.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={lead.status?.id ?? ''}
            onChange={(e) => { if (e.target.value) updateMutation.mutate(e.target.value) }}
            className="text-sm rounded-lg border border-input bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Sem status</option>
            {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Contact info */}
      <Card>
        <CardHeader><CardTitle>Informações de contato</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">{lead.name}</p>
              {lead.status && <Badge variant="muted">{lead.status.name}</Badge>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-2 p-3 rounded-lg bg-muted hover:bg-accent transition-colors hover:no-underline text-foreground">
                <Phone size={16} className="text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm font-medium">{lead.phone}</p>
                </div>
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 p-3 rounded-lg bg-muted hover:bg-accent transition-colors hover:no-underline text-foreground">
                <Mail size={16} className="text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{lead.email}</p>
                </div>
              </a>
            )}
          </div>
          {lead.message && (
            <div className="mt-4 p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Mensagem</p>
              <p className="text-sm text-foreground">{lead.message}</p>
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock size={12} />
            <span>Recebido em {formatDate(lead.createdAt)}</span>
            {lead.source && <><span>·</span><span>Fonte: {lead.source}</span></>}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle of interest */}
      {lead.vehicle && (
        <Card>
          <CardHeader><CardTitle>Veículo de interesse</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
                {lead.vehicle.images?.[0] ? (
                  <img src={`${process.env.NEXT_PUBLIC_API_URL}${lead.vehicle.images[0].imageUrl}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Car className="text-white" size={20} />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {lead.vehicle.model.brand.name} {lead.vehicle.model.name} {lead.vehicle.year}
                </p>
              </div>
              <Link href={`/dashboard/vehicles/${lead.vehicle.id}`}>
                <Button variant="outline" size="sm">Ver veículo</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
