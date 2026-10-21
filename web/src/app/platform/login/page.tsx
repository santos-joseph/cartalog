'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react'
import { platformRequest, platformTokenKey } from '@/lib/platform-api'

export default function PlatformLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await platformRequest<{ accessToken: string }>('/auth/login', undefined, { method: 'POST', body: JSON.stringify({ email, password }) })
      sessionStorage.setItem(platformTokenKey, result.accessToken)
      router.replace('/platform')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.') }
    finally { setBusy(false) }
  }

  return <main className="min-h-screen bg-[#f5f5f4] flex items-center justify-center p-5 text-[#191919]">
    <div className="w-full max-w-[1040px] min-h-[620px] overflow-hidden rounded-[30px] bg-white border border-[#e8e8e8] shadow-2xl grid lg:grid-cols-[1fr_1.02fr]">
      <div className="bg-[#19191c] p-9 sm:p-14 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -right-28 top-16 h-80 w-80 rounded-full border-[55px] border-white/5" />
        <Image src="/brand/cartalog-logo-white.png" alt="Cartalog" width={200} height={67} className="relative h-12 w-auto object-contain object-left" />
        <div className="relative"><span className="text-[#ff5261] text-xs tracking-[0.22em] font-bold">ADMINISTRAÇÃO DA PLATAFORMA</span><h1 className="text-4xl sm:text-5xl leading-tight font-semibold mt-5">A operação inteira em um só lugar.</h1><p className="text-white/60 mt-6 max-w-sm leading-7">Gerencie as empresas, os planos e os acessos globais do Cartalog com segurança.</p></div>
        <div className="relative flex items-center gap-3 text-sm text-white/60"><ShieldCheck size={20} className="text-[#ff5261]" /> Acesso exclusivo à equipe Cartalog</div>
      </div>
      <div className="p-9 sm:p-14 flex flex-col justify-center"><div className="w-12 h-12 rounded-2xl bg-[#fff0f1] text-[#d90429] flex items-center justify-center mb-7"><LockKeyhole size={24} /></div><span className="text-xs font-bold tracking-[0.2em] text-[#d90429]">PAINEL GLOBAL</span><h2 className="text-3xl font-bold mt-3">Entrar com e-mail</h2><p className="text-[#747474] mt-2 mb-8">Use sua conta de administrador da plataforma.</p>
        <form onSubmit={submit} className="space-y-5"><label className="block text-sm font-semibold">E-mail<input autoComplete="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full h-12 rounded-xl border border-[#dedede] px-4 outline-none focus:border-[#d90429]" placeholder="voce@cartalog.com" /></label><label className="block text-sm font-semibold">Senha<input autoComplete="current-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full h-12 rounded-xl border border-[#dedede] px-4 outline-none focus:border-[#d90429]" placeholder="Sua senha" /></label>{error && <p role="alert" className="text-sm text-[#b70020] bg-[#fff0f1] rounded-xl p-3">{error}</p>}<button disabled={busy} className="w-full h-12 rounded-xl bg-[#d90429] hover:bg-[#ad0825] disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2">{busy ? 'Entrando...' : 'Entrar no painel'} <ArrowRight size={18} /></button></form>
        <Link href="/" className="text-sm text-[#777] mt-8 hover:text-[#d90429]">← Voltar ao site</Link>
      </div>
    </div>
  </main>
}
