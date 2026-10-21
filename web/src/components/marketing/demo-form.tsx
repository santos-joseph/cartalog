'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, CircleCheck } from 'lucide-react'

export function DemoForm() {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = event.currentTarget
    const data = new FormData(form)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'}/api/v1/demo-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'), email: data.get('email'), phone: data.get('phone'),
          companyName: data.get('companyName'), message: data.get('message'), website: data.get('website'),
        }),
      })
      if (!response.ok) throw new Error(response.status === 429 ? 'Muitas solicitações. Tente novamente em alguns minutos.' : 'Não foi possível enviar agora. Tente novamente.')
      form.reset()
      setDone(true)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível enviar agora.') }
    finally { setBusy(false) }
  }

  if (done) return <div className="mk-form mk-form-success" role="status"><CircleCheck size={42} /><h3>Pedido recebido!</h3><p>Recebemos seus dados. Nossa equipe entrará em contato pelo e-mail ou telefone informado.</p><button type="button" onClick={() => setDone(false)}>Enviar outro pedido</button></div>

  return <form className="mk-form" onSubmit={submit}><div className="mk-form-head"><span>DEMONSTRAÇÃO</span><h3>Vamos conhecer sua loja?</h3><p>Preencha os dados abaixo para solicitar uma conversa.</p></div><div className="mk-form-grid"><label>Seu nome<input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Seu nome completo" /></label><label>Nome da loja<input name="companyName" required minLength={2} maxLength={100} autoComplete="organization" placeholder="Ex.: Minha Motors" /></label></div><div className="mk-form-grid"><label>E-mail<input name="email" required type="email" maxLength={255} autoComplete="email" placeholder="voce@loja.com" /></label><label>Telefone / WhatsApp<input name="phone" required type="tel" minLength={8} maxLength={30} autoComplete="tel" placeholder="(11) 99999-9999" /></label></div><label>O que você procura? <span>(opcional)</span><textarea name="message" maxLength={2000} rows={3} placeholder="Conte um pouco sobre a sua operação" /></label><div className="mk-honeypot" aria-hidden="true"><label>Site<input name="website" tabIndex={-1} autoComplete="off" /></label></div>{error && <p className="mk-form-error" role="alert">{error}</p>}<button className="mk-button" type="submit" disabled={busy}>{busy ? 'Enviando...' : 'Solicitar demonstração'} <ArrowRight size={18} /></button><small>Usaremos seus dados somente para responder ao seu pedido de demonstração.</small></form>
}
