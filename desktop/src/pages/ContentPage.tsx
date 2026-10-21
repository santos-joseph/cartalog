import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, BookOpenText, ExternalLink, ImagePlus, Layers3, Pencil, Plus, Tag, Trash2, UploadCloud } from 'lucide-react'
import type { Banner, BannerInput, Category } from '../types'
import { Button, EmptyState, errorText, Field, imageUrl, Modal, PageHeading, Spinner } from '../ui'
import { PageBuilderPanel } from './PageBuilderPanel'

type Notify = (text: string, kind?: 'success' | 'error') => void
type Tab = 'categories' | 'pages' | 'banners'

export function ContentPage({ apiOrigin, notify }: { apiOrigin: string; notify: Notify }) {
  const [tab, setTab] = useState<Tab>('categories')
  return <><PageHeading eyebrow="SITE PÚBLICO" title="Tudo pronto para mostrar." description="Organize a estrutura, as páginas e os destaques que acompanham o catálogo de veículos." action={<Button variant="secondary" onClick={() => window.cartalog.catalog.open().catch((error) => notify(errorText(error), 'error'))}>Abrir catálogo <ExternalLink size={16} /></Button>} /><div className="content-tabs" role="tablist" aria-label="Conteúdo do catálogo"><button type="button" role="tab" aria-selected={tab === 'categories'} className={tab === 'categories' ? 'active' : ''} onClick={() => setTab('categories')}><Layers3 size={18} /> Categorias</button><button type="button" role="tab" aria-selected={tab === 'pages'} className={tab === 'pages' ? 'active' : ''} onClick={() => setTab('pages')}><BookOpenText size={18} /> Páginas</button><button type="button" role="tab" aria-selected={tab === 'banners'} className={tab === 'banners' ? 'active' : ''} onClick={() => setTab('banners')}><ImagePlus size={18} /> Banners</button></div>{tab === 'categories' && <CategoryPanel notify={notify} />}{tab === 'pages' && <PageBuilderPanel apiOrigin={apiOrigin} notify={notify} />}{tab === 'banners' && <BannerPanel apiOrigin={apiOrigin} notify={notify} />}</>
}

function CategoryPanel({ notify }: { notify: Notify }) {
  const [items, setItems] = useState<Category[] | null>(null)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<Category | null>(null)
  const [removing, setRemoving] = useState<Category | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const load = useCallback(() => window.cartalog.categories.list().then(setItems).catch((err) => notify(errorText(err), 'error')), [notify])
  useEffect(() => { void load() }, [load])

  async function create(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try { await window.cartalog.categories.create({ name: name.trim() }); setName(''); notify('Categoria criada.'); void load() }
    catch (err) { notify(errorText(err), 'error') }
    finally { setBusy(false) }
  }

  async function update(event: FormEvent) {
    event.preventDefault()
    if (!editing) return
    setBusy(true); setError('')
    try { await window.cartalog.categories.update(editing.id, { name: name.trim() }); setEditing(null); setName(''); notify('Categoria atualizada.'); void load() }
    catch (err) { setError(errorText(err)) }
    finally { setBusy(false) }
  }

  async function remove() {
    if (!removing) return
    setBusy(true); setError('')
    try { await window.cartalog.categories.delete(removing.id); setRemoving(null); notify('Categoria removida.'); void load() }
    catch (err) { setError(errorText(err)) }
    finally { setBusy(false) }
  }

  return <div className="content-layout"><section className="panel content-primary"><div className="panel-head"><div><span className="eyebrow">ORGANIZAÇÃO</span><h2>Categorias de veículos</h2><p>Use categorias para ajudar o cliente a navegar pelo estoque.</p></div><span className="count-pill">{items?.length ?? 0}</span></div>{items === null ? <Spinner /> : !items.length ? <EmptyState icon={<Tag size={30} />} title="Comece pelas categorias" text="Separe seus veículos de um jeito que faça sentido para os clientes." /> : <div className="category-list">{items.map((item) => <div className="category-row" key={item.id}><span className="category-icon"><Tag size={19} /></span><div><strong>{item.name}</strong><small>/{item.slug}</small></div><span className="count-soft">{item._count.vehicles} veículos</span><div className="table-actions"><button type="button" title="Editar categoria" aria-label={`Editar ${item.name}`} onClick={() => { setEditing(item); setName(item.name); setError('') }}><Pencil size={17} /></button><button type="button" title={item._count.vehicles ? 'Categoria com veículos' : 'Remover categoria'} aria-label={`Remover ${item.name}`} disabled={item._count.vehicles > 0} onClick={() => { setRemoving(item); setError('') }}><Trash2 size={17} /></button></div></div>)}</div>}</section><aside className="content-aside"><div className="panel aside-form"><span className="eyebrow">NOVA CATEGORIA</span><h3>Crie uma seção para o estoque</h3><p>Exemplos: SUVs, Picapes, Motos ou Seminovos.</p><form onSubmit={create}><Field label="Nome da categoria" placeholder="Ex: SUVs" required maxLength={100} value={editing ? '' : name} disabled={Boolean(editing)} onChange={(e) => setName(e.target.value)} /><Button type="submit" disabled={busy || Boolean(editing)}>Adicionar categoria <Plus size={16} /></Button></form></div><div className="hint-card"><Layers3 size={23} /><strong>Veículos também no desktop</strong><p>Cadastre carros e fotos pela seção Veículos. As categorias organizam o estoque nas duas interfaces.</p></div></aside>{editing && <Modal title="Editar categoria" onClose={() => { setEditing(null); setName('') }} footer={<><Button variant="secondary" onClick={() => { setEditing(null); setName('') }}>Cancelar</Button><Button type="submit" form="edit-category" disabled={busy}>Salvar</Button></>}><form id="edit-category" onSubmit={update}><Field label="Nome" required value={name} onChange={(e) => setName(e.target.value)} />{error && <div className="form-error">{error}</div>}</form></Modal>}{removing && <Modal title="Remover categoria" onClose={() => setRemoving(null)} footer={<><Button variant="secondary" onClick={() => setRemoving(null)}>Cancelar</Button><Button variant="danger" disabled={busy} onClick={remove}>Remover</Button></>}><p>A categoria <strong>{removing.name}</strong> será removida. Esta ação só está disponível quando ela não contém veículos.</p>{error && <div className="form-error">{error}</div>}</Modal>}</div>
}

const emptyBanner: BannerInput = { title: '', subtitle: '', buttonText: '', buttonLink: '', position: 0, isActive: false }

function BannerPanel({ apiOrigin, notify }: { apiOrigin: string; notify: Notify }) {
  const [items, setItems] = useState<Banner[] | null>(null)
  const [form, setForm] = useState<BannerInput>(emptyBanner)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modal, setModal] = useState<'form' | 'delete' | null>(null)
  const [removing, setRemoving] = useState<Banner | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const load = useCallback(() => window.cartalog.banners.list().then(setItems).catch((err) => notify(errorText(err), 'error')), [notify])
  useEffect(() => { void load() }, [load])

  function openCreate() { setForm(emptyBanner); setEditingId(null); setError(''); setModal('form') }
  function openEdit(item: Banner) { setForm({ title: item.title, subtitle: item.subtitle ?? '', buttonText: item.buttonText ?? '', buttonLink: item.buttonLink ?? '', position: item.position ?? 0, isActive: item.isActive }); setEditingId(item.id); setError(''); setModal('form') }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      if (editingId) { await window.cartalog.banners.update(editingId, form); notify('Banner atualizado.') }
      else { const created = await window.cartalog.banners.create(form); notify('Banner criado como rascunho. Adicione uma imagem para publicá-lo.'); setModal(null); await upload(created.id); void load(); return }
      setModal(null); void load()
    } catch (err) { setError(errorText(err)) }
    finally { setBusy(false) }
  }

  async function upload(id: string) {
    try { const result = await window.cartalog.banners.uploadImage(id); if (result) { notify('Imagem do banner enviada. Publique quando estiver pronto.'); void load() } }
    catch (err) { notify(errorText(err), 'error') }
  }

  async function toggle(item: Banner) {
    setBusy(true)
    try { await window.cartalog.banners.update(item.id, { isActive: !item.isActive }); notify(item.isActive ? 'Banner pausado.' : 'Banner publicado.'); void load() }
    catch (err) { notify(errorText(err), 'error') }
    finally { setBusy(false) }
  }

  async function remove() {
    if (!removing) return
    setBusy(true); setError('')
    try { await window.cartalog.banners.delete(removing.id); setModal(null); setRemoving(null); notify('Banner removido.'); void load() }
    catch (err) { setError(errorText(err)) }
    finally { setBusy(false) }
  }

  return <div className="content-layout"><section className="panel content-primary"><div className="panel-head"><div><span className="eyebrow">DESTAQUES</span><h2>Banners da página inicial</h2><p>Mensagens e imagens para apresentar as campanhas da loja.</p></div><Button onClick={openCreate}><Plus size={17} /> Novo banner</Button></div>{items === null ? <Spinner /> : !items.length ? <EmptyState icon={<ImagePlus size={30} />} title="Nenhum banner por aqui" text="Crie uma mensagem visual para destacar sua loja no catálogo." action={<Button onClick={openCreate}>Criar banner <ArrowRight size={17} /></Button>} /> : <div className="banner-list">{items.map((item) => <div className="banner-row" key={item.id}><div className="banner-thumbnail">{item.imageUrl ? <img src={imageUrl(item.imageUrl, apiOrigin)} alt="" /> : <ImagePlus size={24} />}</div><div className="banner-details"><strong>{item.title}</strong><small>{item.subtitle || 'Sem subtítulo'}</small><span className={item.isActive ? 'published-pill' : 'draft-pill'}>{item.isActive ? 'Publicado' : 'Rascunho'}</span></div><div className="banner-actions"><Button type="button" variant="ghost" onClick={() => void upload(item.id)} disabled={busy}><UploadCloud size={16} /> {item.imageUrl ? 'Trocar imagem' : 'Enviar imagem'}</Button><Button type="button" variant="secondary" disabled={busy || (!item.imageUrl && !item.isActive)} onClick={() => void toggle(item)}>{item.isActive ? 'Pausar' : 'Publicar'}</Button><div className="table-actions"><button type="button" title="Editar banner" aria-label={`Editar ${item.title}`} onClick={() => openEdit(item)}><Pencil size={17} /></button><button type="button" title="Remover banner" aria-label={`Remover ${item.title}`} onClick={() => { setRemoving(item); setError(''); setModal('delete') }}><Trash2 size={17} /></button></div></div></div>)}</div>}</section><aside className="content-aside"><div className="hint-card tall"><ImagePlus size={26} /><strong>Imagem primeiro, publicação depois</strong><p>O banner começa como rascunho. Adicione uma imagem de até 8 MB e publique quando estiver pronto.</p></div></aside>{modal === 'form' && <Modal title={editingId ? 'Editar banner' : 'Novo banner'} subtitle="Mensagem de destaque da página inicial." onClose={() => { if (!busy) setModal(null) }} footer={<><Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button><Button type="submit" form="banner-form" disabled={busy}>{busy ? 'Salvando...' : editingId ? 'Salvar banner' : 'Criar e escolher imagem'}</Button></>}><form id="banner-form" className="form-stack" onSubmit={submit}><Field label="Título" required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Field label="Subtítulo" maxLength={300} value={form.subtitle ?? ''} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /><div className="field-grid"><Field label="Texto do botão" maxLength={100} value={form.buttonText ?? ''} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} /><Field label="Link do botão" maxLength={500} placeholder="/veiculos" value={form.buttonLink ?? ''} onChange={(e) => setForm({ ...form, buttonLink: e.target.value })} /></div><Field label="Ordem" type="number" min={0} value={form.position ?? 0} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} />{error && <div className="form-error">{error}</div>}</form></Modal>}{modal === 'delete' && removing && <Modal title="Remover banner" onClose={() => setModal(null)} footer={<><Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button><Button variant="danger" disabled={busy} onClick={remove}>Remover</Button></>}><p>O banner <strong>{removing.title}</strong> será removido da página inicial.</p>{error && <div className="form-error">{error}</div>}</Modal>}</div>
}
