import Link from 'next/link'
import {
  Car, BarChart3, MessageSquare, Zap, Globe, Shield,
  ArrowRight, CheckCircle2, Star, Search, Gauge, Fuel,
  Phone, MessageCircle, ChevronRight,
} from 'lucide-react'

// ── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 hover:no-underline">
          <img src="/brand/cartalog-logo.png" alt="Cartalog" className="h-9 w-auto object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:no-underline">Recursos</a>
          <a href="#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:no-underline">Como funciona</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:no-underline">Planos</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors hover:no-underline">
            Entrar
          </Link>
          <Link
            href="/login?tab=register"
            className="inline-flex items-center gap-1.5 bg-gradient-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity hover:no-underline"
          >
            Começar grátis
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  )
}

// ── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-primary opacity-5 rounded-full blur-3xl" />
      </div>

      <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/15 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
        <Star size={12} className="fill-current" />
        A plataforma dos vendedores de veículos
      </div>

      <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6 max-w-3xl mx-auto">
        Seu site de veículos{' '}
        <span className="bg-gradient-primary bg-clip-text text-transparent">
          pronto em minutos
        </span>
      </h1>

      <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
        Crie o catálogo digital da sua loja, receba leads pelo site e gerencie tudo no painel — como um WordPress feito para veículos.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
        <Link
          href="/login?tab=register"
          className="inline-flex items-center justify-center gap-2 bg-gradient-primary text-white font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition-opacity text-base hover:no-underline shadow-lg shadow-primary/20"
        >
          Criar conta grátis
          <ArrowRight size={18} />
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 border border-border text-foreground font-semibold px-7 py-3.5 rounded-xl hover:bg-muted transition-colors text-base hover:no-underline"
        >
          Já tenho conta
        </Link>
      </div>

      {/* Dashboard mockup */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-border shadow-2xl overflow-hidden">
          <div className="bg-muted px-4 py-3 flex items-center gap-2 border-b border-border">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-background rounded-md mx-4 px-3 py-1 text-xs text-muted-foreground border border-border">
              app.cartalog.com/dashboard
            </div>
          </div>

          {/* Fake dashboard layout */}
          <div className="flex h-64">
            {/* Sidebar */}
            <div className="w-48 border-r border-border bg-card p-3 flex flex-col gap-1 flex-shrink-0">
              <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                <div className="w-6 h-6 rounded bg-gradient-primary" />
                <div className="h-2.5 bg-muted rounded flex-1" />
              </div>
              {['Dashboard', 'Veículos', 'Leads / CRM', 'Catálogo'].map((item, i) => (
                <div
                  key={item}
                  className={`px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 ${i === 1 ? 'bg-gradient-primary text-white' : 'text-muted-foreground'}`}
                >
                  <div className={`w-3 h-3 rounded-sm ${i === 1 ? 'bg-white/30' : 'bg-muted'}`} />
                  {item}
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-5 overflow-hidden">
              <div className="h-5 bg-muted rounded w-32 mb-4" />
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Veículos', value: '48', color: 'text-primary', bg: 'bg-primary/8' },
                  { label: 'Leads', value: '23', color: 'text-success', bg: 'bg-success/10' },
                  { label: 'Negociação', value: '7', color: 'text-warning-foreground', bg: 'bg-warning/15' },
                  { label: 'Vendidos', value: '12', color: 'text-muted-foreground', bg: 'bg-muted' },
                ].map((k) => (
                  <div key={k.label} className="rounded-xl border border-border p-3">
                    <p className="text-[10px] text-muted-foreground">{k.label}</p>
                    <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-border overflow-hidden">
                    <div className="h-16 bg-gradient-primary opacity-20" />
                    <div className="p-2 space-y-1">
                      <div className="h-2 bg-muted rounded w-3/4" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── SOCIAL PROOF ─────────────────────────────────────────────────────────────
function SocialProof() {
  const stats = [
    { value: '2.400+', label: 'veículos catalogados' },
    { value: '180+', label: 'lojas ativas' },
    { value: '8.900+', label: 'leads gerados' },
    { value: '< 5 min', label: 'para estar no ar' },
  ]

  return (
    <div className="bg-muted/40 border-y border-border py-10 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map(({ value, label }) => (
          <div key={label} className="text-center">
            <p className="text-3xl font-bold text-primary">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── FEATURES ────────────────────────────────────────────────────────────────
const features = [
  {
    icon: Globe,
    title: 'Site no seu subdomínio',
    desc: 'Cada loja recebe seu endereço: carstore.cartalog.com. Sem configuração técnica.',
  },
  {
    icon: Car,
    title: 'Catálogo digital completo',
    desc: 'Fotos, preço, ano, km, combustível, opcionais. Filtros e busca para o cliente.',
  },
  {
    icon: MessageSquare,
    title: 'CRM de leads integrado',
    desc: 'Clientes entram em contato pelo site, leads chegam no painel com funil completo.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard com métricas',
    desc: 'Veja veículos mais vistos, leads do mês e como está seu funil de vendas.',
  },
  {
    icon: Zap,
    title: 'Configuração em minutos',
    desc: 'Crie a conta, cadastre os veículos e pronto — o site já está no ar.',
  },
  {
    icon: Shield,
    title: 'Multi-usuário e seguro',
    desc: 'Adicione equipe com permissões (Admin, Gerente, Vendedor). Dados protegidos.',
  },
]

function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Recursos</p>
          <h2 className="text-4xl font-bold text-foreground mb-4">Tudo que sua loja precisa</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Uma plataforma completa para digitalizar sua loja de veículos e vender mais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card rounded-2xl border border-border p-6 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
                <Icon className="text-white" size={20} />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── HOW IT WORKS ─────────────────────────────────────────────────────────────
const steps = [
  { n: '01', title: 'Crie sua conta', desc: 'Cadastre sua empresa em menos de 2 minutos. Sem cartão de crédito.' },
  { n: '02', title: 'Cadastre seus veículos', desc: 'Adicione fotos, preços e detalhes de cada veículo do seu estoque.' },
  { n: '03', title: 'Compartilhe seu catálogo', desc: 'Seu site já está no ar em carstore.cartalog.com. Compartilhe com clientes.' },
  { n: '04', title: 'Receba leads e venda mais', desc: 'Clientes entram em contato diretamente pelo catálogo. Você acompanha tudo no painel.' },
]

function HowItWorks() {
  return (
    <section id="how" className="py-24 px-6 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Simples assim</p>
          <h2 className="text-4xl font-bold text-foreground mb-4">Como funciona</h2>
          <p className="text-muted-foreground">Do cadastro ao primeiro lead em menos de 10 minutos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map(({ n, title, desc }) => (
            <div key={n} className="flex gap-5 items-start bg-card rounded-2xl border border-border p-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                <span className="text-white font-bold">{n}</span>
              </div>
              <div className="pt-0.5">
                <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CATALOG PREVIEW ──────────────────────────────────────────────────────────
function CatalogPreview() {
  return (
    <section className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Site público</p>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            O catálogo que seus clientes veem
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Cada loja recebe um site profissional, responsivo e otimizado para conversão — sem precisar de developer.
          </p>
        </div>

        {/* Catalog mockup */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-border shadow-xl overflow-hidden">
            <div className="bg-muted px-4 py-3 flex items-center gap-2 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-background rounded-md mx-4 px-3 py-1 text-xs text-muted-foreground border border-border">
                carstore.cartalog.com/veiculos
              </div>
            </div>

            {/* Catalog nav */}
            <div className="bg-gradient-primary px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-white/20" />
                <span className="text-white font-bold text-sm">CarStore</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-white/80 text-xs">
                  <Phone size={11} />
                  <span>(11) 9999-9999</span>
                </div>
                <div className="bg-white/20 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                  <MessageCircle size={11} />
                  WhatsApp
                </div>
              </div>
            </div>

            {/* Filter bar */}
            <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-muted/20">
              <div className="flex-1 flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5">
                <Search size={13} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Buscar veículos...</span>
              </div>
              <div className="flex gap-2">
                {['Marca', 'Combustível', 'Preço'].map((f) => (
                  <div key={f} className="flex items-center gap-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground">
                    {f} <ChevronRight size={11} className="rotate-90" />
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle grid */}
            <div className="p-6 grid grid-cols-3 gap-4">
              {[
                { brand: 'Toyota', model: 'Corolla', year: '2023', price: 'R$ 135.000', km: '12.000 km', fuel: 'Flex' },
                { brand: 'Volkswagen', model: 'T-Cross', year: '2022', price: 'R$ 119.990', km: '28.500 km', fuel: 'Flex' },
                { brand: 'Honda', model: 'Civic', year: '2021', price: 'R$ 99.900', km: '45.000 km', fuel: 'Flex' },
              ].map((v) => (
                <div key={v.model} className="rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-[4/3] bg-gradient-primary opacity-30 relative">
                    <div className="absolute bottom-2 left-2 bg-white/95 rounded-md px-2 py-0.5">
                      <span className="text-[10px] font-bold text-foreground">{v.price}</span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[10px] font-semibold text-primary uppercase">{v.brand}</p>
                    <p className="text-xs font-bold text-foreground">{v.model} <span className="font-normal text-muted-foreground">{v.year}</span></p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Gauge size={10} />{v.km}</span>
                      <span className="flex items-center gap-0.5"><Fuel size={10} />{v.fuel}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-8 flex flex-wrap justify-center gap-6">
          {['Site responsivo para celular', 'Filtros de busca avançados', 'Formulário de contato integrado', 'Otimizado para SEO'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── PRICING ──────────────────────────────────────────────────────────────────
const plans = [
  {
    name: 'Starter',
    price: 'Grátis',
    period: 'para sempre',
    description: 'Para começar a digitalizar sua loja.',
    features: [
      'Até 20 veículos',
      'Site no subdomínio Cartalog',
      'Leads ilimitados',
      'Dashboard básico',
      '1 usuário',
    ],
    cta: 'Criar conta grátis',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 'R$ 97',
    period: 'por mês',
    description: 'Para lojas que querem crescer.',
    features: [
      'Veículos ilimitados',
      'Domínio próprio',
      'Banners e páginas personalizadas',
      'CRM avançado com equipe',
      'Relatórios e métricas',
      'Suporte prioritário',
    ],
    cta: 'Começar 14 dias grátis',
    highlighted: true,
  },
  {
    name: 'Business',
    price: 'R$ 247',
    period: 'por mês',
    description: 'Para grupos e redes de lojas.',
    features: [
      'Múltiplas lojas',
      'Multi-tenant avançado',
      'API de integração',
      'Relatórios consolidados',
      'Usuários ilimitados',
      'Onboarding dedicado',
    ],
    cta: 'Falar com vendas',
    highlighted: false,
  },
]

function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Planos</p>
          <h2 className="text-4xl font-bold text-foreground mb-4">Preço simples e transparente</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Comece gratuitamente e escale conforme sua loja cresce.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.highlighted
                  ? 'bg-gradient-primary border-primary/30 shadow-xl shadow-primary/20'
                  : 'bg-card border-border'
              }`}
            >
              {plan.highlighted && (
                <div className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-full mb-4 w-fit">
                  <Star size={10} className="fill-current" />
                  Mais popular
                </div>
              )}
              <h3 className={`font-bold text-lg ${plan.highlighted ? 'text-white' : 'text-foreground'}`}>
                {plan.name}
              </h3>
              <div className="mt-3 mb-1">
                <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-foreground'}`}>
                  {plan.price}
                </span>
                {plan.period !== 'para sempre' && (
                  <span className={`text-sm ml-1 ${plan.highlighted ? 'text-white/70' : 'text-muted-foreground'}`}>
                    /{plan.period}
                  </span>
                )}
              </div>
              <p className={`text-sm mb-6 ${plan.highlighted ? 'text-white/70' : 'text-muted-foreground'}`}>
                {plan.description}
              </p>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle2
                      size={15}
                      className={`flex-shrink-0 ${plan.highlighted ? 'text-white' : 'text-primary'}`}
                    />
                    <span className={`text-sm ${plan.highlighted ? 'text-white/90' : 'text-foreground'}`}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login?tab=register"
                className={`inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors hover:no-underline ${
                  plan.highlighted
                    ? 'bg-white text-primary hover:bg-white/90'
                    : 'border border-border text-foreground hover:bg-accent'
                }`}
              >
                {plan.cta}
                <ArrowRight size={15} />
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Sem contrato. Cancele quando quiser. Suporte em português.
        </p>
      </div>
    </section>
  )
}

// ── CTA ──────────────────────────────────────────────────────────────────────
const perks = [
  'Site próprio no seu subdomínio',
  'Catálogo ilimitado de veículos',
  'Receba leads direto no painel',
  'Dashboard com métricas',
  'Multi-usuário com permissões',
  'Suporte em português',
]

function CTA() {
  return (
    <section className="py-24 px-6 bg-gradient-primary relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5" />
      <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-white/5" />

      <div className="max-w-3xl mx-auto text-center relative">
        <h2 className="text-4xl font-bold text-white mb-4">Pronto para digitalizar sua loja?</h2>
        <p className="text-white/70 mb-10 text-lg">
          Crie sua conta grátis e tenha seu catálogo online em minutos.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10 max-w-lg mx-auto">
          {perks.map((p) => (
            <div key={p} className="flex items-center gap-2 text-left">
              <CheckCircle2 size={15} className="text-white flex-shrink-0" />
              <span className="text-white/90 text-sm">{p}</span>
            </div>
          ))}
        </div>

        <Link
          href="/login?tab=register"
          className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-4 rounded-xl hover:bg-white/90 transition-colors text-base hover:no-underline shadow-lg"
        >
          Criar conta grátis
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  )
}

// ── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-foreground py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
          <div>
            <img src="/brand/cartalog-logo-white.png" alt="Cartalog" className="h-10 w-auto object-contain mb-3" />
            <p className="text-white/40 text-sm max-w-xs">
              A plataforma que transforma lojas de veículos em negócios digitais.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Produto</p>
              <ul className="space-y-2">
                {[
                  { label: 'Recursos', href: '#features' },
                  { label: 'Como funciona', href: '#how' },
                  { label: 'Planos', href: '#pricing' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="text-sm text-white/40 hover:text-white/70 transition-colors hover:no-underline">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Conta</p>
              <ul className="space-y-2">
                {[
                  { label: 'Entrar', href: '/login' },
                  { label: 'Criar conta', href: '/login?tab=register' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-white/40 hover:text-white/70 transition-colors hover:no-underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-sm">© 2025 Cartalog. Todos os direitos reservados.</p>
          <Link href="/login" className="text-sm text-white/30 hover:text-white/60 transition-colors hover:no-underline">
            Acessar painel →
          </Link>
        </div>
      </div>
    </footer>
  )
}

// ── PAGE ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <HowItWorks />
        <CatalogPreview />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
