import { notFound } from 'next/navigation'
import { getCatalog, getCatalogVehicle } from '@/services/catalog.service'
import { formatCurrency, formatMileage } from '@/lib/utils'
import { Gauge, Fuel, Settings2, Tag, Calendar, Palette } from 'lucide-react'
import { VehicleGallery } from '@/components/catalog/vehicle-gallery'
import { LeadForm } from '@/components/catalog/lead-form'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string; vehicleSlug: string }>
}) {
  const { slug, vehicleSlug } = await params
  const [catalog, vehicle] = await Promise.all([getCatalog(slug), getCatalogVehicle(slug, vehicleSlug)])
  if (!vehicle || !catalog) notFound()
  const showPrices = catalog.company.siteSettings?.showPrices !== false

  const title = `${vehicle.model.brand.name} ${vehicle.model.name} ${vehicle.year}`

  const specs = [
    { icon: Calendar, label: 'Ano', value: vehicle.year },
    { icon: Gauge, label: 'Quilometragem', value: vehicle.mileage != null ? formatMileage(vehicle.mileage) : '—' },
    { icon: Fuel, label: 'Combustível', value: vehicle.fuel?.name ?? '—' },
    { icon: Settings2, label: 'Câmbio', value: vehicle.transmission?.name ?? '—' },
    { icon: Palette, label: 'Cor', value: vehicle.color ?? '—' },
    { icon: Tag, label: 'Categoria', value: vehicle.category?.name ?? '—' },
  ]

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10 sm:py-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-9">
        <Link href="/" className="hover:text-foreground transition-colors hover:no-underline">Início</Link>
        <span>/</span>
        <Link href="/veiculos" className="hover:text-foreground transition-colors hover:no-underline">Veículos</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{title}</span>
      </nav>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="page-eyebrow mb-2">{vehicle.model.brand.name}</p><h1 className="text-[clamp(2.3rem,4.5vw,4.2rem)] font-semibold tracking-[-.055em] leading-[1.08]">{vehicle.model.name} <span className="text-muted-foreground">{vehicle.year}</span></h1><p className="mt-3 text-sm text-muted-foreground">Veja todos os detalhes antes de falar com a loja.</p></div>{showPrices && <div className="rounded-full border border-border bg-white px-5 py-3 text-lg font-semibold tracking-tight text-primary">{formatCurrency(vehicle.price)}</div>}</div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_350px] gap-7">
        {/* Left: gallery + details */}
        <div className="min-w-0 space-y-6">
          {/* Gallery */}
          <VehicleGallery images={vehicle.images ?? []} apiUrl={API_URL} title={title} />

          {/* Specs grid */}
          <div className="bg-card rounded-[28px] border border-border p-6 sm:p-8">
            <p className="page-eyebrow mb-2">Os detalhes</p><h2 className="text-xl font-semibold text-foreground mb-6">Especificações</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold text-foreground">{String(value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          {vehicle.features && vehicle.features.length > 0 && (
            <div className="bg-card rounded-[28px] border border-border p-6 sm:p-8">
              <p className="page-eyebrow mb-2">Equipamentos</p><h2 className="text-xl font-semibold text-foreground mb-5">Opcionais</h2>
              <div className="grid grid-cols-2 gap-2">
                {vehicle.features.map((f: any) => (
                  <div key={f.feature.id} className="flex items-center gap-2 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {f.feature.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {vehicle.description && (
            <div className="bg-card rounded-[28px] border border-border p-6 sm:p-8">
              <p className="page-eyebrow mb-2">Conheça melhor</p><h2 className="text-xl font-semibold text-foreground mb-4">Descrição</h2>
              <div className="text-sm text-muted-foreground leading-relaxed">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => <h2 className="text-base font-semibold text-foreground mt-4 mb-1.5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mt-3 mb-1">{children}</h3>,
                    p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    a: ({ href, children }) => <a href={href} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">{children}</a>,
                  }}
                >
                  {vehicle.description}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Right: contact form */}
        <div>
          <div className="sticky top-28 space-y-4">
            {showPrices && <div className="rounded-[28px] bg-[#1d1d1f] p-6 text-white"><p className="text-xs font-semibold uppercase tracking-[.14em] text-white/50">Valor anunciado</p><p className="mt-3 text-3xl font-semibold tracking-[-.05em]">{formatCurrency(vehicle.price)}</p><p className="mt-3 text-sm leading-6 text-white/55">Quer saber mais? Envie uma mensagem e um vendedor entrará em contato.</p></div>}
            <LeadForm slug={slug} vehicleId={vehicle.id} vehicleTitle={title} />
          </div>
        </div>
      </div>
    </div>
  )
}
