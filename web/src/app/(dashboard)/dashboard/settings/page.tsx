'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { CheckCircle2, X, AlertCircle, Loader2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth.store'
import { leadsService } from '@/services/leads.service'
import type { LeadStatus } from '@/types'

interface Settings {
  primaryColor: string
  secondaryColor: string
  whatsapp: string | null
  phone: string | null
  email: string | null
  siteTitle: string | null
  siteDescription: string | null
  siteKeywords: string | null
  showPrices: boolean
  showWhatsappButton: boolean
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
}

async function fetchViaCEP(cep: string) {
  const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
  const data = await r.json()
  if (data.erro) throw new Error('CEP não encontrado')
  return data as { logradouro: string; localidade: string; uf: string }
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const company = useAuthStore((s) => s.company)

  const { data, isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: () => api.get('/companies/settings').then((r) => r.data),
  })

  const [form, setForm] = useState<Partial<Settings>>({})
  useEffect(() => { if (data) setForm(data) }, [data])

  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)

  async function handleCEPChange(value: string) {
    setForm((f) => ({ ...f, zipCode: value }))
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length !== 8) { setCepError(null); return }
    setCepLoading(true)
    setCepError(null)
    try {
      const cepData = await fetchViaCEP(cleaned)
      setForm((f) => ({
        ...f,
        zipCode: value,
        address: cepData.logradouro || f.address,
        city: cepData.localidade || f.city,
        state: cepData.uf || f.state,
      }))
    } catch {
      setCepError('CEP não encontrado')
    } finally {
      setCepLoading(false)
    }
  }

  function buildPayload(): Partial<Settings> {
    const nullify = (v: string | null | undefined) => (v === '' ? null : v ?? null)
    return {
      ...form,
      whatsapp: nullify(form.whatsapp),
      phone: nullify(form.phone),
      email: nullify(form.email),
      siteTitle: nullify(form.siteTitle),
      siteDescription: nullify(form.siteDescription),
      siteKeywords: nullify(form.siteKeywords),
      address: nullify(form.address),
      city: nullify(form.city),
      state: nullify(form.state),
      zipCode: nullify(form.zipCode),
    }
  }

  const mutation = useMutation({
    mutationFn: (payload: Partial<Settings>) => api.put('/companies/settings', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })

  const { data: statuses = [], refetch: refetchStatuses } = useQuery<LeadStatus[]>({
    queryKey: ['lead-statuses'],
    queryFn: () => leadsService.statuses().then((r) => r.data),
  })

  const [newStatus, setNewStatus] = useState('')

  const addStatusMutation = useMutation({
    mutationFn: (name: string) => leadsService.createStatus({ name }),
    onSuccess: () => { refetchStatuses(); setNewStatus('') },
  })

  const deleteStatusMutation = useMutation({
    mutationFn: (id: string) => leadsService.deleteStatus(id),
    onSuccess: () => refetchStatuses(),
  })

  function set(field: keyof Settings) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Personalize o catálogo de {company?.name}</p>
      </div>

      {/* Identidade Visual */}
      <Card>
        <CardHeader><CardTitle>Identidade Visual</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Cor primária</label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="color"
                  value={form.primaryColor ?? '#DC2626'}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  className="h-10 w-16 rounded-lg border border-input cursor-pointer bg-background p-1"
                />
                <span className="text-sm text-muted-foreground font-mono">{form.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Cor secundária</label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="color"
                  value={form.secondaryColor ?? '#991B1B'}
                  onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
                  className="h-10 w-16 rounded-lg border border-input cursor-pointer bg-background p-1"
                />
                <span className="text-sm text-muted-foreground font-mono">{form.secondaryColor}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Cores aplicadas no cabeçalho, botões e destaques do catálogo público.
          </p>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader><CardTitle>SEO e Informações do Site</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Título do site"
            value={form.siteTitle ?? ''}
            onChange={set('siteTitle')}
            placeholder="Ex: Demo Motors — Os melhores carros"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Descrição</label>
            <textarea
              value={form.siteDescription ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, siteDescription: e.target.value }))}
              rows={3}
              placeholder="Descrição para os mecanismos de busca..."
              className="w-full rounded-lg border border-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none"
            />
          </div>
          <Input
            label="Palavras-chave (SEO)"
            value={form.siteKeywords ?? ''}
            onChange={set('siteKeywords')}
            placeholder="carros, veículos, seminovos, sua cidade..."
          />
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader><CardTitle>Contato</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="WhatsApp"
              placeholder="5511999999999"
              value={form.whatsapp ?? ''}
              onChange={set('whatsapp')}
            />
            <Input
              label="Telefone"
              placeholder="(11) 9999-9999"
              value={form.phone ?? ''}
              onChange={set('phone')}
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="contato@suloja.com"
              value={form.email ?? ''}
              onChange={set('email')}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">CEP</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="00000-000"
                  value={form.zipCode ?? ''}
                  onChange={(e) => handleCEPChange(e.target.value)}
                  maxLength={9}
                  className="w-full h-10 rounded-lg border border-input px-3 pr-8 text-sm text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {cepLoading ? (
                    <Loader2 size={14} className="animate-spin text-muted-foreground" />
                  ) : cepError ? (
                    <AlertCircle size={14} className="text-destructive" />
                  ) : (form.zipCode?.replace(/\D/g, '').length ?? 0) === 8 ? (
                    <MapPin size={14} className="text-success" />
                  ) : null}
                </div>
              </div>
              {cepError && <p className="text-xs text-destructive">{cepError}</p>}
            </div>
            <Input
              label="Cidade"
              value={form.city ?? ''}
              onChange={set('city')}
            />
            <Input
              label="Estado (UF)"
              placeholder="SP"
              maxLength={2}
              value={form.state ?? ''}
              onChange={set('state')}
            />
          </div>
          <div className="mt-4">
            <Input
              label="Endereço"
              value={form.address ?? ''}
              onChange={set('address')}
              placeholder="Rua Exemplo, 123 — Bairro"
            />
          </div>
        </CardContent>
      </Card>

      {/* Exibição */}
      <Card>
        <CardHeader><CardTitle>Exibição no Catálogo</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showPrices ?? true}
              onChange={(e) => setForm((f) => ({ ...f, showPrices: e.target.checked }))}
              className="w-4 h-4 rounded border-input text-primary focus:ring-ring"
            />
            <span className="text-sm text-foreground">Mostrar preços no catálogo</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showWhatsappButton ?? true}
              onChange={(e) => setForm((f) => ({ ...f, showWhatsappButton: e.target.checked }))}
              className="w-4 h-4 rounded border-input text-primary focus:ring-ring"
            />
            <span className="text-sm text-foreground">Mostrar botão de WhatsApp flutuante</span>
          </label>
        </CardContent>
      </Card>

      {/* Pipeline de Vendas */}
      <Card>
        <CardHeader><CardTitle>Pipeline de Vendas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Status disponíveis para o funil de leads.</p>
          <div className="flex flex-wrap gap-2">
            {statuses.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-sm text-foreground">
                <span>{s.name}</span>
                <button
                  onClick={() => deleteStatusMutation.mutate(s.id)}
                  disabled={deleteStatusMutation.isPending}
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 ml-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {statuses.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Nenhum status criado ainda</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nome do novo status..."
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newStatus.trim()) addStatusMutation.mutate(newStatus.trim())
              }}
            />
            <Button
              variant="outline"
              loading={addStatusMutation.isPending}
              disabled={!newStatus.trim()}
              onClick={() => { if (newStatus.trim()) addStatusMutation.mutate(newStatus.trim()) }}
            >
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pb-8">
        {mutation.isError && (
          <span className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle size={15} />
            {(mutation.error as any)?.response?.data?.details
              ? `Erro de validação: ${Object.values((mutation.error as any).response.data.details).flat().join(', ')}`
              : (mutation.error as any)?.response?.data?.error ?? 'Erro ao salvar — verifique sua conexão'}
          </span>
        )}
        {mutation.isSuccess && (
          <span className="flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 size={15} />
            Configurações salvas
          </span>
        )}
        <Button variant="gradient" loading={mutation.isPending} onClick={() => mutation.mutate(buildPayload())}>
          Salvar configurações
        </Button>
      </div>
    </div>
  )
}
