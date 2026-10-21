import { useState, type FormEvent } from 'react'
import { ArrowRight, Building2, Check, Eye, EyeOff, ShieldCheck, UsersRound } from 'lucide-react'
import logo from '../../assets/cartalog-logo.png'
import type { DesktopSession, LoginInput } from '../types'
import { Button, Field, errorText } from '../ui'

export function AuthPage({ apiOrigin, onAuth }: { apiOrigin: string; onAuth: (session: DesktopSession) => void }) {
  const [login, setLogin] = useState<LoginInput>({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await window.cartalog.login({ ...login, email: login.email.trim().toLowerCase() })
      onAuth(result)
    } catch (err) { setError(errorText(err)) }
    finally { setBusy(false) }
  }

  return <div className="auth-shell">
    <div className="auth-story">
      <div className="auth-brand"><img src={logo} alt="Cartalog" /><span>DESKTOP</span></div>
      <div className="auth-story-body"><span className="auth-pill"><Building2 size={16} /> CENTRAL DA SUA LOJA</span><h1>Sua operação começa por aqui<span>.</span></h1><p>Organize sua equipe e prepare o catálogo público em um só lugar.</p><div className="auth-steps"><div><span><Check size={18} /></span><div><strong>Identidade da loja</strong><small>Uma presença própria para seus veículos.</small></div></div><div><span><UsersRound size={18} /></span><div><strong>Equipe de vendas</strong><small>Cadastre quem vai atender os leads.</small></div></div><div><span><ShieldCheck size={18} /></span><div><strong>Controle do dono</strong><small>Regras e configurações sob sua gestão.</small></div></div></div></div>
      <footer>Cartalog © {new Date().getFullYear()} <span>Feito para quem vende carros.</span></footer>
    </div>
    <div className="auth-workspace"><div className="auth-form-wrap">
      <div className="auth-form-head"><span className="eyebrow">BEM-VINDO DE VOLTA</span><h2>Entre no Cartalog.</h2><p>Use seu e-mail e senha de dono da loja ou administrador da plataforma.</p></div>
      <form onSubmit={submit}>
        <div className="form-stack"><Field label="Seu e-mail" type="email" placeholder="voce@empresa.com" autoComplete="email" required value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} /><div className="password-field"><Field label="Senha" type={showPassword ? 'text' : 'password'} placeholder="Sua senha" autoComplete="current-password" required value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /><button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <Button type="submit" className="auth-submit" disabled={busy}>{busy ? 'Aguarde...' : 'Entrar no desktop'} <ArrowRight size={18} /></Button>
      </form><p className="auth-api">Conectado à API em {apiOrigin}</p>
    </div></div>
  </div>
}
