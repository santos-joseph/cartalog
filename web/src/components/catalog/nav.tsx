'use client'
import Link from 'next/link'
import { Phone, MessageCircle, Menu, X } from 'lucide-react'
import { useState } from 'react'

interface Company {
  id: string; name: string; slug: string; logoUrl?: string | null
  primaryColor?: string | null; phone?: string | null; whatsapp?: string | null
}

export function CatalogNav({ company }: { company: Company }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 hover:no-underline flex-shrink-0">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="h-9 w-auto object-contain" />
          ) : (
            <img src="/brand/cartalog-mark.png" alt="" className="h-9 w-9 object-contain" />
          )}
          <span className="font-bold text-foreground text-lg hidden sm:block">{company.name}</span>
        </Link>

        {/* Nav links desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:no-underline">Início</Link>
          <Link href="/veiculos" className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:no-underline">Veículos</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {company.phone && (
            <a href={`tel:${company.phone}`} className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:no-underline">
              <Phone size={15} /> {company.phone}
            </a>
          )}
          {company.whatsapp && (
            <a
              href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors hover:no-underline"
            >
              <MessageCircle size={15} />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
          <button className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-white px-4 py-3 space-y-1">
          <Link href="/" onClick={() => setOpen(false)} className="block py-2 text-sm text-foreground hover:no-underline">Início</Link>
          <Link href="/veiculos" onClick={() => setOpen(false)} className="block py-2 text-sm text-foreground hover:no-underline">Veículos</Link>
          {company.phone && (
            <a href={`tel:${company.phone}`} className="block py-2 text-sm text-muted-foreground hover:no-underline">{company.phone}</a>
          )}
        </div>
      )}
    </header>
  )
}
