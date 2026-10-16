import Link from 'next/link'
import { Car, Gauge, Fuel, ArrowRight, Search } from 'lucide-react'
import { getCatalog, getCatalogVehicles } from '@/services/catalog.service'
import { notFound } from 'next/navigation'
import { formatCurrency, formatMileage } from '@/lib/utils'

function VehicleCard({ v, apiUrl }: { v: any; apiUrl: string }) {
  const cover = v.images?.[0]?.imageUrl
  return (
    <Link
      href={`/veiculos/${v.slug}`}
      className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow hover:no-underline flex flex-col"
    >
      <div className="aspect-[4/3] bg-muted overflow-hidden relative">
        {cover ? (
          <img
            src={`${apiUrl}${cover}`}
            alt={`${v.model.brand.name} ${v.model.name} ${v.year}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-primary opacity-60">
            <Car className="text-white" size={40} />
          </div>
        )}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-sm">
          <span className="font-bold text-foreground text-sm">{formatCurrency(v.price)}</span>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">{v.model.brand.name}</p>
        <h3 className="font-bold text-foreground mt-0.5">{v.model.name} <span className="text-muted-foreground font-normal">{v.year}</span></h3>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          {v.mileage != null && (
            <span className="flex items-center gap-1"><Gauge size={12} />{formatMileage(v.mileage)}</span>
          )}
          {v.fuel && (
            <span className="flex items-center gap-1"><Fuel size={12} />{v.fuel.name}</span>
          )}
        </div>
        <div className="mt-auto pt-3">
          <span className="text-xs text-primary font-medium group-hover:underline">Ver detalhes →</span>
        </div>
      </div>
    </Link>
  )
}

export default async function CatalogHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [catalogData, vehiclesData] = await Promise.all([
    getCatalog(slug),
    getCatalogVehicles(slug, { perPage: '9', status: 'available' }),
  ])

  if (!catalogData) notFound()

  const { company } = catalogData
  const vehicles = vehiclesData?.data ?? []
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-primary relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-12 w-80 h-80 rounded-full bg-white/5" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{company.name}</h1>
          <p className="text-white/70 text-lg mb-8">Encontre o veículo perfeito para você</p>
          <Link
            href="/veiculos"
            className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors text-base hover:no-underline shadow-lg"
          >
            <Search size={18} />
            Ver todos os veículos
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap gap-6 justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{vehiclesData?.meta?.total ?? vehicles.length}</p>
            <p className="text-xs text-muted-foreground">veículos disponíveis</p>
          </div>
          {company.phone && (
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">{company.phone}</p>
              <p className="text-xs text-muted-foreground">Telefone</p>
            </div>
          )}
          {company.whatsapp && (
            <div className="text-center">
              <a href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-green-600 hover:no-underline">WhatsApp</a>
              <p className="text-xs text-muted-foreground">Atendimento online</p>
            </div>
          )}
        </div>
      </div>

      {/* Vehicles grid */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Nosso Estoque</h2>
            <p className="text-muted-foreground text-sm mt-1">{vehiclesData?.meta?.total ?? 0} veículos disponíveis</p>
          </div>
          <Link href="/veiculos" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 hover:no-underline">
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="text-center py-16">
            <Car size={48} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhum veículo disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v: any) => (
              <VehicleCard key={v.id} v={v} apiUrl={apiUrl} />
            ))}
          </div>
        )}

        {(vehiclesData?.meta?.total ?? 0) > 9 && (
          <div className="text-center mt-10">
            <Link
              href="/veiculos"
              className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold px-8 py-3 rounded-xl hover:bg-primary hover:text-white transition-colors hover:no-underline"
            >
              Ver todos os veículos <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
