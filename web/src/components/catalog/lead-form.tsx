'use client'
import { useState } from 'react'
import { MessageCircle, Send, CheckCircle2 } from 'lucide-react'
import { submitLead } from '@/services/catalog.service'

export function LeadForm({ slug, vehicleId, vehicleTitle }: { slug: string; vehicleId: string; vehicleTitle: string }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  function set(f: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [f]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const r = await submitLead(slug, { ...form, vehicleId, source: 'catalog' })
      if (!r.ok) throw new Error()
      setSent(true)
    } catch {
      setError('Não foi possível enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 text-center">
        <CheckCircle2 size={48} className="text-success mx-auto mb-3" />
        <h3 className="font-bold text-foreground text-lg">Mensagem enviada!</h3>
        <p className="text-muted-foreground text-sm mt-2">Entraremos em contato em breve.</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-bold text-foreground text-lg mb-1">Tenho interesse</h3>
      <p className="text-sm text-muted-foreground mb-5">Deixe seus dados e entraremos em contato</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" placeholder="Seu nome *" required value={form.name} onChange={set('name')}
          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors" />
        <input type="tel" placeholder="WhatsApp / Telefone *" required value={form.phone} onChange={set('phone')}
          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors" />
        <input type="email" placeholder="Email" value={form.email} onChange={set('email')}
          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors" />
        <textarea placeholder="Mensagem (opcional)" value={form.message} onChange={set('message')} rows={3}
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none" />

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full h-11 bg-gradient-primary text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 text-sm">
          {loading ? 'Enviando...' : <><Send size={16} /> Enviar mensagem</>}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-border space-y-2">
        <p className="text-xs text-muted-foreground text-center">Ou fale direto conosco</p>
        <a href={`https://wa.me/?text=${encodeURIComponent(`Olá! Vi o ${vehicleTitle} no catálogo e tenho interesse.`)}`}
          target="_blank" rel="noopener noreferrer"
          className="w-full h-10 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 text-sm transition-colors hover:no-underline">
          <MessageCircle size={16} /> WhatsApp
        </a>
      </div>
    </div>
  )
}
