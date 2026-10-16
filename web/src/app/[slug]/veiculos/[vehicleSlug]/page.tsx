import { notFound } from 'next/navigation'
import { getCatalogVehicle } from '@/services/catalog.service'
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
  const vehicle = await getCatalogVehicle(slug, vehicleSlug)
  if (!vehicle) notFound()

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
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors hover:no-underline">Início</Link>
        <span>/</span>
        <Link href="/veiculos" className="hover:text-foreground transition-colors hover:no-underline">Veículos</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: gallery + details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery */}
          <VehicleGallery images={vehicle.images ?? []} apiUrl={API_URL} title={title} />

          {/* Price + title */}
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">{vehicle.model.brand.name}</p>
            <h1 className="text-3xl font-bold text-foreground mt-1">{vehicle.model.name} {vehicle.year}</h1>
            <p className="text-4xl font-bold text-primary mt-3">{formatCurrency(vehicle.price)}</p>
          </div>

          {/* Specs grid */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4">Especificações</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
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
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-4">Opcionais</h2>
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
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-3">Descrição</h2>
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
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <LeadForm slug={slug} vehicleId={vehicle.id} vehicleTitle={title} />
          </div>
        </div>
      </div>
    </div>
  )
}
