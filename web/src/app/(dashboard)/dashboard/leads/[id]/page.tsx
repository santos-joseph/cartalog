'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowUpRight, CalendarDays, CarFront, Clock3, Mail, MessageCircleMore, Phone, Send, UserRound } from 'lucide-react'
import { leadsService } from '@/services/leads.service'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Lead, LeadStatus, User } from '@/types'

interface Interaction { id: string; type: string; note: string | null; createdAt: string; userId: string | null }
interface LeadDetail extends Lead { interactions: Interaction[]; assignedUserId: string | null }

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [note, setNote] = useState('')
  const [lossReason, setLossReason] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedSeller, setSelectedSeller] = useState('')
  const isOwner = user?.role === 'OWNER'
  const isSeller = user?.role === 'SELLER'
  const { data: lead, isLoading, isError } = useQuery<LeadDetail>({ queryKey: ['lead', id], queryFn: () => leadsService.findById(id).then((r) => r.data) })
  const { data: statuses = [] } = useQuery<LeadStatus[]>({ queryKey: ['lead-statuses'], queryFn: () => leadsService.statuses().then((r) => r.data) })
  const { data: sellers = [] } = useQuery<User[]>({ queryKey: ['sellers'], queryFn: () => api.get('/users').then((r) => r.data), enabled: isOwner })
  const refresh = () => { setError(''); setSuccess(''); qc.invalidateQueries({ queryKey: ['lead', id] }); qc.invalidateQueries({ queryKey: ['leads'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }) }
  const action = useMutation({ mutationFn: (job: () => Promise<unknown>) => job(), onSuccess: refresh, onError: (err: unknown) => setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? (err instanceof Error ? err.message : 'Não foi possível salvar a alteração.')) })
  const statusAction = useMutation({
    mutationFn: async (nextStatusId: string) => (await leadsService.update(id, {
      statusId: nextStatusId,
      ...(statuses.find((status) => status.id === nextStatusId)?.kind === 'lost' ? { lossReason: lossReason.trim() } : {}),
    })).data as { status: LeadStatus },
    onSuccess: (updated) => {
      qc.setQueryData<LeadDetail>(['lead', id], (current) => current ? { ...current, status: updated.status } : current)
      setSelectedStatus('')
      setLossReason('')
      setError('')
      setSuccess(`Status salvo: ${updated.status.name}.`)
      void qc.invalidateQueries({ queryKey: ['lead', id] })
      void qc.invalidateQueries({ queryKey: ['leads'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err: unknown) => setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? (err instanceof Error ? err.message : 'Não foi possível salvar o status.')),
  })
  const assignedToMe = isSeller && lead?.assignedUser?.id === user?.id
  const canClaim = isSeller && lead && !lead.assignedUser && (!lead.status || lead.status.kind === 'open')
  const phoneDigits = lead?.phone?.replace(/\D/g, '') ?? ''

  function updateStatus() {
    const statusId = selectedStatus || lead?.status?.id || ''
    const status = statuses.find((s) => s.id === statusId)
    if (!statusId) return setError('Selecione um status.')
    if (status?.kind === 'lost' && !lossReason.trim()) return setError('Informe o motivo da perda.')
    if (statusId === lead?.status?.id) return setError('Escolha um status diferente do atual.')
    setError('')
    setSuccess('')
    statusAction.mutate(statusId)
  }

  if (isLoading) return <div className="rounded-[30px] border border-border bg-white p-10 text-sm text-muted-foreground">Carregando lead...</div>
  if (isError || !lead) return <div role="alert" className="rounded-[30px] border border-border bg-white p-10 text-destructive">Lead não encontrado ou sem acesso.</div>

  return <div className="space-y-8">
    <div><Link href="/dashboard/leads" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Voltar para leads</Link><div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><p className="page-eyebrow mb-2">Ficha da oportunidade</p><h1 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-[-.055em] leading-[1.08]">{lead.name}</h1><p className="mt-3 text-sm text-muted-foreground">Recebido em {formatDate(lead.createdAt)}</p></div><span className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-primary">{lead.status?.name ?? 'Novo'}</span></div></div>
    {error && <p role="alert" className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
    {success && <p role="status" className="rounded-2xl bg-green-50 p-4 text-sm font-medium text-green-800">{success}</p>}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-6">
        <section className="rounded-[30px] border border-border bg-white p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="page-eyebrow mb-2">Sobre o contato</p><h2 className="text-2xl font-semibold tracking-tight">Dados do lead</h2></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-primary"><UserRound size={20} /></span></div><div className="mt-7 grid gap-5 sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Telefone</p><p className="mt-1 text-sm font-semibold">{lead.phone || 'Não informado'}</p></div><div><p className="text-xs text-muted-foreground">Email</p><p className="mt-1 break-all text-sm font-semibold">{lead.email || 'Não informado'}</p></div><div><p className="text-xs text-muted-foreground">Responsável</p><p className="mt-1 text-sm font-semibold">{lead.assignedUser?.name ?? 'Na fila geral'}</p></div><div><p className="text-xs text-muted-foreground">Origem</p><p className="mt-1 text-sm font-semibold">{lead.source || 'Catálogo'}</p></div></div>{lead.message && <div className="mt-7 rounded-2xl bg-[#f7f7f9] p-5"><p className="mb-2 text-xs font-semibold text-muted-foreground">Mensagem recebida</p><p className="text-sm leading-6">{lead.message}</p></div>}{lead.vehicle && <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary"><CarFront size={20} /></span><div><p className="text-xs text-muted-foreground">Veículo de interesse</p><p className="text-sm font-semibold">{lead.vehicle.model.brand.name} {lead.vehicle.model.name} {lead.vehicle.year}</p></div></div>}{assignedToMe && <div className="mt-6 flex flex-wrap gap-2">{lead.phone && <a className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:text-primary" href={`tel:${lead.phone}`}><Phone size={15} /> Ligar</a>}{phoneDigits && <a className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:text-primary" href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer"><MessageCircleMore size={15} /> WhatsApp</a>}{lead.email && <a className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:text-primary" href={`mailto:${lead.email}`}><Mail size={15} /> Email</a>}</div>}</section>
        <section className="rounded-[30px] border border-border bg-white p-6 sm:p-8"><p className="page-eyebrow mb-2">Atividade</p><h2 className="text-2xl font-semibold tracking-tight">Histórico da conversa</h2><div className="mt-7">{lead.interactions.length === 0 ? <div className="rounded-2xl bg-[#f7f7f9] p-8 text-center text-sm text-muted-foreground">Ainda não há interações registradas.</div> : <div className="space-y-0">{lead.interactions.map((item) => <div key={item.id} className="relative border-l border-border pb-7 pl-6 last:pb-0"><span className="absolute -left-[6px] top-1 h-3 w-3 rounded-full border-[3px] border-primary bg-white" /><p className="text-sm font-semibold">{item.type === 'loss_reason' ? 'Motivo da perda' : item.type === 'note' ? 'Observação' : item.type}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.note}</p><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 size={12} /> {formatDate(item.createdAt)}</p></div>)}</div>}</div></section>
      </div>
      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start"><div className="rounded-[30px] bg-[#1d1d1f] p-6 text-white sm:p-7"><p className="text-xs font-semibold uppercase tracking-[.14em] text-white/50">Próximo passo</p><h2 className="mt-3 text-xl font-semibold tracking-tight">{isOwner ? 'Defina quem vai atender.' : assignedToMe ? 'Continue o atendimento.' : 'Assuma esta oportunidade.'}</h2><p className="mt-2 text-sm leading-6 text-white/60">{isOwner ? 'Somente vendedores cadastrados podem atender e atualizar o lead.' : assignedToMe ? 'Registre cada contato e mantenha o status atualizado.' : 'Leads disponíveis podem ser assumidos por vendedores.'}</p>{canClaim && <Button className="mt-6 w-full" disabled={action.isPending} onClick={() => action.mutate(() => leadsService.claim(id))}>Assumir lead <ArrowUpRight size={16} /></Button>}{assignedToMe && <Button variant="outline" className="mt-6 w-full border-white/25 bg-transparent text-white hover:bg-white/10" disabled={action.isPending} onClick={() => action.mutate(() => leadsService.release(id))}>Devolver à fila</Button>}</div>
        {isOwner && <section className="rounded-[28px] border border-border bg-white p-6"><p className="page-eyebrow mb-2">Distribuição</p><h2 className="text-lg font-semibold">Atribuir vendedor</h2><p className="mt-1 text-xs text-muted-foreground">Atual: {lead.assignedUser?.name ?? 'Fila geral'}</p><select aria-label="Vendedor" value={selectedSeller} onChange={(e) => setSelectedSeller(e.target.value)} className="mt-5 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"><option value="">Escolha um vendedor</option>{sellers.filter((seller) => seller.role === 'SELLER').map((seller) => <option key={seller.id} value={seller.id}>{seller.name}</option>)}</select><Button className="mt-3 w-full" disabled={!selectedSeller || action.isPending} onClick={() => action.mutate(() => leadsService.update(id, { assignedUserId: selectedSeller }))}>Atribuir</Button>{lead.assignedUser && <Button variant="outline" className="mt-2 w-full" disabled={action.isPending} onClick={() => action.mutate(() => leadsService.update(id, { assignedUserId: null }))}>Devolver à fila</Button>}{!sellers.some((seller) => seller.role === 'SELLER') && <p className="mt-3 text-xs text-muted-foreground">Cadastre vendedores no aplicativo desktop.</p>}</section>}
        {assignedToMe && <section className="rounded-[28px] border border-border bg-white p-6"><p className="page-eyebrow mb-2">Atendimento</p><h2 className="text-lg font-semibold">Atualizar status</h2><select aria-label="Status do lead" value={selectedStatus || lead.status?.id || ''} onChange={(e) => { setSelectedStatus(e.target.value); setError(''); setSuccess('') }} className="mt-5 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"><option value="">Selecione o status</option>{statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}</select>{statuses.find((status) => status.id === (selectedStatus || lead.status?.id))?.kind === 'lost' && <textarea aria-label="Motivo da perda" value={lossReason} onChange={(e) => setLossReason(e.target.value)} placeholder="Por que a venda não avançou?" className="mt-3 min-h-24 w-full rounded-xl border border-input bg-white p-3 text-sm" />}<Button className="mt-3 w-full" disabled={action.isPending || statusAction.isPending || !selectedStatus || selectedStatus === lead.status?.id} onClick={updateStatus}>{statusAction.isPending ? 'Salvando status...' : 'Salvar status'}</Button>{success && <p role="status" className="mt-3 text-sm font-medium text-green-700">{success}</p>}<div className="my-6 h-px bg-border" /><label htmlFor="lead-note" className="text-sm font-semibold">Nova observação</label><textarea id="lead-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Registre o que foi conversado..." className="mt-3 min-h-28 w-full rounded-xl border border-input bg-white p-3 text-sm" /><Button variant="outline" className="mt-3 w-full" disabled={!note.trim() || action.isPending || statusAction.isPending} onClick={() => action.mutate(async () => { await leadsService.addInteraction(id, { type: 'note', note: note.trim() }); setNote('') })}><Send size={15} /> Adicionar observação</Button></section>}
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 text-xs text-muted-foreground"><CalendarDays size={17} className="text-primary" /> Criado em {formatDate(lead.createdAt)}</div>
      </aside>
    </div>
  </div>
}
