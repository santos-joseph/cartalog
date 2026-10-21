import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, CarFront, ImagePlus, Pencil, Plus, Save, Search, Star, Trash2, UploadCloud } from 'lucide-react'
import type { Category, ReferenceItem, Vehicle, VehicleInput, VehicleList } from '../types'
import { Button, EmptyState, errorText, Field, imageUrl, Modal, PageHeading, Spinner, TextArea } from '../ui'

type Notify = (text: string, kind?: 'success' | 'error') => void
type Mode = 'list' | 'new' | 'edit'

const blank = (): VehicleInput => ({ modelId: '', categoryId: '', fuelId: '', transmissionId: '', year: new Date().getFullYear(), mileage: 0, price: 0, color: '', description: '', featureIds: [], status: 'available' })
const statusLabels = { available: 'Disponível', reserved: 'Reservado', sold: 'Vendido' }
const money = (value: string | number) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function VehiclesPage({ apiOrigin, notify }: { apiOrigin: string; notify: Notify }) {
  const [mode, setMode] = useState<Mode>('list')
  const [list, setList] = useState<VehicleList | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [brands, setBrands] = useState<ReferenceItem[]>([])
  const [models, setModels] = useState<ReferenceItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [fuels, setFuels] = useState<ReferenceItem[]>([])
  const [transmissions, setTransmissions] = useState<ReferenceItem[]>([])
  const [features, setFeatures] = useState<ReferenceItem[]>([])
  const [brandId, setBrandId] = useState('')
  const [form, setForm] = useState<VehicleInput>(blank)
  const [current, setCurrent] = useState<Vehicle | null>(null)
  const [removing, setRemoving] = useState<Vehicle | null>(null)
  const [busy, setBusy] = useState(false)
  const [loadingEditor, setLoadingEditor] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    window.cartalog.vehicles.list({ page, search: appliedSearch || undefined, status: status || undefined })
      .then(setList).catch((cause) => notify(errorText(cause), 'error'))
  }, [page, appliedSearch, status, notify])
  useEffect(() => { if (mode === 'list') void load() }, [mode, load])
  useEffect(() => {
    Promise.all([window.cartalog.vehicles.brands(), window.cartalog.categories.list(), window.cartalog.vehicles.fuels(), window.cartalog.vehicles.transmissions(), window.cartalog.vehicles.features()])
      .then(([b, c, f, t, x]) => { setBrands(b); setCategories(c); setFuels(f); setTransmissions(t); setFeatures(x) })
      .catch((cause) => notify(errorText(cause), 'error'))
  }, [notify])
  useEffect(() => {
    if (!brandId) { setModels([]); return }
    window.cartalog.vehicles.models(brandId).then(setModels).catch((cause) => notify(errorText(cause), 'error'))
  }, [brandId, notify])

  function change<K extends keyof VehicleInput>(key: K, value: VehicleInput[K]) { setForm((old) => ({ ...old, [key]: value })) }
  function openNew() { setForm(blank()); setBrandId(''); setCurrent(null); setError(''); setMode('new') }
  async function openEdit(vehicle: Vehicle) {
    setLoadingEditor(true); setError('')
    try {
      const full = await window.cartalog.vehicles.get(vehicle.id)
      setCurrent(full)
      setBrandId(full.model.brand.id)
      setForm({ modelId: full.model.id, categoryId: full.category?.id ?? '', fuelId: full.fuel?.id ?? '', transmissionId: full.transmission?.id ?? '', year: full.year, mileage: full.mileage, price: Number(full.price), color: full.color ?? '', description: full.description ?? '', featureIds: full.features?.map(({ feature }) => feature.id) ?? [], status: full.status })
      setMode('edit')
    } catch (cause) { notify(errorText(cause), 'error') }
    finally { setLoadingEditor(false) }
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      const saved = current ? await window.cartalog.vehicles.update(current.id, form) : await window.cartalog.vehicles.create(form)
      const full = await window.cartalog.vehicles.get(saved.id)
      setCurrent(full); setMode('edit'); notify(current ? 'Veículo atualizado.' : 'Veículo cadastrado. Agora você pode adicionar fotos.')
    } catch (cause) { setError(errorText(cause)) }
    finally { setBusy(false) }
  }
  async function upload() {
    if (!current) return
    setBusy(true)
    try {
      const images = await window.cartalog.vehicles.uploadImages(current.id)
      if (images) { setCurrent(await window.cartalog.vehicles.get(current.id)); notify(`${images.length} foto${images.length === 1 ? '' : 's'} enviada${images.length === 1 ? '' : 's'}.`) }
    } catch (cause) { notify(errorText(cause), 'error') }
    finally { setBusy(false) }
  }
  async function changeImage(imageId: string, action: 'cover' | 'delete') {
    if (!current) return
    setBusy(true)
    try {
      if (action === 'cover') await window.cartalog.vehicles.setCover(current.id, imageId)
      else await window.cartalog.vehicles.deleteImage(current.id, imageId)
      setCurrent(await window.cartalog.vehicles.get(current.id))
      notify(action === 'cover' ? 'Foto de capa atualizada.' : 'Foto removida.')
    } catch (cause) { notify(errorText(cause), 'error') }
    finally { setBusy(false) }
  }
  async function remove() {
    if (!removing) return
    setBusy(true); setError('')
    try { await window.cartalog.vehicles.delete(removing.id); setRemoving(null); notify('Veículo removido.'); setList(null); load() }
    catch (cause) { setError(errorText(cause)) }
    finally { setBusy(false) }
  }

  if (mode === 'list') return <>
    <PageHeading eyebrow="ESTOQUE DA LOJA" title="Seus veículos, em um só lugar." description="Cadastre, edite e organize o mesmo estoque exibido na web." action={<Button onClick={openNew}><Plus size={17} /> Cadastrar veículo</Button>} />
    <section className="panel vehicle-list-panel">
      <form className="vehicle-filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setAppliedSearch(search.trim()) }}>
        <label className="vehicle-search"><Search size={18} /><input aria-label="Buscar veículos" placeholder="Buscar marca, modelo ou cor" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <select aria-label="Filtrar por status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="">Todos os status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <Button type="submit" variant="secondary">Buscar</Button>
        <span className="count-pill">{list?.meta.total ?? 0} veículos</span>
      </form>
      {!list || loadingEditor ? <Spinner text="Carregando veículos" /> : list.data.length === 0 ? <EmptyState icon={<CarFront size={30} />} title="Nenhum veículo encontrado" text="Cadastre seu primeiro carro ou ajuste os filtros." action={<Button onClick={openNew}>Cadastrar veículo <Plus size={16} /></Button>} /> : <div className="vehicle-rows">{list.data.map((item) => <div className="vehicle-row" key={item.id}>
        <div className="vehicle-thumb">{item.images[0]?.imageUrl ? <img src={imageUrl(item.images[0].imageUrl, apiOrigin)} alt="" /> : <CarFront size={26} />}</div>
        <div className="vehicle-details"><strong>{item.model.brand.name} {item.model.name}</strong><small>{item.year} · {item.mileage.toLocaleString('pt-BR')} km · {item.color || 'Sem cor'}</small></div>
        <strong className="vehicle-price">{money(item.price)}</strong><span className={`vehicle-status vehicle-status-${item.status}`}>{statusLabels[item.status]}</span>
        <div className="table-actions"><button type="button" title="Editar veículo" aria-label={`Editar ${item.model.name}`} onClick={() => void openEdit(item)}><Pencil size={17} /></button><button type="button" title="Excluir veículo" aria-label={`Excluir ${item.model.name}`} onClick={() => { setRemoving(item); setError('') }}><Trash2 size={17} /></button></div>
      </div>)}</div>}
      {list && list.meta.lastPage > 1 && <div className="vehicle-pagination"><Button variant="secondary" disabled={page <= 1} onClick={() => { setList(null); setPage(page - 1) }}>Anterior</Button><span>Página {page} de {list.meta.lastPage}</span><Button variant="secondary" disabled={page >= list.meta.lastPage} onClick={() => { setList(null); setPage(page + 1) }}>Próxima</Button></div>}
    </section>
    {removing && <Modal title="Excluir veículo?" onClose={() => setRemoving(null)} footer={<><Button variant="secondary" onClick={() => setRemoving(null)}>Cancelar</Button><Button variant="danger" disabled={busy} onClick={() => void remove()}>Excluir</Button></>}><p>{removing.model.brand.name} {removing.model.name} sairá do catálogo. Veículos vinculados a leads não podem ser excluídos.</p>{error && <div className="form-error">{error}</div>}</Modal>}
  </>

  return <>
    <button className="vehicle-back" type="button" onClick={() => { setMode('list'); setList(null); setError('') }}><ArrowLeft size={17} /> Voltar ao estoque</button>
    <PageHeading eyebrow={mode === 'new' ? 'NOVO ANÚNCIO' : 'EDITAR ANÚNCIO'} title={mode === 'new' ? 'Cadastre um veículo.' : `${current?.model.brand.name} ${current?.model.name}`} description="Os dados salvos aqui aparecem no mesmo catálogo da web." />
    <form className="vehicle-editor" onSubmit={save}><div className="vehicle-editor-main"><section className="panel vehicle-form-section"><h2>Identificação</h2><div className="field-grid"><label className="field"><span className="field-label">Marca</span><select required value={brandId} onChange={(event) => { setBrandId(event.target.value); change('modelId', '') }}><option value="">Selecione a marca</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label><label className="field"><span className="field-label">Modelo</span><select required disabled={!brandId} value={form.modelId} onChange={(event) => change('modelId', event.target.value)}><option value="">Selecione o modelo</option>{models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}</select></label></div><div className="field-grid"><Field label="Ano" required type="number" min={1950} max={new Date().getFullYear() + 1} value={form.year} onChange={(event) => change('year', Number(event.target.value))} /><Field label="Preço (R$)" required type="number" min={0.01} step={0.01} value={form.price || ''} onChange={(event) => change('price', Number(event.target.value))} /></div><div className="field-grid"><Field label="Quilometragem" required type="number" min={0} value={form.mileage} onChange={(event) => change('mileage', Number(event.target.value))} /><Field label="Cor" value={form.color || ''} onChange={(event) => change('color', event.target.value)} /></div></section>
      <section className="panel vehicle-form-section"><h2>Detalhes do anúncio</h2><div className="field-grid"><label className="field"><span className="field-label">Categoria</span><select value={form.categoryId || ''} onChange={(event) => change('categoryId', event.target.value)}><option value="">Sem categoria</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="field"><span className="field-label">Status</span><select value={form.status} onChange={(event) => change('status', event.target.value as Vehicle['status'])}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><div className="field-grid"><label className="field"><span className="field-label">Combustível</span><select value={form.fuelId || ''} onChange={(event) => change('fuelId', event.target.value)}><option value="">Não informado</option>{fuels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="field"><span className="field-label">Câmbio</span><select value={form.transmissionId || ''} onChange={(event) => change('transmissionId', event.target.value)}><option value="">Não informado</option>{transmissions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><TextArea label="Descrição" rows={5} value={form.description || ''} onChange={(event) => change('description', event.target.value)} />{features.length > 0 && <div><span className="field-label">Opcionais</span><div className="vehicle-features">{features.map((item) => <label key={item.id}><input type="checkbox" checked={form.featureIds.includes(item.id)} onChange={(event) => change('featureIds', event.target.checked ? [...form.featureIds, item.id] : form.featureIds.filter((id) => id !== item.id))} />{item.name}</label>)}</div></div>}</section>
      {error && <div className="form-error">{error}</div>}
      <div className="vehicle-form-actions"><Button variant="secondary" type="button" onClick={() => setMode('list')}>Cancelar</Button><Button type="submit" disabled={busy}><Save size={17} /> {busy ? 'Salvando...' : 'Salvar veículo'}</Button></div>
    </div><aside className="vehicle-editor-aside"><section className="panel vehicle-photo-panel"><div className="vehicle-photo-head"><ImagePlus size={22} /><h2>Fotos do veículo</h2></div><p>Até 20 fotos, PNG, JPG ou WEBP com até 5 MB cada.</p>{!current ? <div className="vehicle-photo-empty">Salve o veículo para adicionar fotos.</div> : <><Button type="button" variant="secondary" disabled={busy || current.images.length >= 20} onClick={() => void upload()}><UploadCloud size={16} /> Adicionar fotos</Button>{current.images.length === 0 ? <div className="vehicle-photo-empty">Nenhuma foto cadastrada.</div> : <div className="vehicle-photo-grid">{current.images.map((photo) => <div key={photo.id} className="vehicle-photo"><img src={imageUrl(photo.imageUrl, apiOrigin)} alt="Foto do veículo" /><div><button type="button" disabled={busy || photo.isCover} title="Definir como capa" onClick={() => void changeImage(photo.id, 'cover')}><Star size={15} fill={photo.isCover ? 'currentColor' : 'none'} />{photo.isCover ? 'Capa' : 'Usar como capa'}</button><button type="button" disabled={busy} title="Remover foto" onClick={() => void changeImage(photo.id, 'delete')}><Trash2 size={15} /></button></div></div>)}</div>}</>}</section></aside></form>
  </>
}
