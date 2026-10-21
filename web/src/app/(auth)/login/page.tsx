'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, CarFront, Check, Loader2, MessageCircleMore } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ companySlug: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authService.login(form)
      qc.clear()
      setAuth(data)
      router.replace(data.user.role === 'SELLER' ? '/dashboard/leads' : '/dashboard')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(message ?? 'Não foi possível entrar. Confira os dados informados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_20%_0%,#fff0f1,#fbfbfd_50%)] px-4 py-5 sm:px-7">
      <header className="mx-auto flex max-w-[1180px] items-center justify-between rounded-full border border-border bg-white/85 px-5 py-3 shadow-sm backdrop-blur-xl"><Link href="/"><img src="/brand/cartalog-logo.png" alt="Cartalog" className="h-9 w-auto" /></Link><span className="text-xs font-medium text-muted-foreground">Acesso à loja</span></header>
      <div className="mx-auto grid max-w-[1180px] gap-8 py-10 lg:min-h-[calc(100vh-130px)] lg:grid-cols-[1fr_460px] lg:items-center lg:gap-16">
        <div className="relative hidden lg:block"><span className="inline-flex rounded-full border border-primary/10 bg-white px-4 py-2 text-xs font-semibold text-primary">Sua operação, mais simples</span><h1 className="mt-8 max-w-xl text-[clamp(3.5rem,5.2vw,5.8rem)] font-semibold leading-[1.04] tracking-[-.065em]">Mais clareza para <span className="text-primary">vender melhor.</span></h1><p className="mt-6 max-w-md text-lg leading-7 text-muted-foreground">Do primeiro interesse à próxima venda, tudo fica no mesmo lugar.</p><div className="mt-12 grid max-w-lg grid-cols-2 gap-4"><div className="rounded-[26px] border border-border bg-white p-6 shadow-sm"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-primary"><CarFront size={22} /></span><h2 className="mt-7 text-lg font-semibold">Estoque organizado</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Carros, imagens e detalhes prontos para mostrar.</p></div><div className="rounded-[26px] bg-[#1d1d1f] p-6 text-white"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><MessageCircleMore size={22} /></span><h2 className="mt-7 text-lg font-semibold">Leads em movimento</h2><p className="mt-2 text-sm leading-6 text-white/60">Cada conversa com responsável e próximo passo.</p></div></div></div>
        <div className="rounded-[32px] border border-border bg-white p-6 shadow-[0_24px_80px_rgba(20,20,25,.07)] sm:p-10">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white"><img src="/brand/cartalog-mark.png" alt="" className="h-12 w-12 rounded-2xl" /></span>
        <p className="page-eyebrow mb-3 mt-8">Bem-vindo de volta</p>
        <h2 className="text-[2.2rem] leading-tight font-semibold tracking-[-.045em] text-foreground">Entre na sua loja.</h2>
        <p className="text-sm text-muted-foreground mt-3 mb-8">Acesse seus veículos e continue cada conversa.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Slug da empresa" value={form.companySlug} onChange={(e) => setForm((f) => ({ ...f, companySlug: e.target.value }))} placeholder="ex: demo-motors" required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <Input label="Senha" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
          {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark transition-colors text-white font-semibold h-12 rounded-full disabled:opacity-50 mt-2">
            {loading ? <Loader2 size={17} className="animate-spin" /> : <>Entrar <ArrowRight size={16} /></>}
          </button>
        </form>
        <div className="mt-7 flex items-start gap-2 rounded-2xl bg-[#f7f7f9] p-4"><Check size={16} className="mt-0.5 shrink-0 text-primary" /><p className="text-xs leading-relaxed text-muted-foreground">O cadastro da empresa e dos vendedores é feito pelo aplicativo desktop.</p></div>
        </div>
      </div>
      <p className="mx-auto max-w-[1180px] pb-4 text-xs text-muted-foreground">© {new Date().getFullYear()} Cartalog</p>
    </main>
  )
}
