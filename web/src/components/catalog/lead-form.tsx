'use client'
import { useState } from 'react'
import { Send, CheckCircle2 } from 'lucide-react'
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
      <div className="rounded-[28px] border border-border bg-white p-8 text-center">
        <CheckCircle2 size={48} className="text-success mx-auto mb-3" />
        <h3 className="font-bold text-foreground text-lg">Mensagem enviada!</h3>
        <p className="text-muted-foreground text-sm mt-2">Entraremos em contato em breve.</p>
      </div>
    )
  }

  return (
    <div className="rounded-[28px] border border-border bg-white p-6 shadow-[0_14px_40px_rgba(20,20,25,.04)] sm:p-7">
      <p className="page-eyebrow mb-2">Vamos conversar?</p><h3 className="font-semibold tracking-tight text-foreground text-xl mb-2">Gostou deste veículo?</h3>
      <p className="text-sm leading-6 text-muted-foreground mb-6">Deixe seus dados e um vendedor vai entrar em contato.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" placeholder="Seu nome *" required value={form.name} onChange={set('name')}
          className="w-full h-11 px-4 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors" />
        <input type="tel" placeholder="WhatsApp / Telefone *" required value={form.phone} onChange={set('phone')}
          className="w-full h-11 px-4 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors" />
        <input type="email" placeholder="Email" value={form.email} onChange={set('email')}
          className="w-full h-11 px-4 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors" />
        <textarea placeholder="Mensagem (opcional)" value={form.message} onChange={set('message')} rows={3}
          className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none" />

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full h-11 bg-primary hover:bg-primary-dark text-white font-semibold rounded-full disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm">
          {loading ? 'Enviando...' : <><Send size={16} /> Enviar mensagem</>}
        </button>
      </form>

      <p className="mt-5 border-t border-border pt-4 text-center text-xs text-muted-foreground">Seu contato será usado para falar sobre {vehicleTitle}.</p>
    </div>
  )
}
