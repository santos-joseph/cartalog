'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Save, Trash2, Star, StarOff, ImagePlus, Loader2, CheckCircle2, CarFront,
} from 'lucide-react'
import Link from 'next/link'
import { vehiclesService } from '@/services/vehicles.service'
import { companiesService } from '@/services/companies.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import type { Vehicle } from '@/types'
import { formatCurrency } from '@/lib/utils'

const selectClass =
  'w-full h-11 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors'

export default function EditVehiclePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: vehicle, isLoading } = useQuery<Vehicle>({
    queryKey: ['vehicle', id],
    queryFn: () => vehiclesService.findById(id).then((r) => r.data),
  })

  const [form, setForm] = useState({
    brandId: '', modelId: '', year: new Date().getFullYear(), mileage: 0,
    price: '', color: '', status: 'available', fuelId: '', transmissionId: '',
    categoryId: '', description: '', featureIds: [] as string[],
  })

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => vehiclesService.getBrands().then((r) => r.data),
  })
  const { data: models = [] } = useQuery({
    queryKey: ['models', form.brandId],
    queryFn: () => vehiclesService.getModels(form.brandId).then((r) => r.data),
    enabled: !!form.brandId,
  })
  const { data: fuels = [] } = useQuery({
    queryKey: ['fuels'],
    queryFn: () => vehiclesService.getFuels().then((r) => r.data),
  })
  const { data: transmissions = [] } = useQuery({
    queryKey: ['transmissions'],
    queryFn: () => vehiclesService.getTransmissions().then((r) => r.data),
  })
  const { data: features = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => vehiclesService.getFeatures().then((r) => r.data),
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => companiesService.getCategories().then((r) => r.data),
  })

  useEffect(() => {
    if (vehicle) {
      setForm({
        brandId: vehicle.model.brand.id,
        modelId: vehicle.model.id,
        year: vehicle.year,
        mileage: vehicle.mileage,
        price: vehicle.price,
        color: vehicle.color ?? '',
        status: vehicle.status,
        fuelId: vehicle.fuel?.id ?? '',
        transmissionId: vehicle.transmission?.id ?? '',
        categoryId: vehicle.category?.id ?? '',
        description: vehicle.description ?? '',
        featureIds: vehicle.features?.map((f) => f.feature.id) ?? [],
      })
    }
  }, [vehicle])

  const [error, setError] = useState('')
  const saveMutation = useMutation({
    mutationFn: (data: typeof form) =>
      vehiclesService.update(id, {
        modelId: data.modelId,
        categoryId: data.categoryId || undefined,
        fuelId: data.fuelId || undefined,
        transmissionId: data.transmissionId || undefined,
        color: data.color || undefined,
        description: data.description || undefined,
        status: data.status,
        featureIds: data.featureIds,
        price: parseFloat(data.price as string),
        mileage: Number(data.mileage),
        year: Number(data.year),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      qc.invalidateQueries({ queryKey: ['vehicle', id] })
      setError('')
    },
    onError: (e: any) => setError(e?.response?.data?.error ?? 'Erro ao salvar veículo'),
  })

  const uploadMutation = useMutation({
    mutationFn: (files: FileList) => {
      const fd = new FormData()
      Array.from(files).forEach((f) => fd.append('images', f))
      return vehiclesService.uploadImages(id, fd)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicle', id] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) => vehiclesService.deleteImage(id, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicle', id] }),
  })

  const setCoverMutation = useMutation({
    mutationFn: (imageId: string) => vehiclesService.setCover(id, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicle', id] }),
  })

  function set(f: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.value
      setForm((p) => ({ ...p, [f]: value, ...(f === 'brandId' ? { modelId: '' } : {}) }))
    }
  }

  function toggleFeature(featureId: string) {
    setForm((p) => ({
      ...p,
      featureIds: p.featureIds.includes(featureId)
        ? p.featureIds.filter((x) => x !== featureId)
        : [...p.featureIds, featureId],
    }))
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Veículo não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/vehicles')}>
          Voltar para veículos
        </Button>
      </div>
    )
  }

  const coverImage = vehicle.images?.find((image) => image.isCover) ?? vehicle.images?.[0]

  return (
    <div className="space-y-8">
      <div><Link href="/dashboard/vehicles" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Voltar ao estoque</Link><p className="page-eyebrow mb-2 mt-7">Editar anúncio</p><h1 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-[-.055em] leading-[1.08]">{vehicle.model.brand.name} {vehicle.model.name}</h1><p className="mt-3 text-muted-foreground">Revise as informações e mantenha o catálogo atualizado.</p></div>

      {error && (
        <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]"><div className="min-w-0 space-y-6">
      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Fotos do veículo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {vehicle.images?.map((img) => (
              <div
                key={img.id}
                className="relative group aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted"
              >
                <img
                  src={`${apiUrl}${img.imageUrl}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/35 opacity-100 sm:bg-black/55 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCoverMutation.mutate(img.id)}
                    title={img.isCover ? 'Foto de capa' : 'Definir como capa'}
                    className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                  >
                    {img.isCover
                      ? <Star size={14} className="text-amber-500 fill-amber-500" />
                      : <StarOff size={14} className="text-muted-foreground" />}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(img.id)}
                    className="p-1.5 bg-white/90 rounded-lg hover:bg-destructive hover:text-white transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {img.isCover && (
                  <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    Capa
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="aspect-[4/3] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary disabled:opacity-50"
            >
              {uploadMutation.isPending
                ? <Loader2 size={20} className="animate-spin" />
                : (
                  <>
                    <ImagePlus size={20} />
                    <span className="text-xs font-medium">Adicionar fotos</span>
                  </>
                )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && uploadMutation.mutate(e.target.files)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Passe o mouse sobre as fotos para gerenciá-las. A foto marcada com estrela é a capa do catálogo.
          </p>
        </CardContent>
      </Card>

      {/* Identification */}
      <Card>
        <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Marca *</label>
              <select value={form.brandId} onChange={set('brandId')} required className={selectClass}>
                <option value="">Selecione a marca</option>
                {(brands as any[]).map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Modelo *</label>
              <select value={form.modelId} onChange={set('modelId')} required disabled={!form.brandId} className={selectClass}>
                <option value="">Selecione o modelo</option>
                {(models as any[]).map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Ano *"
              type="number"
              value={String(form.year)}
              onChange={set('year')}
              min="1900"
              max={String(new Date().getFullYear() + 1)}
              required
            />
            <Input
              label="Quilometragem"
              type="number"
              value={String(form.mileage)}
              onChange={set('mileage')}
              min="0"
              placeholder="0"
            />
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

      {/* Details */}
      <Card>
        <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Preço (R$) *"
              type="number"
              step="0.01"
              value={form.price}
              onChange={set('price')}
              placeholder="Ex: 45000"
              required
            />
            <Input label="Cor" value={form.color} onChange={set('color')} placeholder="Ex: Branco" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Combustível</label>
              <select value={form.fuelId} onChange={set('fuelId')} className={selectClass}>
                <option value="">Selecionar</option>
                {(fuels as any[]).map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Câmbio</label>
              <select value={form.transmissionId} onChange={set('transmissionId')} className={selectClass}>
                <option value="">Selecionar</option>
                {(transmissions as any[]).map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Categoria</label>
              <select value={form.categoryId} onChange={set('categoryId')} className={selectClass}>
                <option value="">Selecionar</option>
                {(categories as any[]).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
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

      {/* Features */}
      {(features as any[]).length > 0 && (
        <Card>
          <CardHeader><CardTitle>Opcionais</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(features as any[]).map((f: any) => (
                <label
                  key={f.id}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted transition-colors"
                >
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

      </div><aside className="space-y-5 lg:sticky lg:top-28 lg:self-start"><div className="overflow-hidden rounded-[28px] border border-border bg-white"><div className="aspect-[16/10] bg-[radial-gradient(circle_at_50%_30%,#fff0f1,#f4f4f6)]">{coverImage ? <img src={`${apiUrl}${coverImage.imageUrl}`} alt="Prévia do veículo" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-primary/35"><CarFront size={58} strokeWidth={1.2} /></div>}</div><div className="p-6"><p className="page-eyebrow mb-2">Como está no catálogo</p><h2 className="text-xl font-semibold tracking-tight">{vehicle.model.brand.name} {vehicle.model.name}</h2><p className="mt-1 text-sm text-muted-foreground">{form.year} · {form.mileage} km</p><p className="mt-5 text-2xl font-semibold tracking-tight text-primary">{form.price ? formatCurrency(form.price) : 'Preço a definir'}</p></div></div><div className="rounded-[28px] bg-[#1d1d1f] p-6 text-white"><p className="text-xs font-semibold uppercase tracking-[.14em] text-white/50">Dica para o anúncio</p><h3 className="mt-4 text-lg font-semibold">Fotos e detalhes vendem a primeira visita.</h3><p className="mt-2 text-sm leading-6 text-white/60">Mantenha imagens, preço e status sempre atualizados para facilitar o contato do cliente.</p></div></aside></div>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
        {saveMutation.isSuccess && (
          <span className="flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 size={15} />
            Salvo com sucesso
          </span>
        )}
        <Link href="/dashboard/vehicles">
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
          <Save size={16} />
          Salvar alterações
        </Button>
      </div>
    </div>
  )
}
