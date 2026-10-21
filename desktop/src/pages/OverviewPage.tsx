import { useEffect, useState } from 'react'
import { ArrowRight, BookOpenText, Building2, CheckCircle2, Circle, Globe2, Palette, ShieldCheck, UsersRound } from 'lucide-react'
import type { Company, DesktopSession, Seller, StoreSettings } from '../types'
import { Button, errorText, imageUrl, PageHeading, Spinner } from '../ui'

type View = 'overview' | 'team' | 'settings' | 'content'

export function OverviewPage({ session, apiOrigin, onNavigate, notify }: { session: DesktopSession; apiOrigin: string; onNavigate: (view: View) => void; notify: (text: string, kind?: 'success' | 'error') => void }) {
  const [team, setTeam] = useState<Seller[] | null>(null)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [company, setCompany] = useState<Company | null>(null)

  useEffect(() => {
    Promise.all([window.cartalog.team.list(), window.cartalog.settings.get(), window.cartalog.company.get()])
      .then(([teamData, settingsData, companyData]) => { setTeam(teamData); setSettings(settingsData); setCompany(companyData) })
      .catch((error) => notify(errorText(error), 'error'))
  }, [notify])

  const sellers = team?.filter((person) => person.role === 'SELLER' && person.isActive) ?? []
  const completed = [sellers.length > 0, Boolean(company?.logoUrl), Boolean(settings?.whatsapp || settings?.phone), Boolean(settings?.siteTitle)].filter(Boolean).length

  return <>
    <PageHeading eyebrow="PAINEL DO DONO" title={`Bom dia, ${session.user.name.split(' ')[0]}.`} description="Prepare sua loja, acompanhe sua equipe e defina como o catálogo vai se apresentar." />
    {!team || !settings || !company ? <Spinner text="Buscando informações da loja" /> : <>
      <section className="owner-hero"><div className="owner-hero-copy"><span className="hero-kicker"><ShieldCheck size={16} /> OPERAÇÃO SOB SEU CONTROLE</span><h2>{session.company.name}<span> pronta para crescer.</span></h2><p>O desktop reúne as decisões da empresa. Seus vendedores atendem leads na web e no mobile, enquanto você organiza a operação por aqui.</p><div className="hero-actions"><Button onClick={() => onNavigate('team')}>Gerenciar vendedores <ArrowRight size={17} /></Button><Button variant="secondary" onClick={() => onNavigate('settings')}>Configurar loja</Button></div></div><div className="owner-hero-art"><div className="hero-orbit"><Building2 size={70} /></div><span className="hero-brand-chip">{company.logoUrl ? <img src={imageUrl(company.logoUrl, apiOrigin)} alt="Logo da loja" /> : <Globe2 size={32} />}</span></div></section>
      <div className="overview-grid"><section className="stat-panel"><span>VENDEDORES ATIVOS</span><strong>{sellers.length}</strong><p>{sellers.length ? 'Pessoas prontas para receber leads.' : 'Cadastre o primeiro vendedor para atender leads.'}</p><button type="button" onClick={() => onNavigate('team')}>Abrir equipe <ArrowRight size={16} /></button></section><section className="stat-panel"><span>CONFIGURAÇÃO DA LOJA</span><strong>{completed}<small>/ 4</small></strong><p>{completed === 4 ? 'Os dados principais da loja estão prontos.' : 'Finalize os dados para apresentar melhor sua marca.'}</p><button type="button" onClick={() => onNavigate('settings')}>Completar cadastro <ArrowRight size={16} /></button></section><section className="stat-panel stat-panel-red"><span>SEU CATÁLOGO</span><strong className="stat-icon"><BookOpenText size={42} /></strong><p>Organize categorias, páginas e banners do site público.</p><button type="button" onClick={() => onNavigate('content')}>Editar conteúdo <ArrowRight size={16} /></button></section></div>
      <div className="overview-bottom"><section className="panel"><div className="panel-head"><div><span className="eyebrow">PRÓXIMOS PASSOS</span><h2>Checklist da sua loja</h2></div><span className="completion-pill">{completed} de 4 concluídos</span></div><div className="checklist">{[
        { done: sellers.length > 0, text: 'Cadastre um vendedor', detail: 'Só vendedores atendem os leads.', view: 'team' as View, icon: UsersRound },
        { done: Boolean(company.logoUrl), text: 'Adicione o logo da loja', detail: 'Sua identidade no catálogo público.', view: 'settings' as View, icon: Palette },
        { done: Boolean(settings.whatsapp || settings.phone), text: 'Informe um contato comercial', detail: 'Facilite o contato dos clientes.', view: 'settings' as View, icon: Building2 },
        { done: Boolean(settings.siteTitle), text: 'Defina o título do site', detail: 'Dê contexto à sua presença online.', view: 'settings' as View, icon: Globe2 },
      ].map((item) => <button type="button" key={item.text} className="checklist-item" onClick={() => onNavigate(item.view)}>{item.done ? <CheckCircle2 className="done" size={23} /> : <Circle size={23} />}<item.icon className="checklist-icon" size={20} /><span><strong>{item.text}</strong><small>{item.detail}</small></span><ArrowRight size={16} /></button>)}</div></section><section className="panel team-preview"><div className="panel-head"><div><span className="eyebrow">EQUIPE</span><h2>Quem está com você</h2></div></div>{sellers.length ? sellers.slice(0, 4).map((person) => <div className="preview-person" key={person.id}><span className="person-avatar">{person.name.slice(0, 1).toUpperCase()}</span><span><strong>{person.name}</strong><small>{person.email}</small></span><span className="role-pill">Vendedor</span></div>) : <div className="preview-empty"><UsersRound size={28} /><strong>Nenhum vendedor ainda</strong><p>Comece pela equipe para liberar o atendimento dos leads.</p></div>}<Button variant="secondary" className="full-width" onClick={() => onNavigate('team')}>Ver equipe <ArrowRight size={17} /></Button></section></div>
    </>}
  </>
}
