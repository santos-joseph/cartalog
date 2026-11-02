'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Save, ImagePlus, X, Star, CarFront, Check } from 'lucide-react'
import Link from 'next/link'
import { vehiclesService } from '@/services/vehicles.service'
import { companiesService } from '@/services/companies.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { formatCurrency } from '@/lib/utils'

interface LocalImage {
  file: File
  preview: string
  isCover: boolean
}

export default function NewVehiclePage() {
  const router = useRouter()

  const [form, setForm] = useState({
    brandId: '', modelName: '', year: new Date().getFullYear(), mileage: 0,
    price: '', color: '', status: 'available', fuelId: '', transmissionId: '',
    categoryId: '', description: '', featureIds: [] as string[],
  })
  const [images, setImages] = useState<LocalImage[]>([])
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: () => vehiclesService.getBrands().then(r => r.data) })
  const { data: models = [] } = useQuery({
    queryKey: ['models', form.brandId],
    queryFn: () => vehiclesService.getModels(form.brandId).then(r => r.data),
    enabled: !!form.brandId,
  })
  const { data: fuels = [] } = useQuery({ queryKey: ['fuels'], queryFn: () => vehiclesService.getFuels().then(r => r.data) })
  const { data: transmissions = [] } = useQuery({ queryKey: ['transmissions'], queryFn: () => vehiclesService.getTransmissions().then(r => r.data) })
  const { data: features = [] } = useQuery({ queryKey: ['features'], queryFn: () => vehiclesService.getFeatures().then(r => r.data) })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => companiesService.getCategories().then(r => r.data) })

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      // 1. Cria o veículo
      const res = await vehiclesService.create({
        brandId: data.brandId,
        modelName: data.modelName.trim(),
        categoryId: data.categoryId || undefined,
        fuelId: data.fuelId || undefined,
        transmissionId: data.transmissionId || undefined,
        year: Number(data.year),
        mileage: Number(data.mileage),
        price: parseFloat(data.price),
        color: data.color || undefined,
        description: data.description || undefined,
        featureIds: data.featureIds,
        status: data.status,
      })
      const vehicleId: string = res.data.id

      // 2. Upload das fotos (se houver)
      if (images.length > 0) {
        const fd = new FormData()
        // Capa primeiro
        const ordered = [...images].sort((a, b) => (b.isCover ? 1 : 0) - (a.isCover ? 1 : 0))
        ordered.forEach(img => fd.append('images', img.file))
        await vehiclesService.uploadImages(vehicleId, fd)
      }

      return vehicleId
    },
    onSuccess: (vehicleId) => router.push(`/dashboard/vehicles/${vehicleId}`),
    onError: (e: any) => setError(e?.response?.data?.error ?? 'Erro ao cadastrar veículo'),
  })

  function set(f: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value
      setForm((p) => ({ ...p, [f]: value, ...(f === 'brandId' ? { modelName: '' } : {}) }))
    }
  }

  function toggleFeature(id: string) {
    setForm((p) => ({
      ...p,
      featureIds: p.featureIds.includes(id) ? p.featureIds.filter(x => x !== id) : [...p.featureIds, id],
    }))
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    const newImgs: LocalImage[] = Array.from(files).slice(0, 20 - images.length).map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      isCover: images.length === 0 && i === 0,
    }))
    setImages((prev) => [...prev, ...newImgs])
  }

  function removeImage(idx: number) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      // Se removeu a capa, define o primeiro como capa
      if (prev[idx].isCover && next.length > 0) next[0].isCover = true
      return next
    })
  }

  function setCover(idx: number) {
    setImages((prev) => prev.map((img, i) => ({ ...img, isCover: i === idx })))
  }

  const selectClass = "w-full h-11 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"

  return (
    <div className="space-y-8">
      <div><Link href="/dashboard/vehicles" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Voltar ao estoque</Link><p className="page-eyebrow mb-2 mt-7">Novo no catálogo</p><h1 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-[-.055em] leading-[1.08]">Conte a história deste carro.</h1><p className="mt-3 text-muted-foreground">Complete os dados e veja como ele vai aparecer para o cliente.</p></div>

      {error && (
        <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]"><div className="min-w-0 space-y-6">
      {/* ── Fotos ── */}
      <Card>
        <CardHeader>
          <CardTitle>Fotos do veículo</CardTitle>
          <p className="text-sm text-muted-foreground">Adicione até 20 fotos. A primeira (ou marcada com estrela) será a capa.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative group aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted">
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                {/* Overlay de ações */}
                <div className="absolute inset-0 bg-black/35 opacity-100 sm:bg-black/50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCover(idx)}
                    title={img.isCover ? 'Capa' : 'Definir como capa'}
                    className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                  >
                    <Star size={13} className={img.isCover ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-1.5 bg-white/90 rounded-lg hover:bg-destructive hover:text-white transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
                {/* Badge de capa */}
                {img.isCover && (
                  <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    Capa
                  </div>
                )}
              </div>
            ))}

            {/* Botão de adicionar */}
            {images.length < 20 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[4/3] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary"
              >
                <ImagePlus size={20} />
                <span className="text-xs font-medium">Adicionar</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </CardContent>
      </Card>

      {/* ── Identificação ── */}
      <Card>
        <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Marca *</label>
              <select value={form.brandId} onChange={set('brandId')} required className={selectClass}>
                <option value="">Selecione a marca</option>
                {(brands as any[]).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="vehicle-model" className="text-sm font-medium text-foreground">Modelo *</label>
              <input id="vehicle-model" list="vehicle-model-options" value={form.modelName} onChange={set('modelName')} required maxLength={120} disabled={!form.brandId} placeholder="Digite o modelo" className={selectClass} />
              <datalist id="vehicle-model-options">{(models as any[]).map((m: any) => <option key={m.id} value={m.name} />)}</datalist>
              <p className="text-xs text-muted-foreground">Pode digitar um modelo que ainda não aparece na lista.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Ano *" type="number" value={String(form.year)} onChange={set('year')} min="1900" max={String(new Date().getFullYear() + 1)} required />
            <Input label="Quilometragem" type="number" value={String(form.mileage)} onChange={set('mileage')} min="0" placeholder="0" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Status</label>
              <select value={form.status} onChange={set('status')} className={selectClass}>
                <option value="available">Disponível</option>
                <option value="reserved">Reservado</option>
                <option value="sold">Vendido</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Detalhes ── */}
      <Card>
        <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Preço (R$) *" type="number" step="0.01" value={form.price} onChange={set('price')} placeholder="Ex: 45000" required />
            <Input label="Cor" value={form.color} onChange={set('color')} placeholder="Ex: Branco" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Combustível</label>
              <select value={form.fuelId} onChange={set('fuelId')} className={selectClass}>
                <option value="">Selecionar</option>
                {(fuels as any[]).map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Câmbio</label>
              <select value={form.transmissionId} onChange={set('transmissionId')} className={selectClass}>
                <option value="">Selecionar</option>
                {(transmissions as any[]).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Categoria</label>
              <select value={form.categoryId} onChange={set('categoryId')} className={selectClass}>
                <option value="">Selecionar</option>
                {(categories as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <RichTextEditor
            label="Descrição"
            value={form.description}
            onChange={(v) => setForm((p) => ({ ...p, description: v }))}
            placeholder="Descreva o veículo, condições, diferenciais..."
            rows={7}
          />
        </CardContent>
      </Card>

      {/* ── Opcionais ── */}
      {(features as any[]).length > 0 && (
        <Card>
          <CardHeader><CardTitle>Opcionais</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(features as any[]).map((f: any) => (
                <label key={f.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted transition-colors">
                  <input
                    type="checkbox"
                    checked={form.featureIds.includes(f.id)}
                    onChange={() => toggleFeature(f.id)}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-ring"
                  />
                  <span className="text-sm text-foreground">{f.name}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div><aside className="space-y-5 lg:sticky lg:top-28 lg:self-start"><div className="overflow-hidden rounded-[28px] border border-border bg-white"><div className="aspect-[16/10] bg-[radial-gradient(circle_at_50%_30%,#fff0f1,#f4f4f6)]">{images.find((img) => img.isCover) ? <img src={images.find((img) => img.isCover)?.preview} alt="Prévia do veículo" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-primary/35"><CarFront size={58} strokeWidth={1.2} /></div>}</div><div className="p-6"><p className="page-eyebrow mb-2">Prévia do anúncio</p><h2 className="text-xl font-semibold tracking-tight">{(brands as any[]).find((brand: any) => brand.id === form.brandId)?.name || 'Marca'} {form.modelName || 'e modelo'}</h2><p className="mt-1 text-sm text-muted-foreground">{form.year || 'Ano'} · {form.mileage || 0} km</p><p className="mt-5 text-2xl font-semibold tracking-tight text-primary">{form.price ? formatCurrency(form.price) : 'Preço a definir'}</p></div></div><div className="rounded-[28px] bg-[#1d1d1f] p-6 text-white"><p className="text-xs font-semibold uppercase tracking-[.14em] text-white/50">Antes de publicar</p><div className="mt-5 space-y-4">{['Identifique marca e modelo', 'Informe o preço e os detalhes', 'Adicione fotos de qualidade'].map((step) => <div key={step} className="flex items-center gap-3 text-sm"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10"><Check size={14} /></span>{step}</div>)}</div></div></aside></div>
      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-6 pb-8">
        <Link href="/dashboard/vehicles"><Button variant="outline">Cancelar</Button></Link>
        <Button loading={mutation.isPending} onClick={() => mutation.mutate(form)}>
          <Save size={16} />
          {mutation.isPending ? 'Salvando...' : `Salvar veículo${images.length > 0 ? ` + ${images.length} foto${images.length > 1 ? 's' : ''}` : ''}`}
        </Button>
      </div>
    </div>
  )
}
