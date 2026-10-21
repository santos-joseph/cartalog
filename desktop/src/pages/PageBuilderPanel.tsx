import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowLeft, ArrowUp, BookOpenText, ImagePlus, LayoutTemplate, Link2, Plus, Trash2, Type, UploadCloud } from 'lucide-react'
import type { PageBlock, PageInput, PageSummary } from '../types'
import { Button, EmptyState, errorText, Field, imageUrl, Modal, Spinner, Switch, TextArea } from '../ui'

type Notify = (text: string, kind?: 'success' | 'error') => void
const blank = (): PageInput => ({ title: '', slug: '', blocks: [{ type: 'hero', eyebrow: '', title: '', subtitle: '' }], isPublished: false })
function slugify(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
const blockNames = { hero: 'Abertura', text: 'Texto', image: 'Imagem', cta: 'Botão' }

export function PageBuilderPanel({ apiOrigin, notify }: { apiOrigin: string; notify: Notify }) {
  const [items, setItems] = useState<PageSummary[] | null>(null)
  const [form, setForm] = useState<PageInput>(blank)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState<PageSummary | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const load = useCallback(() => window.cartalog.pages.list().then(setItems).catch((cause) => notify(errorText(cause), 'error')), [notify])
  useEffect(() => { void load() }, [load])

  function openCreate() { setForm(blank()); setEditingId(null); setError(''); setEditing(true) }
  async function openEdit(page: PageSummary) {
    setBusy(true)
    try {
      const full = await window.cartalog.pages.get(page.id)
      const blocks = Array.isArray(full.blocks) && full.blocks.length ? full.blocks : [{ type: 'text', heading: '', body: full.content }] as PageBlock[]
      setForm({ title: full.title, slug: full.slug, blocks, isPublished: full.isPublished })
      setEditingId(full.id); setError(''); setEditing(true)
    } catch (cause) { notify(errorText(cause), 'error') }
    finally { setBusy(false) }
  }
  function updateBlock(index: number, patch: Partial<PageBlock>) {
    setForm((current) => ({ ...current, blocks: current.blocks.map((block, at) => at === index ? { ...block, ...patch } as PageBlock : block) }))
  }
  function addBlock(block: PageBlock) { setForm((current) => ({ ...current, blocks: [...current.blocks, block] })) }
  function moveBlock(index: number, direction: -1 | 1) {
    setForm((current) => { const blocks = [...current.blocks]; const target = index + direction; if (target < 0 || target >= blocks.length) return current; [blocks[index], blocks[target]] = [blocks[target], blocks[index]]; return { ...current, blocks } })
  }
  async function addImage() {
    setBusy(true)
    try { const result = await window.cartalog.pages.uploadImage(); if (result) addBlock({ type: 'image', imageUrl: result.imageUrl, alt: '', caption: '' }) }
    catch (cause) { notify(errorText(cause), 'error') }
    finally { setBusy(false) }
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setError('')
    if (!form.blocks.length) return setError('Adicione pelo menos um bloco.')
    setBusy(true)
    try {
      if (editingId) await window.cartalog.pages.update(editingId, form)
      else await window.cartalog.pages.create(form)
      setEditing(false); notify(editingId ? 'Página atualizada.' : 'Página criada.'); void load()
    } catch (cause) { setError(errorText(cause)) }
    finally { setBusy(false) }
  }
  async function remove() {
    if (!removing) return
    setBusy(true); setError('')
    try { await window.cartalog.pages.delete(removing.id); setRemoving(null); notify('Página removida.'); void load() }
    catch (cause) { setError(errorText(cause)) }
    finally { setBusy(false) }
  }

  if (!editing) return <div className="content-layout"><section className="panel content-primary"><div className="panel-head"><div><span className="eyebrow">CONSTRUTOR DE PÁGINAS</span><h2>Páginas da loja</h2><p>Monte páginas públicas com blocos e publique quando estiverem prontas.</p></div><Button onClick={openCreate}><Plus size={17} /> Nova página</Button></div>{items === null ? <Spinner /> : !items.length ? <EmptyState icon={<BookOpenText size={30} />} title="Nenhuma página criada" text="Crie uma página para contar a história da loja, explicar financiamento ou apresentar serviços." action={<Button onClick={openCreate}>Criar página <Plus size={17} /></Button>} /> : <div className="content-list">{items.map((item) => <div className="content-row" key={item.id}><span className="content-row-icon"><BookOpenText size={22} /></span><div><strong>{item.title}</strong><small>/paginas/{item.slug}</small></div><span className={item.isPublished ? 'published-pill' : 'draft-pill'}>{item.isPublished ? 'Publicada' : 'Rascunho'}</span><div className="table-actions"><button type="button" title="Editar página" aria-label={`Editar ${item.title}`} disabled={busy} onClick={() => void openEdit(item)}><LayoutTemplate size={17} /></button><button type="button" title="Remover página" aria-label={`Remover ${item.title}`} onClick={() => { setRemoving(item); setError('') }}><Trash2 size={17} /></button></div></div>)}</div>}</section><aside className="content-aside"><div className="hint-card tall"><LayoutTemplate size={26} /><strong>Blocos simples, página pronta</strong><p>Combine uma abertura, textos, imagens e botões. Reordene os blocos antes de publicar. As páginas aparecem no menu do site.</p></div></aside>{removing && <Modal title="Remover página" onClose={() => setRemoving(null)} footer={<><Button variant="secondary" onClick={() => setRemoving(null)}>Cancelar</Button><Button variant="danger" disabled={busy} onClick={() => void remove()}>Remover</Button></>}><p>A página <strong>{removing.title}</strong> será removida do catálogo.</p>{error && <div className="form-error">{error}</div>}</Modal>}</div>

  return <div className="page-builder"><button type="button" className="vehicle-back" onClick={() => setEditing(false)}><ArrowLeft size={17} /> Voltar às páginas</button><div className="page-builder-heading"><div><span className="eyebrow">CONSTRUTOR DE PÁGINAS</span><h2>{editingId ? 'Editar página' : 'Nova página'}</h2><p>Monte a página com blocos e visualize a composição ao lado.</p></div><span className={form.isPublished ? 'published-pill' : 'draft-pill'}>{form.isPublished ? 'Publicada' : 'Rascunho'}</span></div><form onSubmit={save} className="page-builder-layout"><div className="page-builder-main"><section className="panel vehicle-form-section"><h3>Informações da página</h3><Field label="Título" required maxLength={200} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, slug: editingId ? current.slug : slugify(event.target.value) }))} /><Field label="Endereço da página" required pattern="[a-z0-9-]+" maxLength={100} hint="Ex.: sobre-nos; a página abre em /paginas/sobre-nos" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} /><Switch label="Publicar página" description="Quando ativa, a página aparece no menu do catálogo." checked={form.isPublished} onChange={(value) => setForm((current) => ({ ...current, isPublished: value }))} /></section>
      <div className="page-block-toolbar"><strong>Blocos da página</strong><div><Button type="button" variant="secondary" onClick={() => addBlock({ type: 'hero', eyebrow: '', title: '', subtitle: '' })}><LayoutTemplate size={15} /> Abertura</Button><Button type="button" variant="secondary" onClick={() => addBlock({ type: 'text', heading: '', body: '' })}><Type size={15} /> Texto</Button><Button type="button" variant="secondary" disabled={busy} onClick={() => void addImage()}><ImagePlus size={15} /> Imagem</Button><Button type="button" variant="secondary" onClick={() => addBlock({ type: 'cta', text: '', href: '/veiculos', style: 'primary' })}><Link2 size={15} /> Botão</Button></div></div>
      {form.blocks.map((block, index) => <section className="panel page-block-editor" key={`${block.type}-${index}`}><header><span className="eyebrow">BLOCO {index + 1} · {blockNames[block.type].toUpperCase()}</span><div><button type="button" title="Subir" disabled={index === 0} onClick={() => moveBlock(index, -1)}><ArrowUp size={16} /></button><button type="button" title="Descer" disabled={index === form.blocks.length - 1} onClick={() => moveBlock(index, 1)}><ArrowDown size={16} /></button><button type="button" title="Remover bloco" onClick={() => setForm((current) => ({ ...current, blocks: current.blocks.filter((_, at) => at !== index) }))}><Trash2 size={16} /></button></div></header><div className="page-block-fields">
        {block.type === 'hero' && <><Field label="Sobretítulo" maxLength={80} value={block.eyebrow} onChange={(event) => updateBlock(index, { eyebrow: event.target.value })} /><Field label="Título principal" required maxLength={180} value={block.title} onChange={(event) => updateBlock(index, { title: event.target.value })} /><TextArea label="Subtítulo" rows={3} maxLength={500} value={block.subtitle} onChange={(event) => updateBlock(index, { subtitle: event.target.value })} /></>}
        {block.type === 'text' && <><Field label="Título da seção" maxLength={180} value={block.heading} onChange={(event) => updateBlock(index, { heading: event.target.value })} /><TextArea label="Texto" required rows={7} maxLength={10000} value={block.body} onChange={(event) => updateBlock(index, { body: event.target.value })} /></>}
        {block.type === 'image' && <><img className="page-image-editor" src={imageUrl(block.imageUrl, apiOrigin)} alt="Prévia do bloco" /><Field label="Descrição da imagem" maxLength={180} value={block.alt} onChange={(event) => updateBlock(index, { alt: event.target.value })} /><Field label="Legenda" maxLength={300} value={block.caption} onChange={(event) => updateBlock(index, { caption: event.target.value })} /><Button type="button" variant="secondary" disabled={busy} onClick={async () => { setBusy(true); try { const result = await window.cartalog.pages.uploadImage(); if (result) updateBlock(index, { imageUrl: result.imageUrl }) } catch (cause) { notify(errorText(cause), 'error') } finally { setBusy(false) } }}><UploadCloud size={16} /> Trocar imagem</Button></>}
        {block.type === 'cta' && <><Field label="Texto do botão" required maxLength={100} value={block.text} onChange={(event) => updateBlock(index, { text: event.target.value })} /><Field label="Destino" required maxLength={500} hint="Use /veiculos ou um link HTTPS." value={block.href} onChange={(event) => updateBlock(index, { href: event.target.value })} /><label className="field"><span className="field-label">Aparência</span><select value={block.style} onChange={(event) => updateBlock(index, { style: event.target.value as 'primary' | 'outline' })}><option value="primary">Destaque</option><option value="outline">Contorno</option></select></label></>}
      </div></section>)}
      {error && <div className="form-error">{error}</div>}<div className="vehicle-form-actions"><Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Salvando...' : 'Salvar página'}</Button></div>
    </div><aside className="page-builder-aside"><div className="panel page-live-preview"><span className="eyebrow">PRÉVIA DA PÁGINA</span><div className="page-preview-canvas">{form.blocks.length === 0 ? <p>Adicione um bloco para começar.</p> : form.blocks.map((block, index) => <div key={index} className={`page-preview-block page-preview-${block.type}`}>{block.type === 'hero' ? <><small>{block.eyebrow || 'SOBRETÍTULO'}</small><strong>{block.title || 'Título da abertura'}</strong><p>{block.subtitle || 'Seu subtítulo aparece aqui.'}</p></> : block.type === 'text' ? <><strong>{block.heading || 'Título da seção'}</strong><p>{block.body || 'Seu texto aparece aqui.'}</p></> : block.type === 'image' ? <img src={imageUrl(block.imageUrl, apiOrigin)} alt={block.alt} /> : <span className={block.style === 'primary' ? 'page-preview-button' : 'page-preview-button outline'}>{block.text || 'Texto do botão'}</span>}</div>)}</div><p className="preview-note">Prévia aproximada. O site usa o layout responsivo da loja.</p></div></aside></form></div>
}
