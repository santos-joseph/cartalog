'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, ArrowUpRight, Inbox, MessageCircleMore, Search, UserRound } from 'lucide-react'
import { leadsService } from '@/services/leads.service'
import { useAuthStore } from '@/stores/auth.store'
import { formatRelativeDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Lead, PaginatedResponse } from '@/types'

export default function LeadsPage() {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [scope, setScope] = useState<'queue' | 'mine' | 'all'>('queue')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const isSeller = user?.role === 'SELLER'
  const tabs: Array<{ id: 'queue' | 'mine' | 'all'; label: string }> = isSeller ? [{ id: 'queue', label: 'Fila geral' }, { id: 'mine', label: 'Meus leads' }] : [{ id: 'queue', label: 'Fila geral' }, { id: 'all', label: 'Todos os leads' }]
  const activeScope = tabs.some((tab) => tab.id === scope) ? scope : tabs[0].id
  const { data, isLoading, isError } = useQuery<PaginatedResponse<Lead>>({ queryKey: ['leads', activeScope, search, page], queryFn: () => leadsService.list({ scope: activeScope, search: search || undefined, page }).then((r) => r.data) })
  const claim = useMutation({ mutationFn: (id: string) => leadsService.claim(id), onSuccess: () => { setError(''); qc.invalidateQueries({ queryKey: ['leads'] }) }, onError: () => setError('Este lead já foi assumido ou não está disponível.') })

  return <div className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="page-eyebrow mb-2">Relacionamento</p><h1 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-[-.055em] leading-[1.08]">Cada conversa importa.</h1><p className="mt-3 text-muted-foreground">{isSeller ? 'Encontre uma oportunidade e comece o atendimento.' : 'Acompanhe as oportunidades e distribua para sua equipe.'}</p></div><div className="flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm shadow-sm ring-1 ring-border"><MessageCircleMore size={17} className="text-primary" /><strong>{data?.meta.total ?? 0}</strong><span className="text-muted-foreground">nesta visão</span></div></div>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="min-w-0 overflow-hidden rounded-[30px] border border-border bg-white shadow-[0_12px_35px_rgba(20,20,25,.035)]">
        <div className="border-b border-border p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="inline-flex self-start rounded-full bg-muted p-1" role="tablist" aria-label="Visualização de leads">{tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={activeScope === tab.id} onClick={() => { setScope(tab.id); setPage(1) }} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${activeScope === tab.id ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{tab.label}</button>)}</div><div className="relative w-full sm:w-64"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><input aria-label="Buscar leads" placeholder="Buscar leads" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="h-10 w-full rounded-full border border-input bg-white pl-11 pr-4 text-sm outline-none focus:border-primary" /></div></div></div>
        {error && <p role="alert" className="mx-6 mt-5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {isError && <p role="alert" className="mx-6 mt-5 text-sm text-destructive">Não foi possível carregar os leads.</p>}
        {isLoading ? <div className="p-10 text-sm text-muted-foreground">Carregando oportunidades...</div> : !data?.data.length ? <div className="px-7 py-20 text-center"><span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary"><Inbox size={25} /></span><h2 className="font-semibold">Nenhum lead nesta lista</h2><p className="mt-2 text-sm text-muted-foreground">As oportunidades vão aparecer aqui.</p></div> : <div className="divide-y divide-border">{data.data.map((lead) => <article key={lead.id} className="group flex flex-col gap-4 p-5 transition-colors hover:bg-[#fafafa] sm:flex-row sm:items-center sm:px-7"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-primary"><UserRound size={20} /></span><div className="min-w-0 flex-1"><Link href={`/dashboard/leads/${lead.id}`} className="text-base font-semibold text-foreground hover:text-primary">{lead.name}</Link><p className="mt-1 text-sm text-muted-foreground">{lead.vehicle ? `${lead.vehicle.model.brand.name} ${lead.vehicle.model.name} ${lead.vehicle.year}` : 'Contato geral'} · {formatRelativeDate(lead.createdAt)}</p><p className="mt-2 text-xs text-muted-foreground">{lead.assignedUser ? `Com ${lead.assignedUser.name}` : 'Aguardando vendedor'}</p></div><div className="flex shrink-0 flex-wrap items-center gap-3"><span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium">{lead.status?.name ?? 'Novo'}</span>{isSeller && !lead.assignedUser && <Button size="sm" disabled={claim.isPending} onClick={() => claim.mutate(lead.id)}>Assumir</Button>}<Link href={`/dashboard/leads/${lead.id}`} aria-label={`Abrir ${lead.name}`} className="grid h-9 w-9 place-items-center rounded-full border border-border text-primary hover:bg-accent"><ArrowUpRight size={17} /></Link></div></article>)}</div>}
        {data && data.meta.lastPage > 1 && <div className="flex items-center justify-between border-t border-border px-6 py-4 text-sm"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button><span className="text-muted-foreground">{page} / {data.meta.lastPage}</span><Button variant="outline" size="sm" disabled={page >= data.meta.lastPage} onClick={() => setPage(page + 1)}>Próxima</Button></div>}
      </section>
      <aside className="space-y-5"><div className="rounded-[28px] bg-[#1d1d1f] p-7 text-white"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><MessageCircleMore size={21} /></span><h2 className="mt-7 text-xl font-semibold tracking-tight">O próximo negócio começa aqui.</h2><p className="mt-3 text-sm leading-6 text-white/60">{isSeller ? 'Assuma um lead da fila, registre as conversas e mantenha o status atualizado.' : 'Abra um lead para escolher o vendedor responsável e acompanhar o histórico.'}</p><div className="mt-6 h-px bg-white/15" /><p className="mt-5 text-xs text-white/60">{isSeller ? 'Atendimento disponível na web e no app mobile.' : 'Somente vendedores atendem leads.'}</p></div><div className="rounded-[28px] border border-border bg-white p-6"><p className="page-eyebrow mb-2">Fluxo</p><h2 className="text-lg font-semibold">Organize o atendimento</h2><div className="mt-6 space-y-5">{[isSeller ? 'Escolha na fila' : 'Distribua o lead', 'Registre o contato', 'Atualize o status'].map((step, index) => <div key={step} className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-primary">0{index + 1}</span><span className="text-sm font-medium">{step}</span></div>)}</div><Link href={isSeller ? '/dashboard/leads' : '/dashboard'} className="mt-7 inline-flex items-center gap-1 text-sm font-semibold text-primary">{isSeller ? 'Ver oportunidades' : 'Voltar ao painel'} <ArrowRight size={15} /></Link></div></aside>
    </div>
  </div>
}
