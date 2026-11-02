import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, Inbox, MessageCircleMore, RefreshCw, Search, UserRound, UsersRound } from 'lucide-react'
import type { LeadDetail, LeadList, LeadStats, LeadStatus, Seller } from '../types'
import { Button, EmptyState, errorText, PageHeading, Spinner } from '../ui'

type Notify = (text: string, kind?: 'success' | 'error') => void
const date = (value: string) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const vehicleName = (lead: { vehicle: LeadDetail['vehicle'] }) => lead.vehicle ? `${lead.vehicle.model.brand.name} ${lead.vehicle.model.name} ${lead.vehicle.year}` : 'Contato geral'
const auditLabels: Record<string, string> = {
  lead_created: 'Lead cadastrado', lead_created_public: 'Lead recebido pelo site', lead_claimed: 'Atendimento assumido',
  lead_released: 'Lead devolvido à fila', lead_assignment_updated: 'Responsável alterado', lead_status_changed: 'Status alterado',
  lead_interaction_added: 'Interação registrada', lead_updated: 'Lead atualizado',
}

export function LeadsPage({ notify, onTeam }: { notify: Notify; onTeam: () => void }) {
  const [list, setList] = useState<LeadList | null>(null)
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [statuses, setStatuses] = useState<LeadStatus[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [page, setPage] = useState(1)
  const [scope, setScope] = useState<'all' | 'queue'>('all')
  const [statusId, setStatusId] = useState('')
  const [sellerId, setSellerId] = useState('')
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<LeadDetail | null>(null)
  const [detailError, setDetailError] = useState('')
  const [assignId, setAssignId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([window.cartalog.leads.stats(), window.cartalog.leads.statuses(), window.cartalog.team.list()])
      .then(([overview, statusList, team]) => { if (active) { setStats(overview); setStatuses(statusList); setSellers(team.filter((person) => person.role === 'SELLER')) } })
      .catch((cause) => { if (active) notify(errorText(cause), 'error') })
    return () => { active = false }
  }, [refreshKey, notify])

  useEffect(() => {
    let active = true
    setLoadingList(true)
    setListError('')
    window.cartalog.leads.list({ page, scope, search: appliedSearch || undefined, statusId: statusId || undefined, assignedUserId: sellerId || undefined })
      .then((result) => { if (active) setList(result) })
      .catch((cause) => { if (active) setListError(errorText(cause)) })
      .finally(() => { if (active) setLoadingList(false) })
    return () => { active = false }
  }, [page, scope, appliedSearch, statusId, sellerId, refreshKey])

  useEffect(() => {
    if (!detailId) return
    let active = true
    setDetail(null)
    setDetailError('')
    window.cartalog.leads.get(detailId)
      .then((result) => { if (active) { setDetail(result); setAssignId(result.assignedUserId || '') } })
      .catch((cause) => { if (active) setDetailError(errorText(cause)) })
    return () => { active = false }
  }, [detailId, refreshKey])

  async function assign() {
    if (!detail || assignId === (detail.assignedUserId || '')) return
    setSaving(true)
    setDetailError('')
    try {
      await window.cartalog.leads.assign(detail.id, assignId || null)
      notify(assignId ? 'Vendedor responsável atualizado.' : 'Lead devolvido à fila.')
      setRefreshKey((value) => value + 1)
    } catch (cause) { setDetailError(errorText(cause)) }
    finally { setSaving(false) }
  }

  const activeSellers = sellers.filter((seller) => seller.isActive)
  const won = stats?.byStatus.filter((item) => item.kind === 'won').reduce((sum, item) => sum + item.count, 0) ?? 0
  const lost = stats?.byStatus.filter((item) => item.kind === 'lost').reduce((sum, item) => sum + item.count, 0) ?? 0
  const sellerName = (id: string | null) => sellers.find((seller) => seller.id === id)?.name || 'Usuário da equipe'

  if (detailId) return <>
    <button className="vehicle-back" type="button" onClick={() => { setDetailId(null); setDetail(null); setDetailError('') }}><ArrowLeft size={17} /> Voltar aos leads</button>
    {!detail && !detailError ? <Spinner text="Carregando lead" /> : detailError && !detail ? <div className="panel lead-error" role="alert">{detailError}</div> : detail && <>
      <PageHeading eyebrow="ACOMPANHAMENTO" title={detail.name} description={`Recebido em ${date(detail.createdAt)} · ${detail.source || 'Origem não informada'}`} action={<span className={`lead-status-pill lead-status-${detail.status?.kind || 'open'}`}>{detail.status?.name || 'Novo'}</span>} />
      <div className="lead-detail-grid">
        <div className="lead-detail-stack">
          <section className="panel lead-card"><div className="lead-card-heading"><UserRound size={20} /><h2>Dados do contato</h2></div><dl className="lead-facts"><div><dt>Telefone</dt><dd>{detail.phone || 'Não informado'}</dd></div><div><dt>E-mail</dt><dd>{detail.email || 'Não informado'}</dd></div><div><dt>Responsável</dt><dd>{detail.assignedUser?.name || 'Na fila geral'}</dd></div><div><dt>Origem</dt><dd>{detail.source || 'Não informada'}</dd></div><div><dt>Veículo de interesse</dt><dd>{vehicleName(detail)}</dd></div><div><dt>Status atual</dt><dd>{detail.status?.name || 'Novo'}</dd></div></dl>{detail.message && <div className="lead-message"><strong>Mensagem recebida</strong><p>{detail.message}</p></div>}</section>
          <section className="panel lead-card"><div className="lead-card-heading"><MessageCircleMore size={20} /><h2>Histórico de atendimento</h2></div>{detail.interactions.length ? <div className="lead-activity-list">{detail.interactions.map((item) => <div className="lead-activity" key={item.id}><strong>{item.type === 'note' ? 'Observação' : item.type === 'loss_reason' ? 'Motivo da perda' : item.type}</strong><small>{sellerName(item.userId)} · {date(item.createdAt)}</small>{item.note && <p>{item.note}</p>}</div>)}</div> : <p className="lead-muted">Nenhuma interação registrada pelo vendedor.</p>}</section>
          <section className="panel lead-card"><div className="lead-card-heading"><Clock3 size={20} /><h2>Movimentações</h2></div>{detail.auditEvents.length ? <div className="lead-activity-list">{detail.auditEvents.map((item) => <div className="lead-activity" key={item.id}><strong>{auditLabels[item.action] || item.action.replaceAll('_', ' ')}</strong><small>{item.actorName} · {date(item.createdAt)}</small></div>)}</div> : <p className="lead-muted">Ainda não há movimentações registradas.</p>}</section>
        </div>
        <aside className="lead-detail-stack"><section className="panel lead-card"><div className="lead-card-heading"><UsersRound size={20} /><h2>Distribuição</h2></div><p className="lead-muted">Somente vendedores atendem e alteram o status. Você pode escolher quem fica responsável.</p><label className="field"><span className="field-label">Vendedor responsável</span><select value={assignId} onChange={(event) => setAssignId(event.target.value)}><option value="">Fila geral</option>{sellers.filter((seller) => seller.isActive || seller.id === detail.assignedUserId).map((seller) => <option key={seller.id} value={seller.id}>{seller.name}{seller.isActive ? '' : ' (inativo)'}</option>)}</select></label><Button disabled={saving || assignId === (detail.assignedUserId || '') || (!!assignId && !activeSellers.some((seller) => seller.id === assignId))} onClick={() => void assign()}>{saving ? 'Salvando...' : 'Salvar responsável'}</Button>{detailError && <p className="form-error" role="alert">{detailError}</p>}{!activeSellers.length && <Button variant="ghost" onClick={onTeam}>Cadastrar vendedor <ArrowRight size={15} /></Button>}</section>
          <section className="panel lead-card"><div className="lead-card-heading"><CalendarDays size={20} /><h2>Próximos retornos</h2></div>{detail.followups.length ? <div className="lead-activity-list">{detail.followups.map((item) => <div className="lead-activity" key={item.id}><strong>{item.completed ? 'Concluído' : 'Pendente'} · {date(item.scheduledAt)}</strong><small>{sellerName(item.userId)}</small>{item.note && <p>{item.note}</p>}</div>)}</div> : <p className="lead-muted">Nenhum retorno agendado.</p>}</section>
        </aside>
      </div>
    </>}
  </>

  return <>
    <PageHeading eyebrow="OPERAÇÃO DA LOJA" title="Leads e atendimento." description="Veja quem chegou, acompanhe o andamento e distribua oportunidades para seus vendedores." action={<Button variant="secondary" onClick={() => setRefreshKey((value) => value + 1)}><RefreshCw size={16} /> Atualizar</Button>} />
    <div className="lead-metrics"><div className="panel lead-metric"><span>Total de leads</span><strong>{stats?.total ?? '—'}</strong><small>Oportunidades recebidas</small></div><div className="panel lead-metric"><span>Aguardando vendedor</span><strong>{stats?.queue ?? '—'}</strong><small>Disponíveis na fila</small></div><div className="panel lead-metric"><span>Vendas fechadas</span><strong>{stats ? won : '—'}</strong><small>Status de venda concluída</small></div><div className="panel lead-metric"><span>Perdidos</span><strong>{stats ? lost : '—'}</strong><small>Negócios não convertidos</small></div></div>
    <section className="panel lead-list-panel"><form className="lead-filters" onSubmit={(event: FormEvent) => { event.preventDefault(); setPage(1); setAppliedSearch(search.trim()) }}><label className="lead-search"><Search size={17} /><input aria-label="Buscar leads" placeholder="Nome, telefone ou e-mail" value={search} onChange={(event) => setSearch(event.target.value)} /></label><select aria-label="Visualização" value={scope} onChange={(event) => { setScope(event.target.value as 'all' | 'queue'); setPage(1) }}><option value="all">Todos os leads</option><option value="queue">Fila geral</option></select><select aria-label="Filtrar por status" value={statusId} onChange={(event) => { setStatusId(event.target.value); setPage(1) }}><option value="">Todos os status</option>{statuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select aria-label="Filtrar por vendedor" value={sellerId} onChange={(event) => { setSellerId(event.target.value); setPage(1) }}><option value="">Todos os vendedores</option>{sellers.map((item) => <option key={item.id} value={item.id}>{item.name}{item.isActive ? '' : ' (inativo)'}</option>)}</select><Button variant="secondary" type="submit">Buscar</Button></form>
      {listError && <div className="lead-error" role="alert">{listError} <Button variant="ghost" onClick={() => setRefreshKey((value) => value + 1)}>Tentar novamente</Button></div>}
      {loadingList ? <Spinner text="Carregando leads" /> : !listError && !list?.data.length ? <EmptyState icon={<Inbox size={28} />} title="Nenhum lead nesta visualização" text="Ajuste os filtros ou aguarde novos contatos da loja." /> : !listError && <div className="lead-rows">{list?.data.map((lead) => <button type="button" className="lead-row" key={lead.id} onClick={() => setDetailId(lead.id)}><span className="lead-row-avatar"><UserRound size={20} /></span><span className="lead-row-name"><strong>{lead.name}</strong><small>{vehicleName(lead)} · {date(lead.createdAt)}</small></span><span className="lead-row-owner"><small>RESPONSÁVEL</small><strong>{lead.assignedUser?.name || 'Fila geral'}</strong></span><span className={`lead-status-pill lead-status-${lead.status?.kind || 'open'}`}>{lead.status?.name || 'Novo'}</span><ArrowRight size={18} /></button>)}</div>}
      {list && !listError && list.meta.lastPage > 1 && <div className="lead-pagination"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</Button><span>Página {page} de {list.meta.lastPage} · {list.meta.total} leads</span><Button variant="secondary" disabled={page >= list.meta.lastPage} onClick={() => setPage((value) => value + 1)}>Próxima</Button></div>}
    </section>
  </>
}
