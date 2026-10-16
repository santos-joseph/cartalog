import Link from 'next/link'
import { Car, Gauge, Fuel } from 'lucide-react'
import { getCatalogVehicles } from '@/services/catalog.service'
import { formatCurrency, formatMileage } from '@/lib/utils'
import { VehicleFilters } from '@/components/catalog/vehicle-filters'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'

function VehicleCard({ v }: { v: any }) {
  const cover = v.images?.[0]?.imageUrl
  return (
    <Link
      href={`/veiculos/${v.slug}`}
      className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow hover:no-underline flex flex-col"
    >
      <div className="aspect-[16/10] bg-muted overflow-hidden relative">
        {cover ? (
          <img src={`${API_URL}${cover}`} alt={`${v.model.brand.name} ${v.model.name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-primary opacity-50">
            <Car className="text-white" size={36} />
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">{v.model.brand.name}</p>
        <h3 className="font-bold text-foreground mt-0.5">{v.model.name} {v.year}</h3>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {v.mileage != null && <span className="flex items-center gap-1"><Gauge size={11} />{formatMileage(v.mileage)}</span>}
          {v.fuel && <span className="flex items-center gap-1"><Fuel size={11} />{v.fuel.name}</span>}
          {v.transmission && <span>{v.transmission.name}</span>}
        </div>
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="text-xl font-bold text-primary">{formatCurrency(v.price)}</span>
          <span className="text-xs text-primary font-medium group-hover:underline">Ver mais →</span>
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

  const data = await getCatalogVehicles(slug, filters)
  const vehicles = data?.data ?? []
  const meta = data?.meta ?? { total: 0, page: 1, lastPage: 1 }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Todos os Veículos</h1>
        <p className="text-muted-foreground text-sm mt-1">{meta.total} veículos encontrados</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <VehicleFilters currentFilters={sp} />
        </aside>

        <div className="flex-1">
          {vehicles.length === 0 ? (
            <div className="text-center py-20">
              <Car size={48} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">Nenhum veículo encontrado</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Tente ajustar os filtros</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {vehicles.map((v: any) => (
                  <VehicleCard key={v.id} v={v} />
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
                          ? 'bg-gradient-primary text-white shadow-sm'
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
