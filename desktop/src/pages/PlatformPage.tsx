import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Building2, CreditCard, FileClock, LayoutDashboard, LogOut, Mail, Plus, RefreshCw, ShieldCheck, UsersRound } from 'lucide-react'
import logoWhite from '../../assets/cartalog-logo-white.png'
import type { DemoRequest, PlatformAudit, PlatformCompany, PlatformDesktopSession, PlatformOverview, PlatformPlan, PlatformSubscriptionInput, PlatformUser } from '../types'
import { ApiConnection, Button, Field, Modal, errorText, Spinner } from '../ui'

type Tab = 'overview' | 'companies' | 'plans' | 'requests' | 'admins' | 'audit'
type Notice = { text: string; kind: 'success' | 'error' } | null
type SubscriptionForm = { planId: string; status: PlatformSubscriptionInput['status']; end: string; notes: string }
const statuses: Record<PlatformSubscriptionInput['status'], string> = { trialing: 'Teste', active: 'Ativa', past_due: 'Atrasada', suspended: 'Suspensa', canceled: 'Cancelada' }
const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const date = (value: string) => new Date(value).toLocaleDateString('pt-BR')
const emptyCompany = { companyName: '', companyEmail: '', companyPhone: '', userName: '', userEmail: '', password: '', planId: '' }
const auditLabels: Record<string, string> = {
  company_created: 'Empresa criada', plan_created: 'Plano criado', plan_updated: 'Plano atualizado', subscription_updated: 'Assinatura atualizada',
  admin_created: 'Administrador criado', admin_activated: 'Administrador ativado', admin_deactivated: 'Administrador desativado',
  password_changed: 'Senha alterada', maintenance_updated: 'Manutenção do site alterada', logo_updated: 'Logo da loja alterado', store_settings_updated: 'Configurações da loja alteradas',
  category_created: 'Categoria criada', category_updated: 'Categoria atualizada', category_deleted: 'Categoria excluída',
  banner_created: 'Banner criado', banner_updated: 'Banner atualizado', banner_deleted: 'Banner excluído', banner_image_uploaded: 'Imagem do banner enviada',
  page_created: 'Página criada', page_updated: 'Página atualizada', page_deleted: 'Página excluída', page_image_uploaded: 'Imagem da página enviada',
  vehicle_created: 'Veículo cadastrado', vehicle_updated: 'Veículo atualizado', vehicle_deleted: 'Veículo excluído', vehicle_images_uploaded: 'Fotos do veículo enviadas', vehicle_image_deleted: 'Foto do veículo excluída', vehicle_cover_updated: 'Capa do veículo alterada',
  seller_created: 'Vendedor cadastrado', seller_updated: 'Vendedor atualizado', seller_deactivated: 'Vendedor desativado', seller_reactivated: 'Vendedor reativado',
  lead_created: 'Lead cadastrado', lead_created_public: 'Lead enviado pelo site', lead_updated: 'Lead atualizado', lead_status_changed: 'Status do lead alterado', lead_assignment_updated: 'Vendedor do lead alterado', lead_claimed: 'Lead assumido', lead_released: 'Lead devolvido à fila', lead_interaction_added: 'Interação com lead registrada',
  lead_status_created: 'Status de lead criado', lead_status_updated: 'Status de lead atualizado', lead_status_deleted: 'Status de lead excluído',
}

export function PlatformPage({ session, onLogout, loggingOut, notify, notice }: {
  session: PlatformDesktopSession
  onLogout: () => Promise<void>
  loggingOut: boolean
  notify: (text: string, kind?: 'success' | 'error') => void
  notice: Notice
}) {
  const [tab, setTab] = useState<Tab>('overview')
  const [overview, setOverview] = useState<PlatformOverview | null>(null)
  const [companies, setCompanies] = useState<PlatformCompany[]>([])
  const [plans, setPlans] = useState<PlatformPlan[]>([])
  const [requests, setRequests] = useState<DemoRequest[]>([])
  const [admins, setAdmins] = useState<PlatformUser[]>([])
  const [audit, setAudit] = useState<PlatformAudit[]>([])
  const [auditCompanyId, setAuditCompanyId] = useState('')
  const [auditNextCursor, setAuditNextCursor] = useState<string | null>(null)
  const [auditLoadingMore, setAuditLoadingMore] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Record<string, SubscriptionForm>>({})
  const [companyForm, setCompanyForm] = useState(emptyCompany)
  const [planForm, setPlanForm] = useState({ code: '', name: '', price: '', billingInterval: 'monthly' as 'monthly' | 'yearly' })
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' })
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [companyError, setCompanyError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    const api = window.cartalog.platform
    try {
      const [summary, stores, availablePlans, demos] = await Promise.all([api.overview(), api.companies(), api.plans(), api.requests()])
      setOverview(summary); setCompanies(stores); setPlans(availablePlans); setRequests(demos)
      setSubscriptions(Object.fromEntries(stores.map((store) => [store.id, {
        planId: store.subscription?.planId || '',
        status: (store.subscription?.status || 'trialing') as SubscriptionForm['status'],
        end: store.subscription?.currentPeriodEnd?.slice(0, 10) || '',
        notes: store.subscription?.notes || '',
      }])))
      if (session.user.role === 'PLATFORM_OWNER' && tab === 'admins') setAdmins(await api.admins())
      if (session.user.role === 'PLATFORM_OWNER' && tab === 'audit') {
        const page = await api.audit({ companyId: auditCompanyId || undefined })
        setAudit(page.data)
        setAuditNextCursor(page.nextCursor)
      }
    } catch (error) {
      setLoadError(errorText(error))
    } finally { setLoading(false) }
  }, [session.user.role, tab, auditCompanyId])

  useEffect(() => { void load() }, [load])

  async function action(task: () => Promise<unknown>, message: string) {
    setBusy(true)
    try { await task(); notify(message); await load() }
    catch (error) { notify(errorText(error), 'error') }
    finally { setBusy(false) }
  }

  async function loadMoreAudit() {
    if (!auditNextCursor || auditLoadingMore) return
    setAuditLoadingMore(true)
    try {
      const page = await window.cartalog.platform.audit({ before: auditNextCursor, companyId: auditCompanyId || undefined })
      setAudit((current) => [...current, ...page.data])
      setAuditNextCursor(page.nextCursor)
    } catch (error) { notify(errorText(error), 'error') }
    finally { setAuditLoadingMore(false) }
  }

  function openCompanyForm() {
    setCompanyForm(emptyCompany)
    setCompanyError('')
    setShowCompanyForm(true)
  }

  function closeCompanyForm() {
    if (busy) return
    setShowCompanyForm(false)
    setCompanyError('')
  }

  async function createCompany(event: FormEvent) {
    event.preventDefault()
    setCompanyError('')
    setBusy(true)
    try {
      const { companyPhone, planId, ...rest } = companyForm
      await window.cartalog.platform.createCompany({ ...rest, companyPhone: companyPhone || undefined, planId: planId || undefined })
      setCompanyForm(emptyCompany)
      setShowCompanyForm(false)
      notify('Empresa e conta do dono criadas.')
      await load()
    } catch (error) { setCompanyError(errorText(error)) }
    finally { setBusy(false) }
  }

  function createPlan(event: FormEvent) {
    event.preventDefault()
    void action(async () => {
      await window.cartalog.platform.createPlan({ code: planForm.code, name: planForm.name, priceCents: Math.round(Number(planForm.price.replace(',', '.')) * 100), billingInterval: planForm.billingInterval, isActive: true })
      setPlanForm({ code: '', name: '', price: '', billingInterval: 'monthly' })
    }, 'Plano criado.')
  }

  function createAdmin(event: FormEvent) {
    event.preventDefault()
    void action(async () => {
      await window.cartalog.platform.createAdmin(adminForm)
      setAdminForm({ name: '', email: '', password: '' })
    }, 'Administrador criado.')
  }

  function updateSubscription(companyId: string) {
    const form = subscriptions[companyId]
    if (!form?.planId) { notify('Escolha um plano para a assinatura.', 'error'); return }
    void action(() => window.cartalog.platform.updateSubscription(companyId, {
      planId: form.planId, status: form.status,
      currentPeriodEnd: form.end ? new Date(`${form.end}T12:00:00.000Z`).toISOString() : null,
      notes: form.notes || null,
    }), 'Assinatura atualizada.')
  }

  function changeSubscription(id: string, patch: Partial<SubscriptionForm>) {
    setSubscriptions((current) => ({ ...current, [id]: { ...current[id], ...patch } }))
  }

  const navigation: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
    { id: 'companies', label: 'Empresas', icon: Building2 },
    { id: 'plans', label: 'Planos', icon: CreditCard },
    { id: 'requests', label: 'Demonstrações', icon: Mail },
    ...(session.user.role === 'PLATFORM_OWNER' ? [
      { id: 'admins' as Tab, label: 'Administradores', icon: UsersRound },
      { id: 'audit' as Tab, label: 'Auditoria', icon: FileClock },
    ] : []),
  ]
  const title = navigation.find((item) => item.id === tab)?.label || 'Plataforma'
  const stats: { label: string; value: number; Icon: typeof LayoutDashboard }[] = [
    { label: 'Empresas', value: overview?.companies || 0, Icon: Building2 },
    { label: 'Assinaturas ativas', value: overview?.activeSubscriptions || 0, Icon: CreditCard },
    { label: 'Demonstrações', value: overview?.demoRequests || 0, Icon: Mail },
    { label: 'Planos', value: overview?.plans || 0, Icon: LayoutDashboard },
  ]

  return <div className="app-shell platform-shell">
    <aside className="sidebar">
      <div className="sidebar-top"><img src={logoWhite} alt="Cartalog" /><span className="desktop-badge">GLOBAL</span></div>
      <div className="workspace-label">PLATAFORMA CARTALOG</div>
      <div className="workspace-card"><span className="workspace-avatar"><ShieldCheck size={20} /></span><span><strong>{session.user.name}</strong><small>{session.user.role === 'PLATFORM_OWNER' ? 'Administrador principal' : 'Administrador'}</small></span></div>
      <div className="nav-label">ADMINISTRAÇÃO</div>
      <nav className="sidebar-nav" aria-label="Navegação global">{navigation.map((item) => <button type="button" key={item.id} className={tab === item.id ? 'nav-active' : ''} onClick={() => setTab(item.id)}><item.icon size={20} /><span>{item.label}</span>{tab === item.id && <ArrowRight size={16} />}</button>)}</nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-info"><ShieldCheck size={20} /><span>Conta global para gerenciar empresas, assinaturas e administradores.</span></div>
      <button type="button" className="sidebar-logout" onClick={() => void onLogout()} disabled={loggingOut}><LogOut size={18} />{loggingOut ? 'Saindo...' : 'Sair da conta'}</button>
    </aside>
    <main className="main-panel">
      <div className="topbar"><span>Cartalog <span className="breadcrumb-slash">/</span> {title}</span><div><ApiConnection /><span className="topbar-divider" /><span className="user-circle">{session.user.name.slice(0, 1).toUpperCase()}</span><strong>{session.user.name}</strong></div></div>
      <div className="page-content platform-content">
        <div className="page-heading"><div><span className="eyebrow">ADMINISTRAÇÃO GLOBAL</span><h1>{title}</h1><p>Gerencie as lojas e a operação do Cartalog.</p></div><div className="platform-heading-actions"><Button type="button" variant="secondary" onClick={() => void load()}><RefreshCw size={16} /> Atualizar</Button>{tab === 'companies' && <Button type="button" onClick={openCompanyForm}><Plus size={16} /> Nova empresa</Button>}</div></div>
        {loading ? <Spinner text="Carregando painel global" /> : loadError ? <section className="panel platform-card platform-load-error" role="alert"><h2>Não foi possível carregar esta seção</h2><p>{loadError}</p><Button type="button" onClick={() => void load()}><RefreshCw size={16} /> Tentar novamente</Button></section> : <>
          {tab === 'overview' && <><div className="platform-stats">{stats.map(({ label, value, Icon }) => <div key={label} className="panel platform-stat"><span className="platform-stat-icon"><Icon size={21} /></span><strong>{value}</strong><small>{label}</small></div>)}</div><div className="platform-two-columns"><section className="panel platform-card"><h2>Empresas recentes</h2>{companies.slice(0, 5).map((company) => <div className="platform-list-row" key={company.id}><span><strong>{company.name}</strong><small>{company.email}</small></span><em>{company.subscription ? statuses[company.subscription.status as keyof typeof statuses] || company.subscription.status : 'Sem plano'}</em></div>)}{!companies.length && <p>Nenhuma empresa cadastrada.</p>}</section><section className="panel platform-card"><h2>Demonstrações recentes</h2>{requests.slice(0, 5).map((request) => <div className="platform-list-row" key={request.id}><span><strong>{request.name}</strong><small>{request.companyName}</small></span><em>{date(request.createdAt)}</em></div>)}{!requests.length && <p>Nenhum pedido recebido.</p>}</section></div></>}
          {tab === 'companies' && <>
            <div className="platform-stack">{companies.map((company) => <section className="panel platform-card" key={company.id}><div className="platform-company-head"><div><h2>{company.name}</h2><p>{company.email} · Criada em {date(company.createdAt)}</p></div><div className="platform-company-count">{company._count.vehicles} veículos · {company._count.leads} leads · {company._count.users} usuários</div></div><p><strong>Dono:</strong> {company.users[0]?.name || '—'} · {company.users[0]?.email || '—'}{company.siteSettings?.maintenanceEnabled && <span className="platform-maintenance">Site em manutenção</span>}</p><div className="platform-form-grid platform-subscription"><label className="field"><span className="field-label">Plano</span><select value={subscriptions[company.id]?.planId || ''} onChange={(e) => changeSubscription(company.id, { planId: e.target.value })}><option value="">Selecionar</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label><label className="field"><span className="field-label">Situação</span><select value={subscriptions[company.id]?.status || 'trialing'} onChange={(e) => changeSubscription(company.id, { status: e.target.value as SubscriptionForm['status'] })}>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><Field label="Fim do período" type="date" value={subscriptions[company.id]?.end || ''} onChange={(e) => changeSubscription(company.id, { end: e.target.value })} /><Field label="Observação" maxLength={1000} value={subscriptions[company.id]?.notes || ''} onChange={(e) => changeSubscription(company.id, { notes: e.target.value })} /></div><Button type="button" disabled={busy || !plans.length} onClick={() => updateSubscription(company.id)}>Salvar assinatura</Button></section>)}{!companies.length && <p className="panel platform-empty">Nenhuma empresa cadastrada.</p>}</div></>}
          {tab === 'plans' && <div className="platform-two-columns"><form className="panel platform-card platform-form" onSubmit={createPlan}><h2>Novo plano</h2><Field label="Código" pattern="[a-z0-9-]{2,50}" placeholder="profissional" required value={planForm.code} onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })} /><Field label="Nome" required value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} /><Field label="Preço em R$" type="number" min="0" step="0.01" required value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} /><label className="field"><span className="field-label">Cobrança</span><select value={planForm.billingInterval} onChange={(e) => setPlanForm({ ...planForm, billingInterval: e.target.value as 'monthly' | 'yearly' })}><option value="monthly">Mensal</option><option value="yearly">Anual</option></select></label><Button type="submit" disabled={busy}>Criar plano</Button></form><div className="platform-stack">{plans.map((plan) => <div className="panel platform-card platform-plan" key={plan.id}><span><small>{plan.code}</small><h2>{plan.name}</h2><p>{plan._count?.subscriptions || 0} empresas · {plan.billingInterval === 'yearly' ? 'Anual' : 'Mensal'}</p></span><span><strong>{money(plan.priceCents)}</strong><button type="button" disabled={busy} onClick={() => void action(() => window.cartalog.platform.updatePlan(plan.id, { isActive: !plan.isActive }), 'Plano atualizado.')}>{plan.isActive ? 'Desativar' : 'Ativar'}</button></span></div>)}{!plans.length && <p className="panel platform-empty">Nenhum plano cadastrado.</p>}</div></div>}
          {tab === 'requests' && <div className="platform-two-columns">{requests.map((request) => <article className="panel platform-card" key={request.id}><div className="platform-company-head"><h2>{request.name}</h2><small>{date(request.createdAt)}</small></div><p>{request.companyName || 'Empresa não informada'}</p><p><strong>E-mail:</strong> {request.email}</p>{request.phone && <p><strong>Telefone:</strong> {request.phone}</p>}{request.message && <p>{request.message}</p>}</article>)}{!requests.length && <p className="panel platform-empty">Nenhuma demonstração solicitada.</p>}</div>}
          {tab === 'admins' && session.user.role === 'PLATFORM_OWNER' && <div className="platform-two-columns"><form className="panel platform-card platform-form" onSubmit={createAdmin} autoComplete="off"><h2>Novo administrador</h2><Field label="Nome" required value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} /><Field label="E-mail" type="email" required value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} /><Field label="Senha temporária" hint="Mínimo de 8 caracteres, uma letra maiúscula e um número." type="password" minLength={8} required value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} /><Button type="submit" disabled={busy}>Adicionar administrador</Button></form><div className="platform-stack">{admins.map((admin) => <div className="panel platform-card platform-plan" key={admin.id}><span><h2>{admin.name}</h2><p>{admin.email}</p><small>{admin.role === 'PLATFORM_OWNER' ? 'Administrador principal' : 'Administrador'} · {admin.isActive ? 'Ativo' : 'Inativo'}</small></span>{admin.role !== 'PLATFORM_OWNER' && <button type="button" disabled={busy} onClick={() => void action(() => window.cartalog.platform.setAdminActive(admin.id, { isActive: !admin.isActive }), 'Acesso atualizado.')}>{admin.isActive ? 'Desativar' : 'Reativar'}</button>}</div>)}</div></div>}
          {tab === 'audit' && session.user.role === 'PLATFORM_OWNER' && <section className="panel platform-card platform-audit-panel">
            <div className="platform-audit-heading"><div><h2>Histórico de atividades</h2><p>Ações do Cartalog e das lojas, com o autor de cada alteração.</p></div><label className="field"><span className="field-label">Filtrar por loja</span><select value={auditCompanyId} onChange={(event) => setAuditCompanyId(event.target.value)}><option value="">Todas as lojas</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label></div>
            <div className="platform-audit-list">{audit.map((entry) => <div className="platform-audit-row" key={`${entry.scope}:${entry.id}`}>
              <div><strong>{auditLabels[entry.action] || entry.action.replaceAll('_', ' ')}</strong><span>{entry.company?.name || 'Plataforma Cartalog'} · {entry.actor.name}{entry.actor.email ? ` (${entry.actor.email})` : ''}</span><small>{entry.target}</small></div>
              <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString('pt-BR')}</time>
            </div>)}{!audit.length && <p className="platform-audit-empty">Nenhuma atividade registrada para este filtro.</p>}</div>
            {auditNextCursor && <Button type="button" variant="secondary" disabled={auditLoadingMore} onClick={() => void loadMoreAudit()}>{auditLoadingMore ? 'Carregando...' : 'Carregar atividades anteriores'}</Button>}
          </section>}
        </>}
      </div>
    </main>
    {showCompanyForm && <Modal
      className="company-modal"
      title="Nova empresa"
      subtitle="Cadastre a loja e crie o acesso inicial do dono."
      onClose={closeCompanyForm}
      footer={<>
        <Button type="button" variant="secondary" onClick={closeCompanyForm} disabled={busy}>Cancelar</Button>
        <Button type="submit" form="platform-company-form" disabled={busy}><Plus size={16} /> {busy ? 'Criando...' : 'Criar empresa'}</Button>
      </>}
    >
      <form id="platform-company-form" className="company-form" onSubmit={createCompany} autoComplete="off">
        <div className="company-form-section">
          <h3>Dados da empresa</h3>
          <div className="platform-form-grid">
            <Field label="Nome da empresa" autoFocus required value={companyForm.companyName} onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })} />
            <Field label="E-mail da empresa" type="email" required value={companyForm.companyEmail} onChange={(e) => setCompanyForm({ ...companyForm, companyEmail: e.target.value })} />
            <Field label="Telefone" type="tel" value={companyForm.companyPhone} onChange={(e) => setCompanyForm({ ...companyForm, companyPhone: e.target.value })} />
            <label className="field"><span className="field-label">Plano inicial</span><select value={companyForm.planId} onChange={(e) => setCompanyForm({ ...companyForm, planId: e.target.value })}><option value="">Sem plano</option>{plans.filter((plan) => plan.isActive).map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label>
          </div>
        </div>
        <div className="company-form-section">
          <h3>Acesso do dono</h3>
          <div className="platform-form-grid">
            <Field label="Nome do dono" required value={companyForm.userName} onChange={(e) => setCompanyForm({ ...companyForm, userName: e.target.value })} />
            <Field label="E-mail do dono" type="email" required value={companyForm.userEmail} onChange={(e) => setCompanyForm({ ...companyForm, userEmail: e.target.value })} />
            <Field label="Senha temporária" type="password" minLength={8} required value={companyForm.password} onChange={(e) => setCompanyForm({ ...companyForm, password: e.target.value })} />
          </div>
        </div>
        {companyError && <div className="form-error" role="alert">{companyError}</div>}
      </form>
    </Modal>}
    {notice && <div role="status" className={`toast toast-${notice.kind}`}>{notice.text}</div>}
  </div>
}
