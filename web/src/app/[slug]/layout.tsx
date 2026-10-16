import type { Metadata } from 'next'
import { getCatalog } from '@/services/catalog.service'
import { CatalogNav } from '@/components/catalog/nav'
import { CatalogFooter } from '@/components/catalog/footer'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = await getCatalog(slug)
  if (!data) return { title: 'Catálogo' }
  return {
    title: { default: data.company.name, template: `%s | ${data.company.name}` },
    description: data.company.seoSettings?.metaDescription ?? `Catálogo de veículos de ${data.company.name}`,
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
    <div className="min-h-screen bg-background flex flex-col">
      <CatalogNav company={data.company} />
      <main className="flex-1">{children}</main>
      <CatalogFooter company={data.company} />
    </div>
  )
}
