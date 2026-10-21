'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

interface Props {
  currentFilters: Record<string, string>
}

export function VehicleFilters({ currentFilters }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const [form, setForm] = useState({
    search: currentFilters.search ?? '',
    yearMin: currentFilters.yearMin ?? '',
    yearMax: currentFilters.yearMax ?? '',
    priceMax: currentFilters.priceMax ?? '',
    orderBy: currentFilters.orderBy ?? 'createdAt',
    order: currentFilters.order ?? 'desc',
  })

  function apply(updates: Partial<typeof form>) {
    const next = { ...form, ...updates }
    setForm(next)
    const params = new URLSearchParams()
    if (next.search) params.set('search', next.search)
    if (next.yearMin) params.set('yearMin', next.yearMin)
    if (next.yearMax) params.set('yearMax', next.yearMax)
    if (next.priceMax) params.set('priceMax', next.priceMax)
    if (next.orderBy !== 'createdAt' || next.order !== 'desc') {
      params.set('orderBy', next.orderBy)
      params.set('order', next.order)
    }
    const qs = params.toString()
    startTransition(() => {
      router.push(qs ? `/veiculos?${qs}` : '/veiculos')
    })
  }

  function clear() {
    setForm({ search: '', yearMin: '', yearMax: '', priceMax: '', orderBy: 'createdAt', order: 'desc' })
    startTransition(() => router.push('/veiculos'))
  }

  const hasFilters = Object.values(form).some((v, i) => {
    const defaults = ['', '', '', '', 'createdAt', 'desc']
    return v !== defaults[i]
  })

  return (
    <div className="rounded-[26px] border border-border bg-white p-6 lg:sticky lg:top-28">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2 text-lg">
          <SlidersHorizontal size={18} className="text-primary" /> Refine a busca
        </h3>
        {hasFilters && (
          <button onClick={clear} className="text-xs text-destructive flex items-center gap-1 hover:underline">
            <X size={12} /> Limpar
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar marca, modelo..."
            value={form.search}
            onChange={(e) => apply({ search: e.target.value })}
            className="w-full pl-9 pr-3 h-11 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>

        {/* Year range */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Ano</label>
          <div className="flex gap-2">
            <input type="number" placeholder="De" value={form.yearMin} onChange={(e) => apply({ yearMin: e.target.value })}
              className="w-full h-11 px-2.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <input type="number" placeholder="Até" value={form.yearMax} onChange={(e) => apply({ yearMax: e.target.value })}
              className="w-full h-11 px-2.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

        {/* Max price */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Preço máximo (R$)</label>
          <input type="number" placeholder="Ex: 80000" value={form.priceMax} onChange={(e) => apply({ priceMax: e.target.value })}
            className="w-full h-11 px-2.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {/* Sort */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Ordenar por</label>
          <select
            value={`${form.orderBy}:${form.order}`}
            onChange={(e) => {
              const [orderBy, order] = e.target.value.split(':')
              apply({ orderBy, order })
            }}
            className="w-full h-11 px-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="createdAt:desc">Mais recentes</option>
            <option value="price:asc">Menor preço</option>
            <option value="price:desc">Maior preço</option>
            <option value="year:desc">Mais novo</option>
            <option value="mileage:asc">Menor km</option>
          </select>
        </div>
      </div>
    </div>
  )
}
