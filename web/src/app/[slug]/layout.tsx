import type { Metadata } from 'next'
import Image from 'next/image'
import { getCatalog, getCatalogStatus } from '@/services/catalog.service'
import { CatalogNav } from '@/components/catalog/nav'
import { CatalogFooter } from '@/components/catalog/footer'
import { catalogTheme } from '@/lib/catalog-theme'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const status = await getCatalogStatus(slug)
  if (status?.maintenanceEnabled) return { title: `${status.name} | Em manutenção`, robots: { index: false, follow: false } }
  const data = await getCatalog(slug)
  if (!data) return { title: 'Catálogo' }
  const siteTitle = data.company.seoSettings?.metaTitle?.trim() || data.company.name
  return {
    title: { default: siteTitle, template: `%s | ${siteTitle}` },
    description: data.company.seoSettings?.metaDescription ?? `Catálogo de veículos de ${data.company.name}`,
    keywords: data.company.seoSettings?.metaKeywords || undefined,
  }
}

export default async function CatalogLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const status = await getCatalogStatus(slug)
  if (status?.maintenanceEnabled) {
    const logoUrl = status.logoUrl?.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'}${status.logoUrl}` : status.logoUrl
    return <main className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-6 text-[#222]">
      <div className="max-w-xl rounded-3xl bg-white p-10 shadow-xl border border-neutral-200 text-center">
        {logoUrl ? <Image unoptimized src={logoUrl} alt={status.name} width={240} height={80} className="mx-auto mb-7 max-h-20 max-w-60 object-contain" /> : <div className="text-xl font-bold mb-7">{status.name}</div>}
        <span className="text-xs font-bold tracking-[0.22em] text-red-600">VOLTE EM BREVE</span>
        <h1 className="text-4xl font-bold mt-4 mb-4">Estamos preparando tudo por aqui.</h1>
        <p className="text-neutral-600 leading-7">{status.maintenanceMessage || 'Nosso site está temporariamente em manutenção. Em breve, você poderá conferir nossos veículos novamente.'}</p>
      </div>
    </main>
  }
  const data = await getCatalog(slug)

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Loja não encontrada</h1>
          <p className="text-muted-foreground mt-2">Este catálogo não existe ou foi desativado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="catalog-theme min-h-screen bg-background flex flex-col" style={catalogTheme(data.company.primaryColor, data.company.secondaryColor, data.company.siteSettings)}>
      <CatalogNav company={data.company} />
      <main className="flex-1">{children}</main>
      <CatalogFooter company={data.company} />
    </div>
  )
}
