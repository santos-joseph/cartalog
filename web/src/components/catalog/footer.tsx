import { Phone, MessageCircle, MapPin } from 'lucide-react'

interface Company {
  name: string; slug: string; phone?: string | null; whatsapp?: string | null
  email?: string | null
  companyLocations?: Array<{ city?: string | null; state?: string | null; address?: string | null }>
}

export function CatalogFooter({ company }: { company: Company }) {
  const location = company.companyLocations?.[0]
  return (
    <footer className="bg-foreground text-white/70 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/brand/cartalog-mark.png" alt="" className="h-8 w-8 object-contain" />
              <span className="font-bold text-white">{company.name}</span>
            </div>
            <p className="text-sm text-white/50">Encontre o veículo ideal para você.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Contato</h4>
            <div className="space-y-2">
              {company.phone && (
                <a href={`tel:${company.phone}`} className="flex items-center gap-2 text-sm hover:text-white transition-colors hover:no-underline">
                  <Phone size={14} />{company.phone}
                </a>
              )}
              {company.whatsapp && (
                <a href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-white transition-colors hover:no-underline">
                  <MessageCircle size={14} />WhatsApp
                </a>
              )}
            </div>
          </div>
          {location && (
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Localização</h4>
              <div className="flex items-start gap-2 text-sm">
                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                <span>{[location.address, location.city, location.state].filter(Boolean).join(', ')}</span>
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 text-xs text-white/30 flex items-center justify-between">
          <span>© {new Date().getFullYear()} {company.name}</span>
          <span className="inline-flex items-center gap-2">
            Powered by
            <img src="/brand/cartalog-logo-white.png" alt="Cartalog" className="h-5 w-auto object-contain opacity-70" />
          </span>
        </div>
      </div>
    </footer>
  )
}
