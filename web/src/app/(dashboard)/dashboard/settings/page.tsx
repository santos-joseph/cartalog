'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth.store'

interface Settings {
  primaryColor: string
  secondaryColor: string
  siteTitle: string | null
  siteDescription: string | null
  whatsapp: string | null
  instagram: string | null
  facebook: string | null
  address: string | null
  city: string | null
  state: string | null
  showPrices: boolean
  vehiclesPerPage: number
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const company = useAuthStore((s) => s.company)

  const { data, isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: () => api.get('/companies/settings').then((r) => r.data),
  })

  const [form, setForm] = useState<Partial<Settings>>({})

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const mutation = useMutation({
    mutationFn: (payload: Partial<Settings>) => api.put('/companies/settings', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })

  function set(field: keyof Settings) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  if (isLoading) return <div className="p-8 text-gray-500">Carregando...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Personalize o catálogo de {company?.name}</p>
      </div>

      {/* Identidade visual */}
      <Card>
        <CardHeader>
          <CardTitle>Identidade Visual</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Cor primária</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={form.primaryColor ?? '#2563EB'}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  className="h-9 w-16 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-500">{form.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Cor secundária</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={form.secondaryColor ?? '#1E40AF'}
                  onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
                  className="h-9 w-16 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-500">{form.secondaryColor}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader><CardTitle>SEO e Informações do Site</CardTitle></CardHeader>
        <div className="space-y-4">
          <Input label="Título do site" value={form.siteTitle ?? ''} onChange={set('siteTitle')} placeholder="Ex: Demo Motors — Os melhores carros" />
          <div>
            <label className="text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              value={form.siteDescription ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, siteDescription: e.target.value }))}
              rows={3}
              placeholder="Descrição para os mecanismos de busca..."
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader><CardTitle>Redes Sociais e Contato</CardTitle></CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <Input label="WhatsApp" placeholder="5511999999999" value={form.whatsapp ?? ''} onChange={set('whatsapp')} />
          <Input label="Instagram" placeholder="@empresa" value={form.instagram ?? ''} onChange={set('instagram')} />
          <Input label="Facebook" placeholder="facebook.com/empresa" value={form.facebook ?? ''} onChange={set('facebook')} />
          <Input label="Cidade" value={form.city ?? ''} onChange={set('city')} />
          <Input label="Estado" placeholder="SP" value={form.state ?? ''} onChange={set('state')} />
          <Input label="Endereço" value={form.address ?? ''} onChange={set('address')} />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button loading={mutation.isPending} onClick={() => mutation.mutate(form)}>
          Salvar configurações
        </Button>
      </div>

      {mutation.isSuccess && (
        <p className="text-sm text-green-600 text-right">✓ Configurações salvas com sucesso</p>
      )}
    </div>
  )
}
