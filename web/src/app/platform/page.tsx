'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Building2, CreditCard, FileClock, LayoutDashboard, LogOut, Mail, Plus, RefreshCw, Shield, Users } from 'lucide-react'
import { PlatformApiError, platformRequest, platformTokenKey } from '@/lib/platform-api'

type PlatformUser = { id: string; name: string; email: string; role: 'PLATFORM_OWNER' | 'PLATFORM_ADMIN'; isActive?: boolean; createdAt?: string }
type Plan = { id: string; code: string; name: string; priceCents: number; billingInterval: string; isActive: boolean; _count?: { subscriptions: number } }
type Subscription = { planId: string; status: string; currentPeriodEnd: string | null; notes: string | null; plan: Plan }
type Company = { id: string; name: string; slug: string; email: string; createdAt: string; users: { name: string; email: string }[]; subscription: Subscription | null; siteSettings: { maintenanceEnabled: boolean } | null; _count: { vehicles: number; leads: number; users: number } }
type DemoRequest = { id: string; name: string; email: string; companyName?: string | null; phone?: string | null; message?: string | null; createdAt: string }
type Audit = { id: string; action: string; target: string; createdAt: string; actor: { name: string; email: string } }
type Tab = 'overview' | 'companies' | 'plans' | 'requests' | 'admins' | 'audit'
const card = 'rounded-2xl border border-[#e8e8e8] bg-white shadow-sm'
const input = 'w-full rounded-xl border border-[#dedede] bg-white px-4 py-3 text-sm outline-none focus:border-[#d90429]'
const button = 'rounded-xl bg-[#d90429] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad0825] disabled:opacity-50'
const statusNames: Record<string, string> = { trialing: 'Teste', active: 'Ativa', past_due: 'Atrasada', suspended: 'Suspensa', canceled: 'Cancelada' }
const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const date = (value: string) => new Date(value).toLocaleDateString('pt-BR')

export default function PlatformPanel() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [me, setMe] = useState<PlatformUser | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [overview, setOverview] = useState({ companies: 0, demoRequests: 0, activeSubscriptions: 0, plans: 0 })
  const [companies, setCompanies] = useState<Company[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [requests, setRequests] = useState<DemoRequest[]>([])
  const [admins, setAdmins] = useState<PlatformUser[]>([])
  const [audit, setAudit] = useState<Audit[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [companyForm, setCompanyForm] = useState({ companyName: '', companyEmail: '', companyPhone: '', userName: '', userEmail: '', password: '', planId: '' })
  const [planForm, setPlanForm] = useState({ code: '', name: '', price: '', billingInterval: 'monthly' })
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' })
  const [subscriptionForms, setSubscriptionForms] = useState<Record<string, { planId: string; status: string; end: string; notes: string }>>({})
  const [showCompanyForm, setShowCompanyForm] = useState(false)

  const load = useCallback(async (authToken: string) => {
    const [who, summary, stores, availablePlans, demos] = await Promise.all([
      platformRequest<PlatformUser>('/me', authToken),
      platformRequest<typeof overview>('/overview', authToken),
      platformRequest<Company[]>('/companies', authToken),
      platformRequest<Plan[]>('/plans', authToken),
      platformRequest<DemoRequest[]>('/demo-requests', authToken),
    ])
    setMe(who); setOverview(summary); setCompanies(stores); setPlans(availablePlans); setRequests(demos)
    const forms: typeof subscriptionForms = {}
    stores.forEach((store) => { forms[store.id] = { planId: store.subscription?.planId || '', status: store.subscription?.status || 'trialing', end: store.subscription?.currentPeriodEnd?.slice(0, 10) || '', notes: store.subscription?.notes || '' } })
    setSubscriptionForms(forms)
    if (who.role === 'PLATFORM_OWNER') {
      const [staff, history] = await Promise.all([platformRequest<PlatformUser[]>('/admins', authToken), platformRequest<Audit[]>('/audit', authToken)])
      setAdmins(staff); setAudit(history)
    }
  }, [])

  useEffect(() => {
    const authToken = sessionStorage.getItem(platformTokenKey)
    if (!authToken) { router.replace('/platform/login'); return }
    Promise.resolve().then(() => load(authToken)).then(() => setToken(authToken)).catch((cause) => {
      if (cause instanceof PlatformApiError && cause.status === 401) { sessionStorage.removeItem(platformTokenKey); router.replace('/platform/login'); return }
      setToken(authToken)
      setError(cause instanceof Error ? cause.message : 'Não foi possível conectar à API.')
    })
  }, [load, router])

  function logout() { sessionStorage.removeItem(platformTokenKey); router.replace('/platform/login') }
  async function action(task: () => Promise<unknown>, success: string) {
    setBusy(true); setError(''); setNotice('')
    try { await task(); await load(token); setNotice(success) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a operação.') }
    finally { setBusy(false) }
  }

  function createCompany(event: FormEvent) {
    event.preventDefault()
    action(async () => {
      const { planId, companyPhone, ...rest } = companyForm
      await platformRequest('/companies', token, { method: 'POST', body: JSON.stringify({ ...rest, companyPhone: companyPhone || undefined, planId: planId || undefined }) })
      setCompanyForm({ companyName: '', companyEmail: '', companyPhone: '', userName: '', userEmail: '', password: '', planId: '' })
      setShowCompanyForm(false)
    }, 'Empresa e conta do dono criadas.')
  }
  function createPlan(event: FormEvent) {
    event.preventDefault()
    action(async () => {
      await platformRequest('/plans', token, { method: 'POST', body: JSON.stringify({ code: planForm.code, name: planForm.name, priceCents: Math.round(Number(planForm.price.replace(',', '.')) * 100), billingInterval: planForm.billingInterval, isActive: true }) })
      setPlanForm({ code: '', name: '', price: '', billingInterval: 'monthly' })
    }, 'Plano criado.')
  }
  function createAdmin(event: FormEvent) {
    event.preventDefault()
    action(async () => {
      await platformRequest('/admins', token, { method: 'POST', body: JSON.stringify(adminForm) })
      setAdminForm({ name: '', email: '', password: '' })
    }, 'Administrador criado.')
  }
  function saveSubscription(companyId: string) {
    const form = subscriptionForms[companyId]
    if (!form?.planId) { setError('Selecione um plano para a assinatura.'); return }
    action(() => platformRequest(`/companies/${companyId}/subscription`, token, { method: 'PUT', body: JSON.stringify({ planId: form.planId, status: form.status, currentPeriodEnd: form.end ? new Date(`${form.end}T12:00:00.000Z`).toISOString() : null, notes: form.notes || null }) }), 'Assinatura atualizada.')
  }

  const nav: { id: Tab; label: string; Icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Visão geral', Icon: LayoutDashboard }, { id: 'companies', label: 'Empresas', Icon: Building2 },
    { id: 'plans', label: 'Planos', Icon: CreditCard }, { id: 'requests', label: 'Demonstrações', Icon: Mail },
    ...(me?.role === 'PLATFORM_OWNER' ? [{ id: 'admins' as Tab, label: 'Administradores', Icon: Users }, { id: 'audit' as Tab, label: 'Auditoria', Icon: FileClock }] : []),
  ]

  if (!me) return <div className="min-h-screen bg-[#f5f5f5] grid place-items-center text-[#555]"><div className="text-center">{error ? <><p role="alert">{error}</p><button className={button + ' mt-5'} onClick={() => action(() => load(token), 'Dados atualizados.')}>Tentar novamente</button></> : 'Carregando painel global…'}</div></div>
  return <div className="min-h-screen bg-[#f5f5f4] text-[#222] lg:flex">
    <aside className="bg-[#19191c] text-white lg:w-[250px] shrink-0 px-5 py-7 lg:min-h-screen flex flex-col"><Image src="/brand/cartalog-logo-white.png" alt="Cartalog" width={160} height={52} className="h-10 w-auto object-contain object-left px-2" /><div className="mt-12 mb-4 px-3 text-[10px] font-bold tracking-[0.2em] text-[#85858d]">PLATAFORMA</div><nav className="flex lg:flex-col gap-1 overflow-x-auto">{nav.map(({ id, label, Icon }) => <button key={id} onClick={() => { setTab(id); setError(''); setNotice('') }} className={`shrink-0 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-left ${tab === id ? 'bg-[#d90429] text-white' : 'text-[#b9b9be] hover:bg-white/10 hover:text-white'}`}><Icon size={18} />{label}</button>)}</nav><div className="mt-auto hidden lg:block pt-10"><div className="rounded-2xl bg-white/5 p-4 text-xs text-white/60"><Shield size={18} className="text-[#ff596a] mb-3" />Acesso global · {me.role === 'PLATFORM_OWNER' ? 'Proprietário' : 'Administrador'}</div><button onClick={logout} className="flex items-center gap-3 text-sm text-white/60 hover:text-white px-4 py-4 mt-2"><LogOut size={17} /> Sair</button></div></aside>
    <div className="flex-1 min-w-0"><header className="h-20 bg-white border-b border-[#e8e8e8] flex items-center justify-between px-6 lg:px-10"><div className="text-xs text-[#888]">Cartalog <span className="mx-3 text-[#ccc]">/</span> <strong className="text-[#333]">{nav.find((item) => item.id === tab)?.label}</strong></div><div className="flex items-center gap-4 text-sm"><span className="hidden sm:inline">{me.name}</span><button onClick={() => action(() => load(token), 'Dados atualizados.')} title="Atualizar" className="text-[#777] hover:text-[#d90429]"><RefreshCw size={18} /></button><button onClick={logout} className="lg:hidden text-[#777]"><LogOut size={18} /></button></div></header>
      <main className="max-w-[1440px] mx-auto p-6 lg:p-10"><div className="flex flex-wrap justify-between items-end gap-5 mb-8"><div><span className="text-[#d90429] text-xs font-bold tracking-[0.18em]">CARTALOG GLOBAL</span><h1 className="text-3xl font-bold mt-2">{nav.find((item) => item.id === tab)?.label}</h1><p className="text-[#777] mt-2">Gerencie a plataforma e acompanhe as lojas em um só lugar.</p></div>{tab === 'companies' && <button className={button + ' flex items-center gap-2'} onClick={() => setShowCompanyForm((value) => !value)}><Plus size={17} /> Nova empresa</button>}</div>
        {error && <div role="alert" className="mb-5 rounded-xl bg-[#fff0f1] text-[#ac0822] p-4 text-sm">{error}</div>}{notice && <div role="status" className="mb-5 rounded-xl bg-[#eaf7ee] text-[#267443] p-4 text-sm">{notice}</div>}
        {tab === 'overview' && <><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{[{ label: 'Empresas', value: overview.companies, Icon: Building2 }, { label: 'Assinaturas ativas', value: overview.activeSubscriptions, Icon: CreditCard }, { label: 'Pedidos de demonstração', value: overview.demoRequests, Icon: Mail }, { label: 'Planos', value: overview.plans, Icon: LayoutDashboard }].map(({ label, value, Icon }) => <div key={label} className={card + ' p-6'}><div className="w-11 h-11 rounded-xl bg-[#fff0f1] text-[#d90429] grid place-items-center"><Icon size={20} /></div><div className="text-4xl font-bold mt-6">{value}</div><div className="text-sm text-[#777] mt-2">{label}</div></div>)}</div><div className="grid xl:grid-cols-2 gap-5 mt-6"><section className={card + ' p-6'}><h2 className="font-bold text-xl mb-5">Empresas recentes</h2>{companies.slice(0, 5).map((company) => <div key={company.id} className="flex justify-between gap-3 py-3 border-t border-[#eee]"><div><strong>{company.name}</strong><div className="text-xs text-[#888]">{company.slug}</div></div><span className="text-sm text-[#777]">{company.subscription ? statusNames[company.subscription.status] : 'Sem plano'}</span></div>)}{!companies.length && <p className="text-sm text-[#888]">Nenhuma empresa criada.</p>}</section><section className={card + ' p-6'}><h2 className="font-bold text-xl mb-5">Demonstrações recentes</h2>{requests.slice(0, 5).map((request) => <div key={request.id} className="flex justify-between gap-3 py-3 border-t border-[#eee]"><div><strong>{request.name}</strong><div className="text-xs text-[#888]">{request.email}</div></div><span className="text-sm text-[#777]">{date(request.createdAt)}</span></div>)}{!requests.length && <p className="text-sm text-[#888]">Nenhum pedido recebido.</p>}</section></div></>}
        {tab === 'companies' && <>{showCompanyForm && <form onSubmit={createCompany} autoComplete="off" className={card + ' p-6 mb-6'}><h2 className="text-xl font-bold mb-2">Criar empresa e conta do dono</h2><p className="text-sm text-[#777] mb-6">O dono entra no desktop; os vendedores são cadastrados por ele.</p><div className="grid md:grid-cols-2 gap-4"><label className="text-sm font-semibold">Nome da empresa<input className={input + ' mt-2'} required value={companyForm.companyName} onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })} /></label><label className="text-sm font-semibold">E-mail da empresa<input type="email" className={input + ' mt-2'} required value={companyForm.companyEmail} onChange={(e) => setCompanyForm({ ...companyForm, companyEmail: e.target.value })} /></label><label className="text-sm font-semibold">Telefone<input className={input + ' mt-2'} value={companyForm.companyPhone} onChange={(e) => setCompanyForm({ ...companyForm, companyPhone: e.target.value })} /></label><label className="text-sm font-semibold">Plano inicial<select className={input + ' mt-2'} value={companyForm.planId} onChange={(e) => setCompanyForm({ ...companyForm, planId: e.target.value })}><option value="">Sem plano</option>{plans.filter((plan) => plan.isActive).map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label><label className="text-sm font-semibold">Nome do dono<input className={input + ' mt-2'} required value={companyForm.userName} onChange={(e) => setCompanyForm({ ...companyForm, userName: e.target.value })} /></label><label className="text-sm font-semibold">E-mail do dono<input type="email" className={input + ' mt-2'} required value={companyForm.userEmail} onChange={(e) => setCompanyForm({ ...companyForm, userEmail: e.target.value })} /></label><label className="text-sm font-semibold">Senha temporária<input type="password" autoComplete="new-password" minLength={8} className={input + ' mt-2'} required value={companyForm.password} onChange={(e) => setCompanyForm({ ...companyForm, password: e.target.value })} /></label></div><button className={button + ' mt-6'} disabled={busy}>Criar empresa</button></form>}
          <div className="space-y-5">{companies.map((company) => <section key={company.id} className={card + ' p-6'}><div className="flex flex-wrap justify-between gap-4"><div><div className="flex items-center gap-3"><h2 className="text-xl font-bold">{company.name}</h2>{company.siteSettings?.maintenanceEnabled && <span className="text-xs rounded-full bg-[#fff0d9] text-[#94600d] px-3 py-1">Em manutenção</span>}</div><p className="text-sm text-[#888] mt-1">{company.slug} · Criada em {date(company.createdAt)}</p></div><div className="text-sm text-[#666]">{company._count.vehicles} veículos · {company._count.leads} leads · {company._count.users} usuários</div></div><div className="text-sm mt-5 p-4 rounded-xl bg-[#f8f8f8]"><strong>Dono:</strong> {company.users[0]?.name || '—'} · {company.users[0]?.email || '—'}<br /><strong>Empresa:</strong> {company.email}</div><div className="grid md:grid-cols-4 gap-3 mt-5"><label className="text-xs font-semibold text-[#777]">Plano<select className={input + ' mt-1'} value={subscriptionForms[company.id]?.planId || ''} onChange={(e) => setSubscriptionForms({ ...subscriptionForms, [company.id]: { ...subscriptionForms[company.id], planId: e.target.value } })}><option value="">Selecionar</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}{!plan.isActive ? ' (inativo)' : ''}</option>)}</select></label><label className="text-xs font-semibold text-[#777]">Situação<select className={input + ' mt-1'} value={subscriptionForms[company.id]?.status || 'trialing'} onChange={(e) => setSubscriptionForms({ ...subscriptionForms, [company.id]: { ...subscriptionForms[company.id], status: e.target.value } })}>{Object.entries(statusNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="text-xs font-semibold text-[#777]">Fim do período<input type="date" className={input + ' mt-1'} value={subscriptionForms[company.id]?.end || ''} onChange={(e) => setSubscriptionForms({ ...subscriptionForms, [company.id]: { ...subscriptionForms[company.id], end: e.target.value } })} /></label><label className="text-xs font-semibold text-[#777]">Observação<input className={input + ' mt-1'} maxLength={1000} value={subscriptionForms[company.id]?.notes || ''} onChange={(e) => setSubscriptionForms({ ...subscriptionForms, [company.id]: { ...subscriptionForms[company.id], notes: e.target.value } })} /></label></div><button disabled={busy || !plans.length} onClick={() => saveSubscription(company.id)} className={button + ' mt-4'}>Salvar assinatura</button></section>)}{!companies.length && <p className={card + ' p-8 text-[#888]'}>Ainda não há empresas cadastradas.</p>}</div></>}
        {tab === 'plans' && <div className="grid xl:grid-cols-[380px_1fr] gap-5"><form onSubmit={createPlan} className={card + ' p-6 h-fit'}><h2 className="text-xl font-bold mb-5">Novo plano</h2><div className="space-y-4"><label className="block text-sm font-semibold">Código<input className={input + ' mt-2'} pattern="[a-z0-9-]{2,50}" placeholder="ex: profissional" required value={planForm.code} onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })} /></label><label className="block text-sm font-semibold">Nome<input className={input + ' mt-2'} required value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} /></label><label className="block text-sm font-semibold">Preço em R$<input type="number" min="0" step="0.01" className={input + ' mt-2'} required value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} /></label><label className="block text-sm font-semibold">Cobrança<select className={input + ' mt-2'} value={planForm.billingInterval} onChange={(e) => setPlanForm({ ...planForm, billingInterval: e.target.value })}><option value="monthly">Mensal</option><option value="yearly">Anual</option></select></label></div><button disabled={busy} className={button + ' mt-5'}>Criar plano</button><p className="text-xs text-[#888] mt-4">A situação da assinatura é controlada manualmente no cadastro da empresa.</p></form><div className="space-y-4">{plans.map((plan) => <div key={plan.id} className={card + ' p-6 flex flex-wrap gap-4 justify-between items-center'}><div><div className="text-xs text-[#d90429] uppercase font-bold tracking-wider">{plan.code}</div><h3 className="font-bold text-xl mt-1">{plan.name}</h3><p className="text-sm text-[#888]">{plan._count?.subscriptions || 0} empresas · {plan.billingInterval === 'yearly' ? 'Anual' : 'Mensal'}</p></div><div className="text-right"><div className="text-2xl font-bold">{money(plan.priceCents)}</div><button disabled={busy} onClick={() => action(() => platformRequest(`/plans/${plan.id}`, token, { method: 'PATCH', body: JSON.stringify({ isActive: !plan.isActive }) }), plan.isActive ? 'Plano desativado.' : 'Plano ativado.')} className="text-sm text-[#d90429] mt-2">{plan.isActive ? 'Desativar' : 'Ativar'}</button></div></div>)}{!plans.length && <p className={card + ' p-8 text-[#888]'}>Crie o primeiro plano para organizar as assinaturas.</p>}</div></div>}
        {tab === 'requests' && <div className="grid lg:grid-cols-2 gap-4">{requests.map((request) => <article key={request.id} className={card + ' p-6'}><div className="flex justify-between gap-3"><h2 className="font-bold text-lg">{request.name}</h2><time className="text-xs text-[#888]">{date(request.createdAt)}</time></div><p className="text-sm text-[#777] mt-1">{request.companyName || 'Empresa não informada'}</p><div className="mt-5 text-sm space-y-2"><p><strong>E-mail:</strong> <a href={`mailto:${request.email}`} className="text-[#d90429]">{request.email}</a></p>{request.phone && <p><strong>Telefone:</strong> {request.phone}</p>}{request.message && <p className="border-t border-[#eee] pt-3 text-[#666]">{request.message}</p>}</div></article>)}{!requests.length && <p className={card + ' p-8 text-[#888]'}>Nenhuma solicitação recebida.</p>}</div>}
        {tab === 'admins' && me.role === 'PLATFORM_OWNER' && <div className="grid xl:grid-cols-[380px_1fr] gap-5"><form onSubmit={createAdmin} autoComplete="off" className={card + ' p-6 h-fit'}><h2 className="text-xl font-bold mb-5">Novo administrador</h2><div className="space-y-4"><label className="block text-sm font-semibold">Nome<input className={input + ' mt-2'} required value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} /></label><label className="block text-sm font-semibold">E-mail<input type="email" className={input + ' mt-2'} required value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} /></label><label className="block text-sm font-semibold">Senha temporária<input type="password" autoComplete="new-password" minLength={8} className={input + ' mt-2'} required value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} /></label></div><button disabled={busy} className={button + ' mt-5'}>Adicionar administrador</button></form><div className="space-y-4">{admins.map((admin) => <div key={admin.id} className={card + ' p-6 flex justify-between gap-4 items-center'}><div><h3 className="font-bold">{admin.name}</h3><p className="text-sm text-[#777]">{admin.email}</p><p className="text-xs mt-2 text-[#888]">{admin.role === 'PLATFORM_OWNER' ? 'Proprietário global' : 'Administrador'} · {admin.isActive ? 'Ativo' : 'Inativo'}</p></div>{admin.role !== 'PLATFORM_OWNER' && <button disabled={busy} className="text-sm text-[#d90429]" onClick={() => action(() => platformRequest(`/admins/${admin.id}/active`, token, { method: 'PATCH', body: JSON.stringify({ isActive: !admin.isActive }) }), 'Acesso atualizado.')}>{admin.isActive ? 'Desativar' : 'Reativar'}</button>}</div>)}</div></div>}
        {tab === 'audit' && me.role === 'PLATFORM_OWNER' && <div className={card + ' divide-y divide-[#eee]'}>{audit.map((entry) => <div key={entry.id} className="p-5 flex flex-wrap justify-between gap-2 text-sm"><div><strong>{entry.action.replaceAll('_', ' ')}</strong><span className="text-[#888] ml-3">{entry.target}</span><div className="text-xs text-[#888] mt-1">{entry.actor?.email}</div></div><time className="text-[#888]">{new Date(entry.createdAt).toLocaleString('pt-BR')}</time></div>)}{!audit.length && <p className="p-8 text-[#888]">Sem eventos registrados.</p>}</div>}
      </main>
    </div>
  </div>
}
