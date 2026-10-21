import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getCatalogPage } from '@/services/catalog.service'

type PageBlock =
  | { type: 'hero'; eyebrow: string; title: string; subtitle: string }
  | { type: 'text'; heading: string; body: string }
  | { type: 'image'; imageUrl: string; alt: string; caption: string }
  | { type: 'cta'; text: string; href: string; style: 'primary' | 'outline' }

type Props = { params: Promise<{ slug: string; pageSlug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, pageSlug } = await params
  const page = await getCatalogPage(slug, pageSlug)
  if (!page) return { title: 'Página não encontrada' }
  return { title: page.title, description: page.content?.slice(0, 160) || page.title }
}

export default async function CatalogContentPage({ params }: Props) {
  const { slug, pageSlug } = await params
  const page = await getCatalogPage(slug, pageSlug)
  if (!page) notFound()

  const blocks: PageBlock[] = Array.isArray(page.blocks) ? page.blocks : []
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'

  return <div className="mx-auto max-w-[1120px] px-6 pb-24 pt-12">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground"><Link href="/" className="inline-flex items-center gap-2 hover:text-primary"><ArrowLeft size={15} /> Voltar ao início</Link><span>{page.title}</span></div>
    {blocks.length ? <article className="space-y-7">
      {blocks.map((block, index) => {
        if (block.type === 'hero') return <section key={index} className="relative overflow-hidden rounded-[34px] bg-[#202024] px-7 py-16 text-white sm:px-12 sm:py-24"><div className="absolute -right-24 -top-40 h-[420px] w-[420px] rounded-full border-[55px] border-white/[.035]" /><div className="relative max-w-3xl">{block.eyebrow && <p className="mb-5 text-xs font-bold uppercase tracking-[.18em] text-white/55">{block.eyebrow}</p>}<h1 className="text-[clamp(2.5rem,5vw,5rem)] font-semibold leading-[1.05] tracking-[-.06em]">{block.title}</h1>{block.subtitle && <p className="mt-6 max-w-2xl whitespace-pre-line text-lg leading-8 text-white/65">{block.subtitle}</p>}</div></section>
        if (block.type === 'text') return <section key={index} className="rounded-[28px] border border-border bg-white px-7 py-10 sm:px-12 sm:py-14">{block.heading && <h2 className="mb-6 max-w-3xl text-3xl font-semibold tracking-[-.045em]">{block.heading}</h2>}<p className="max-w-3xl whitespace-pre-line text-base leading-8 text-muted-foreground">{block.body}</p></section>
        if (block.type === 'image') return /^\/uploads\/pages\/[a-zA-Z0-9._-]+$/.test(block.imageUrl) ? <figure key={index} className="overflow-hidden rounded-[28px] border border-border bg-white"><img src={`${apiOrigin}${block.imageUrl}`} alt={block.alt} className="block max-h-[650px] w-full object-cover" />{block.caption && <figcaption className="px-6 py-4 text-sm text-muted-foreground">{block.caption}</figcaption>}</figure> : null
        if (block.type === 'cta' && (/^\/(?!\/)/.test(block.href) || /^https:\/\//i.test(block.href))) return <section key={index} className="rounded-[28px] border border-border bg-white px-7 py-10 sm:px-12"><a href={block.href} {...(block.href.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold hover:no-underline ${block.style === 'outline' ? 'border border-primary text-primary hover:bg-accent' : 'bg-primary text-primary-foreground hover:bg-primary-dark'}`}>{block.text}<ArrowRight size={17} /></a></section>
        return null
      })}
    </article> : <article className="rounded-[28px] border border-border bg-white px-7 py-12 sm:px-12"><h1 className="text-4xl font-semibold tracking-[-.05em]">{page.title}</h1><p className="mt-8 whitespace-pre-line text-base leading-8 text-muted-foreground">{page.content}</p></article>}
  </div>
}
