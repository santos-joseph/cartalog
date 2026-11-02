import Link from 'next/link'
import { ArrowUpRight, Mail, MapPin, MessageCircleMore, Phone } from 'lucide-react'

interface Company {
  name: string; slug: string; phone?: string | null; whatsapp?: string | null
  email?: string | null
  logoUrl?: string | null
  siteSettings?: { showWhatsappButton?: boolean; showStoreNameWithLogo?: boolean } | null
  companyLocations?: Array<{ city?: string | null; state?: string | null; address?: string | null }>
  pages?: Array<{ id: string; title: string; slug: string }>
}

export function CatalogFooter({ company }: { company: Company }) {
  const location = company.companyLocations?.[0]
  const logoUrl = company.logoUrl?.startsWith('/')
    ? `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'}${company.logoUrl}`
    : company.logoUrl
  return <footer className="mt-20 border-t border-border bg-[#f5f5f7]"><div className="mx-auto max-w-[1200px] px-6 pb-8 pt-16"><div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]"><div><div className="flex items-center gap-3"><img src={logoUrl || '/brand/cartalog-mark.png'} alt={logoUrl ? company.name : ''} className={logoUrl ? 'h-14 w-auto max-w-56 object-contain' : 'h-10 w-10 rounded-xl object-contain'} />{(!logoUrl || company.siteSettings?.showStoreNameWithLogo !== false) && <span className="text-lg font-semibold tracking-tight">{company.name}</span>}</div><p className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground">O carro para o seu próximo capítulo pode estar aqui. Explore o estoque e converse com a loja.</p></div><div><h2 className="mb-4 text-sm font-semibold">Explore</h2><div className="space-y-3 text-sm text-muted-foreground"><Link href="/" className="block hover:text-primary">Início</Link><Link href="/veiculos" className="block hover:text-primary">Veículos disponíveis</Link>{company.pages?.map((page) => <Link key={page.id} href={`/paginas/${page.slug}`} className="block hover:text-primary">{page.title}</Link>)}</div></div><div><h2 className="mb-4 text-sm font-semibold">Contato</h2><div className="space-y-3 text-sm text-muted-foreground">{company.phone && <a href={`tel:${company.phone}`} className="flex items-center gap-2 hover:text-primary"><Phone size={15} />{company.phone}</a>}{company.whatsapp && company.siteSettings?.showWhatsappButton !== false && <a href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary"><MessageCircleMore size={15} />WhatsApp <ArrowUpRight size={13} /></a>}{company.email && <a href={`mailto:${company.email}`} className="flex items-center gap-2 hover:text-primary"><Mail size={15} />{company.email}</a>}{location && <div className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0" /><span>{[location.address, location.city, location.state].filter(Boolean).join(', ')}</span></div>}</div></div></div><div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground"><span>© {new Date().getFullYear()} {company.name}</span><span className="inline-flex items-center gap-2">Feito com <img src="/brand/cartalog-logo.png" alt="Cartalog" className="h-5 w-auto" /></span></div></div></footer>
}
