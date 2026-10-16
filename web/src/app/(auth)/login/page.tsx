'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Car, BarChart3, Palette, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Tab = 'login' | 'register'

// ── Side panel (stays fixed) ────────────────────────────────────────────────
const features = [
  { icon: Car, title: 'Catálogo digital', description: 'Seu estoque online com site próprio' },
  { icon: BarChart3, title: 'Leads e CRM', description: 'Gerencie contatos em tempo real' },
  { icon: Palette, title: 'Personalizável', description: 'Cores, logo e configurações da loja' },
]

function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-[44%] bg-gradient-primary flex-col justify-between p-12 relative overflow-hidden flex-shrink-0">
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
      <div className="absolute -bottom-24 -left-12 w-72 h-72 rounded-full bg-white/5" />

      <div className="relative">
        <Link href="/" className="flex items-center gap-3 mb-1 hover:no-underline">
          <img src="/brand/cartalog-logo-white.png" alt="Cartalog" className="h-14 w-auto object-contain" />
        </Link>
        <p className="text-white/65 text-sm mt-2">Gerenciador de catálogo de veículos</p>
      </div>

      <div className="relative space-y-7">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Icon className="text-white" size={18} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{title}</h3>
              <p className="text-white/60 text-xs mt-0.5">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="relative text-white/40 text-xs">© 2025 Cartalog. Todos os direitos reservados.</p>
    </div>
  )
}

// ── Tab toggle ───────────────────────────────────────────────────────────────
function TabToggle({ tab, onTabChange }: { tab: Tab; onTabChange: (t: Tab) => void }) {
  return (
    <div className="flex bg-muted rounded-xl p-1 mb-8">
      {(['login', 'register'] as Tab[]).map((t) => (
        <button
          key={t}
          onClick={() => onTabChange(t)}
          className={cn(
            'flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200',
            tab === t
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      ))}
    </div>
  )
}

// ── Login form ───────────────────────────────────────────────────────────────
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ companySlug: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(f: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [f]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authService.login(form)
      setAuth(data)
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Slug da Empresa"
        type="text"
        placeholder="ex: demo-motors"
        value={form.companySlug}
        onChange={set('companySlug')}
        helper="Encontrado na URL do seu catálogo"
        required
      />
      <Input
        label="Email"
        type="email"
        placeholder="seu@email.com"
        value={form.email}
        onChange={set('email')}
        required
      />
      <Input
        label="Senha"
        type="password"
        placeholder="••••••••"
        value={form.password}
        onChange={set('password')}
        required
      />

      {error && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-primary text-white font-semibold h-11 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity text-sm mt-1"
      >
        {loading ? <Loader2 size={17} className="animate-spin" /> : (
          <>Entrar <ArrowRight size={16} /></>
        )}
      </button>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-3 font-medium">Credenciais de teste</p>
        <div className="bg-accent rounded-xl p-3 space-y-1.5">
          {[
            { label: 'Slug', value: 'staging' },
            { label: 'Email', value: 'teste@tst.com' },
            { label: 'Senha', value: 'Joseph@2' },
          ].map(({ label, value }) => (
            <p key={label} className="text-xs text-foreground">
              <span className="text-muted-foreground">{label}:</span>{' '}
              <code className="bg-white px-1.5 py-0.5 rounded text-primary font-mono text-xs">{value}</code>
            </p>
          ))}
        </div>
      </div>
    </form>
  )
}

// ── Register form ────────────────────────────────────────────────────────────
function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({
    companyName: '', companyEmail: '', companyPhone: '',
    userName: '', userEmail: '', password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(f: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [f]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authService.register(form)
      setAuth(data)
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Dados da empresa</p>

      <Input label="Nome da empresa" placeholder="Ex: Auto Silva Motors" value={form.companyName} onChange={set('companyName')} required />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Email da empresa" type="email" placeholder="contato@empresa.com" value={form.companyEmail} onChange={set('companyEmail')} required />
        <Input label="Telefone" type="tel" placeholder="(11) 99999-9999" value={form.companyPhone} onChange={set('companyPhone')} />
      </div>

      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest pt-1">Seu acesso</p>

      <Input label="Seu nome" placeholder="João Silva" value={form.userName} onChange={set('userName')} required />
      <Input label="Seu email" type="email" placeholder="joao@empresa.com" value={form.userEmail} onChange={set('userEmail')} required />
      <Input
        label="Senha"
        type="password"
        placeholder="Min. 8 caracteres"
        value={form.password}
        onChange={set('password')}
        helper="Mínimo 8 caracteres, 1 maiúscula e 1 número"
        required
      />

      {error && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-primary text-white font-semibold h-11 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity text-sm mt-1"
      >
        {loading ? <Loader2 size={17} className="animate-spin" /> : (
          <>Criar conta grátis <ArrowRight size={16} /></>
        )}
      </button>
    </form>
  )
}

// ── PAGE ─────────────────────────────────────────────────────────────────────
function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>('login')
  const [animating, setAnimating] = useState(false)
  const [displayTab, setDisplayTab] = useState<Tab>('login')

  // Read ?tab=register from URL
  useEffect(() => {
    if (searchParams.get('tab') === 'register') {
      setTab('register')
      setDisplayTab('register')
    }
  }, [searchParams])

  function switchTab(next: Tab) {
    if (next === tab || animating) return
    setAnimating(true)
    setTab(next)
    // Wait for exit animation, then swap content
    setTimeout(() => {
      setDisplayTab(next)
      setAnimating(false)
    }, 180)
  }

  function onSuccess() {
    router.push('/dashboard')
  }

  const headings = {
    login: { title: 'Bem-vindo de volta', sub: 'Entre na sua conta para acessar o painel' },
    register: { title: 'Crie sua conta', sub: 'Configure sua loja de veículos em minutos' },
  }

  return (
    <div className="min-h-screen flex bg-white">
      <BrandPanel />

      {/* Right — forms */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white min-h-screen overflow-y-auto">
        <div className="w-full max-w-sm py-8">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden hover:no-underline">
            <img src="/brand/cartalog-logo.png" alt="Cartalog" className="h-10 w-auto object-contain" />
          </Link>

          {/* Tab toggle */}
          <TabToggle tab={tab} onTabChange={switchTab} />

          {/* Animated form container */}
          <div className="relative overflow-hidden">
            <div
              className="transition-all duration-200 ease-in-out"
              style={{
                opacity: animating ? 0 : 1,
                transform: animating
                  ? `translateY(${tab === 'register' ? '-8px' : '8px'})`
                  : 'translateY(0)',
              }}
            >
              {/* Heading */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">{headings[displayTab].title}</h2>
                <p className="text-muted-foreground text-sm mt-1">{headings[displayTab].sub}</p>
              </div>

              {/* Form */}
              {displayTab === 'login' ? (
                <LoginForm onSuccess={onSuccess} />
              ) : (
                <RegisterForm onSuccess={onSuccess} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  )
}
