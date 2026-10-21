'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ArrowUpRight, CarFront, CircleDot, MessageCircleMore, Plus, TrendingUp } from 'lucide-react'
import { dashboardService } from '@/services/dashboard.service'
import { useAuthStore } from '@/stores/auth.store'
import { formatCurrency, formatRelativeDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardOverview } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const company = useAuthStore((s) => s.company)
  useEffect(() => { if (user?.role === 'SELLER') router.replace('/dashboard/leads') }, [user?.role, router])
  const { data, isLoading, isError } = useQuery<DashboardOverview>({
    queryKey: ['dashboard'], queryFn: () => dashboardService.overview().then((r) => r.data), enabled: user?.role === 'OWNER',
  })
  if (user?.role === 'SELLER') return null
  if (isLoading) return <div className="grid gap-5 md:grid-cols-3"><Skeleton className="h-72 rounded-[30px] md:col-span-2" /><Skeleton className="h-72 rounded-[30px]" /><Skeleton className="h-52 rounded-[30px] md:col-span-3" /></div>
  if (isError || !data) return <div className="rounded-[28px] border border-border bg-white p-10"><h1 className="text-xl font-semibold">Não foi possível carregar o painel</h1><p className="mt-2 text-sm text-muted-foreground">Atualize a página para tentar novamente.</p></div>

  const openLeads = data.leads.byStatus.filter((status) => status.kind === 'open').reduce((sum, status) => sum + status.count, 0)
  const maxStage = Math.max(1, ...data.leads.byStatus.map((status) => status.count))

  return <div className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="page-eyebrow mb-2">Área de trabalho / {company?.name}</p><h1 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-[-.055em] leading-[1.08]">Bom dia, {user?.name?.split(' ')[0]}.</h1><p className="mt-3 text-muted-foreground">Aqui está o movimento da sua loja.</p></div>
      <Link href="/dashboard/vehicles/new" className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark"><Plus size={17} /> Cadastrar veículo</Link>
    </div>

    <div className="grid gap-5 md:grid-cols-[1.55fr_1fr]">
      <section className="relative flex min-h-[305px] flex-col justify-between overflow-hidden rounded-[32px] border border-border bg-white p-7 sm:p-9 shadow-[0_14px_44px_rgba(20,20,25,.035)]">
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[45px] border-primary/[.035]" aria-hidden="true" />
        <div className="relative"><span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-primary"><CircleDot size={13} /> Operação em tempo real</span><h2 className="mt-5 max-w-lg text-3xl font-semibold tracking-[-.05em] sm:text-[2.65rem] sm:leading-[1.12]">Seu estoque e seus leads, sob controle.</h2><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Acompanhe o que entrou, o que está em atendimento e os veículos prontos para vender.</p></div>
        <div className="relative mt-8 flex flex-wrap gap-3"><Link href="/dashboard/leads" className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white hover:bg-primary">Ver leads <ArrowRight size={15} /></Link><Link href="/dashboard/vehicles" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold hover:border-primary/30 hover:text-primary">Ver estoque <ArrowUpRight size={15} /></Link></div>
      </section>
      <section className="relative flex min-h-[305px] flex-col justify-between overflow-hidden rounded-[32px] bg-[#c70920] p-7 text-white sm:p-9">
        <div className="absolute -right-28 -top-20 h-80 w-80 rounded-full border-[55px] border-white/[.07]" aria-hidden="true" />
        <div className="relative"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[.14em] text-white/65">Oportunidades</span><MessageCircleMore size={21} className="text-white/70" /></div><p className="mt-8 text-[5.5rem] font-semibold leading-none tracking-[-.09em]">{data.leads.newThisMonth}</p><h2 className="mt-3 text-xl font-semibold">leads nos últimos 30 dias</h2><p className="mt-2 text-sm text-white/75">{openLeads} em andamento · {data.leads.total} no histórico</p></div>
        <Link href="/dashboard/leads" className="relative mt-8 inline-flex items-center gap-1 text-sm font-semibold hover:underline">Acompanhar conversas <ArrowUpRight size={16} /></Link>
      </section>
    </div>

    <div className="grid gap-5 sm:grid-cols-3">
      {[
        { label: 'Disponíveis', value: data.vehicles.available, detail: 'veículos prontos para venda', icon: CarFront },
        { label: 'Reservados', value: data.vehicles.reserved, detail: 'aguardando conclusão', icon: CircleDot },
        { label: 'Vendidos', value: data.vehicles.sold, detail: 'negócios concluídos', icon: TrendingUp },
      ].map(({ label, value, detail, icon: Icon }) => <div key={label} className="rounded-[26px] border border-border bg-white p-6"><div className="flex items-center justify-between"><span className="text-sm font-medium text-muted-foreground">{label}</span><Icon size={18} className="text-primary" /></div><div className="mt-6 text-[3.3rem] font-semibold leading-none tracking-[-.07em]">{value}</div><p className="mt-2 text-xs text-muted-foreground">{detail}</p></div>)}
    </div>

    <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
      <section className="rounded-[28px] border border-border bg-white p-6 sm:p-7"><div className="mb-5 flex items-center justify-between"><div><p className="page-eyebrow mb-1">Relacionamento</p><h2 className="text-xl font-semibold tracking-tight">Leads recentes</h2></div><Link href="/dashboard/leads" className="text-sm font-semibold text-primary">Ver todos <ArrowUpRight size={14} className="inline" /></Link></div><div className="divide-y divide-border">{data.recentLeads.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Ainda não há leads.</p> : data.recentLeads.map((lead) => <Link href={`/dashboard/leads/${lead.id}`} key={lead.id} className="flex items-center gap-3 py-4 hover:text-primary"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent text-sm font-bold text-primary">{lead.name.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{lead.name}</span><span className="text-xs text-muted-foreground">{formatRelativeDate(lead.createdAt)}</span></span><span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-foreground">{lead.status?.name ?? 'Novo'}</span></Link>)}</div></section>
      <section className="rounded-[28px] border border-border bg-white p-6 sm:p-7"><div className="mb-5"><p className="page-eyebrow mb-1">Movimento</p><h2 className="text-xl font-semibold tracking-tight">Funil de leads</h2></div><div className="space-y-5">{data.leads.byStatus.map((status) => <div key={status.id}><div className="mb-2 flex justify-between text-sm"><span className="text-muted-foreground">{status.name}</span><strong className="font-semibold">{status.count}</strong></div><div className="h-2 rounded-full bg-[#f1f1f3]"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(status.count ? 7 : 0, status.count / maxStage * 100)}%` }} /></div></div>)}</div></section>
    </div>

    <section className="rounded-[28px] border border-border bg-white p-6 sm:p-7"><div className="mb-5 flex items-center justify-between"><div><p className="page-eyebrow mb-1">Estoque</p><h2 className="text-xl font-semibold tracking-tight">Veículos mais vistos</h2></div><Link href="/dashboard/vehicles" className="text-sm font-semibold text-primary">Abrir estoque <ArrowUpRight size={14} className="inline" /></Link></div>{data.topViewedVehicles.length === 0 ? <p className="py-8 text-sm text-muted-foreground">As visitas aos veículos vão aparecer aqui.</p> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.topViewedVehicles.map((vehicle) => <div key={vehicle.id} className="flex items-center gap-4 rounded-2xl bg-[#f7f7f9] p-3"><span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-accent text-primary">{vehicle.images?.[0] ? <img src={`${process.env.NEXT_PUBLIC_API_URL}${vehicle.images[0].imageUrl}`} alt="" className="h-full w-full object-cover" /> : <CarFront size={23} />}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{vehicle.model.brand.name} {vehicle.model.name}</p><p className="text-xs text-muted-foreground">{formatCurrency(vehicle.price)} · {vehicle.viewCount} visitas</p></div></div>)}</div>}</section>
  </div>
}
