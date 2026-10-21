import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Mail, Pencil, Plus, RotateCcw, ShieldCheck, Trash2, UserRoundPlus, UsersRound } from 'lucide-react'
import type { Seller, SellerInput } from '../types'
import { Button, EmptyState, errorText, Field, Modal, PageHeading, Spinner } from '../ui'

type Dialog = { mode: 'create' } | { mode: 'edit' | 'deactivate'; seller: Seller } | null

export function TeamPage({ notify }: { notify: (text: string, kind?: 'success' | 'error') => void }) {
  const [people, setPeople] = useState<Seller[] | null>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [form, setForm] = useState<SellerInput>({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => window.cartalog.team.list().then(setPeople).catch((err) => notify(errorText(err), 'error')), [notify])
  useEffect(() => { void load() }, [load])

  const sellers = people?.filter((person) => person.role === 'SELLER') ?? []
  const activeCount = sellers.filter((person) => person.isActive).length

  function openCreate() { setForm({ name: '', email: '', password: '' }); setError(''); setDialog({ mode: 'create' }) }
  function openEdit(seller: Seller) { setForm({ name: seller.name, email: seller.email, password: '' }); setError(''); setDialog({ mode: 'edit', seller }) }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!dialog || dialog.mode === 'deactivate') return
    setError('')
    if (dialog.mode === 'create' && (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password) || form.password.length < 8)) return setError('A senha precisa ter 8 caracteres, uma letra maiúscula e um número.')
    setBusy(true)
    try {
      if (dialog.mode === 'create') { await window.cartalog.team.create({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password }); notify('Vendedor cadastrado. Compartilhe a senha inicial com ele por um canal seguro.') }
      else { await window.cartalog.team.update(dialog.seller.id, { name: form.name.trim() }); notify('Nome do vendedor atualizado.') }
      setDialog(null)
      void load()
    } catch (err) { setError(errorText(err)) }
    finally { setBusy(false) }
  }

  async function deactivate() {
    if (!dialog || dialog.mode !== 'deactivate') return
    setBusy(true)
    setError('')
    try { await window.cartalog.team.deactivate(dialog.seller.id); setDialog(null); notify('Vendedor desativado. Os leads dele voltaram para a fila.'); void load() }
    catch (err) { setError(errorText(err)) }
    finally { setBusy(false) }
  }

  async function reactivate(seller: Seller) {
    setBusy(true)
    try { await window.cartalog.team.reactivate(seller.id); notify(`${seller.name} pode acessar a loja novamente.`); void load() }
    catch (err) { notify(errorText(err), 'error') }
    finally { setBusy(false) }
  }

  return <>
    <PageHeading eyebrow="GESTÃO DE PESSOAS" title="Sua equipe de vendas." description="Cadastre quem pode assumir, responder e atualizar os leads da loja." action={<Button onClick={openCreate}><Plus size={18} /> Novo vendedor</Button>} />
    <div className="team-intro"><div className="team-intro-icon"><ShieldCheck size={26} /></div><div><strong>Atendimento reservado aos vendedores</strong><p>O dono distribui e acompanha. Os vendedores atendem pela web ou pelo app mobile.</p></div><span>{activeCount} {activeCount === 1 ? 'vendedor ativo' : 'vendedores ativos'}</span></div>
    <section className="panel team-panel"><div className="panel-head"><div><span className="eyebrow">EQUIPE DA LOJA</span><h2>Pessoas cadastradas</h2></div><span className="count-pill">{activeCount} ativos</span></div>{people === null ? <Spinner /> : sellers.length === 0 ? <EmptyState icon={<UsersRound size={30} />} title="Sua equipe começa com uma pessoa" text="Cadastre o primeiro vendedor para que sua loja possa atender leads." action={<Button onClick={openCreate}>Cadastrar vendedor <ArrowRight size={17} /></Button>} /> : <div className="team-table"><div className="table-head"><span>VENDEDOR</span><span>ACESSO</span><span>CADASTRADO EM</span><span>AÇÕES</span></div>{sellers.map((person) => <div className="table-row" key={person.id}><div className="person-cell"><span className="person-avatar">{person.name.slice(0, 1).toUpperCase()}</span><span><strong>{person.name}</strong><small><Mail size={13} />{person.email}</small></span></div><span className={person.isActive ? 'active-pill' : 'inactive-pill'}><span /> {person.isActive ? 'Ativo' : 'Inativo'}</span><span className="muted-date">{new Date(person.createdAt).toLocaleDateString('pt-BR')}</span><div className="table-actions"><button type="button" aria-label={`Editar ${person.name}`} title="Editar nome" disabled={!person.isActive} onClick={() => openEdit(person)}><Pencil size={17} /></button>{person.isActive ? <button type="button" aria-label={`Desativar ${person.name}`} title="Desativar" onClick={() => { setError(''); setDialog({ mode: 'deactivate', seller: person }) }}><Trash2 size={17} /></button> : <button type="button" aria-label={`Reativar ${person.name}`} title="Reativar" disabled={busy} onClick={() => void reactivate(person)}><RotateCcw size={17} /></button>}</div></div>)}</div>}</section>
    <div className="team-footnote"><UserRoundPlus size={20} /><span>Ao cadastrar, o vendedor recebe acesso à web e ao futuro app mobile. A API mantém todos os dados isolados na sua empresa.</span></div>
    {dialog && <Modal title={dialog.mode === 'create' ? 'Novo vendedor' : dialog.mode === 'edit' ? 'Editar vendedor' : 'Desativar vendedor'} subtitle={dialog.mode === 'deactivate' ? 'Confirme a mudança de acesso desta pessoa.' : 'Dados de acesso da sua equipe.'} onClose={() => { if (!busy) setDialog(null) }} footer={dialog.mode === 'deactivate' ? <><Button variant="secondary" onClick={() => setDialog(null)} disabled={busy}>Cancelar</Button><Button variant="danger" onClick={deactivate} disabled={busy}>{busy ? 'Desativando...' : 'Desativar vendedor'}</Button></> : <><Button variant="secondary" onClick={() => setDialog(null)} disabled={busy}>Cancelar</Button><Button type="submit" form="seller-form" disabled={busy}>{busy ? 'Salvando...' : dialog.mode === 'create' ? 'Cadastrar vendedor' : 'Salvar alterações'}</Button></>}>
      {dialog.mode === 'deactivate' ? <div className="delete-copy"><p><strong>{dialog.seller.name}</strong> não poderá mais entrar. Os leads atribuídos a ele voltarão para a fila; o histórico de atendimento continuará salvo.</p>{error && <div className="form-error" role="alert">{error}</div>}</div> : <form id="seller-form" className="form-stack" onSubmit={submit}><Field label="Nome completo" required minLength={2} maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />{dialog.mode === 'create' && <><Field label="E-mail de acesso" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><Field label="Senha inicial" type="password" required minLength={8} autoComplete="new-password" hint="Mínimo 8 caracteres, uma letra maiúscula e um número." value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><p className="helper-note">A senha não é enviada por e-mail. Compartilhe-a diretamente com o vendedor.</p></>}{error && <div className="form-error" role="alert">{error}</div>}</form>}
    </Modal>}
  </>
}
