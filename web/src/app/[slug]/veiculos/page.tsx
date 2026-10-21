import Link from 'next/link'
import { ArrowUpRight, Car, Gauge, Fuel } from 'lucide-react'
import { getCatalog, getCatalogVehicles } from '@/services/catalog.service'
import { formatCurrency, formatMileage } from '@/lib/utils'
import { VehicleFilters } from '@/components/catalog/vehicle-filters'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'

function VehicleCard({ v, showPrices }: { v: any; showPrices: boolean }) {
  const cover = v.images?.[0]?.imageUrl
  return (
    <Link
      href={`/veiculos/${v.slug}`}
      className="group bg-card rounded-[26px] border border-border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all hover:no-underline flex flex-col"
    >
      <div className="aspect-[16/11] bg-muted overflow-hidden relative">
        {cover ? (
          <img src={`${API_URL}${cover}`} alt={`${v.model.brand.name} ${v.model.name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#f5f5f7]">
            <Car className="text-primary/40" size={36} />
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">{v.model.brand.name}</p>
        <h3 className="font-bold text-foreground mt-0.5">{v.model.name} {v.year}</h3>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {v.mileage != null && <span className="flex items-center gap-1"><Gauge size={11} />{formatMileage(v.mileage)}</span>}
          {v.fuel && <span className="flex items-center gap-1"><Fuel size={11} />{v.fuel.name}</span>}
          {v.transmission && <span>{v.transmission.name}</span>}
        </div>
        <div className="mt-auto pt-5 flex items-center justify-between">
          {showPrices && <span className="text-xl font-semibold tracking-tight">{formatCurrency(v.price)}</span>}
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-primary"><ArrowUpRight size={17} /></span>
        </div>
      </div>
    </Link>
  )
}

export default async function VehiclesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { slug } = await params
  const sp = await searchParams

  const filters: Record<string, string> = { status: 'available' }
  if (sp.search) filters.search = sp.search
  if (sp.page) filters.page = sp.page
  if (sp.brandId) filters.brandId = sp.brandId
  if (sp.fuelId) filters.fuelId = sp.fuelId
  if (sp.yearMin) filters.yearMin = sp.yearMin
  if (sp.yearMax) filters.yearMax = sp.yearMax
  if (sp.priceMax) filters.priceMax = sp.priceMax
  if (sp.orderBy) filters.orderBy = sp.orderBy
  if (sp.order) filters.order = sp.order
  filters.perPage = '12'

  const [catalog, data] = await Promise.all([getCatalog(slug), getCatalogVehicles(slug, filters)])
  const showPrices = catalog?.company.siteSettings?.showPrices !== false
  const vehicles = data?.data ?? []
  const meta = data?.meta ?? { total: 0, page: 1, lastPage: 1 }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 sm:py-16">
      <div className="mb-10 rounded-[32px] border-b-[6px] border-secondary bg-[#1d1d1f] px-7 py-10 text-white sm:px-10 sm:py-12"><p className="text-xs font-semibold uppercase tracking-[.14em] text-white/50 mb-3">Explore o catálogo</p><h1 className="text-[clamp(2.2rem,4vw,3.6rem)] font-semibold tracking-[-.055em] leading-[1.08]">Encontre o carro certo<br /><span className="text-white/50">para o seu momento.</span></h1><p className="mt-5 text-sm text-white/60">{meta.total} veículos para conhecer. Use os filtros e descubra o seu.</p></div>

      <div className="flex flex-col lg:flex-row gap-7">
        <aside className="lg:w-[280px] flex-shrink-0">
          <VehicleFilters currentFilters={sp} />
        </aside>

        <div className="min-w-0 flex-1"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-semibold tracking-tight">Resultados</h2><span className="rounded-full border border-border bg-white px-3 py-1 text-xs text-muted-foreground">{meta.total} veículos</span></div>
          {vehicles.length === 0 ? (
            <div className="rounded-[28px] border border-border bg-white text-center py-20">
              <Car size={48} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">Nenhum veículo encontrado</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Tente ajustar os filtros</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {vehicles.map((v: any) => (
                  <VehicleCard key={v.id} v={v} showPrices={showPrices} />
                ))}
              </div>

              {meta.lastPage > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: meta.lastPage }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/veiculos?${new URLSearchParams({ ...sp, page: String(p) })}`}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors hover:no-underline ${
                        meta.page === p
                          ? 'bg-gradient-primary text-primary-foreground shadow-sm'
                          : 'bg-card border border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {p}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
