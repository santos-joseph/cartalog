'use client'
import Link from 'next/link'
import { Phone, MessageCircle, Menu, X } from 'lucide-react'
import { useState } from 'react'

interface Company {
  id: string; name: string; slug: string; logoUrl?: string | null
  primaryColor?: string | null; phone?: string | null; whatsapp?: string | null
  siteSettings?: { showWhatsappButton?: boolean; showStoreNameWithLogo?: boolean } | null
  pages?: Array<{ id: string; title: string; slug: string }>
}

export function CatalogNav({ company }: { company: Company }) {
  const [open, setOpen] = useState(false)
  const logoUrl = company.logoUrl?.startsWith('/')
    ? `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'}${company.logoUrl}`
    : company.logoUrl

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <div className="max-w-[1200px] mx-auto rounded-full border border-border bg-white/90 px-4 sm:px-6 h-[76px] flex items-center justify-between gap-4 shadow-[0_8px_30px_rgba(20,20,25,.06)] backdrop-blur-xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 hover:no-underline flex-shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={company.name} className="h-12 sm:h-14 w-auto max-w-40 sm:max-w-56 object-contain" />
          ) : (
            <img src="/brand/cartalog-mark.png" alt="" className="h-9 w-9 object-contain" />
          )}
          {(!logoUrl || company.siteSettings?.showStoreNameWithLogo !== false) && <span className="font-semibold tracking-tight text-foreground text-base sm:text-lg max-w-32 sm:max-w-52 truncate">{company.name}</span>}
        </Link>

        {/* Nav links desktop */}
        <nav className="hidden md:flex items-center gap-1 rounded-full bg-muted p-1">
          <Link href="/" className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-white hover:text-foreground transition-colors hover:no-underline">Início</Link>
          <Link href="/veiculos" className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-white hover:text-foreground transition-colors hover:no-underline">Veículos</Link>
          {company.pages?.slice(0, 3).map((page) => <Link key={page.id} href={`/paginas/${page.slug}`} className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-white hover:text-foreground transition-colors hover:no-underline">{page.title}</Link>)}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {company.phone && (
            <a href={`tel:${company.phone}`} className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:no-underline">
              <Phone size={15} /> {company.phone}
            </a>
          )}
          {company.whatsapp && company.siteSettings?.showWhatsappButton !== false && (
            <a
              href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-primary-foreground text-sm font-medium px-4 py-2 rounded-full transition-colors hover:no-underline"
            >
              <MessageCircle size={15} />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
          <button aria-label={open ? 'Fechar menu' : 'Abrir menu'} className="md:hidden p-2 rounded-full hover:bg-muted transition-colors" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden absolute left-4 right-4 top-[91px] rounded-2xl border border-border bg-white px-4 py-3 space-y-1 shadow-lg">
          <Link href="/" onClick={() => setOpen(false)} className="block py-2 text-sm text-foreground hover:no-underline">Início</Link>
          <Link href="/veiculos" onClick={() => setOpen(false)} className="block py-2 text-sm text-foreground hover:no-underline">Veículos</Link>
          {company.pages?.map((page) => <Link key={page.id} href={`/paginas/${page.slug}`} onClick={() => setOpen(false)} className="block py-2 text-sm text-foreground hover:no-underline">{page.title}</Link>)}
          {company.phone && (
            <a href={`tel:${company.phone}`} className="block py-2 text-sm text-muted-foreground hover:no-underline">{company.phone}</a>
          )}
        </div>
      )}
    </header>
  )
}
