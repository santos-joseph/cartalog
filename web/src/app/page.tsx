import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, CarFront, Check, ChevronDown, CircleCheck, LayoutDashboard, MessageCircle, Palette, Smartphone, UsersRound } from 'lucide-react'
import { DemoForm } from '@/components/marketing/demo-form'
import './marketing.css'

export const metadata: Metadata = {
  title: 'Cartalog | Seu catálogo, sua equipe, seus leads',
  description: 'Organize o estoque de veículos, publique seu catálogo e acompanhe os leads da sua loja com o Cartalog. Solicite uma demonstração.',
}

export default function HomePage() {
  return <div className="marketing">
    <header className="mk-nav-wrap"><nav className="mk-nav" aria-label="Navegação principal">
      <Link href="/" className="mk-brand" aria-label="Cartalog, início"><Image src="/brand/cartalog-mark.png" alt="" width={36} height={36} /><span>Cartalog</span></Link>
      <div className="mk-nav-links"><a href="#plataforma">Plataforma</a><a href="#como-funciona">Como funciona</a><a href="#duvidas">Dúvidas</a></div>
      <div className="mk-nav-actions"><Link href="/login" className="mk-login">Entrar</Link><a href="#demonstracao" className="mk-button mk-button-small">Solicitar demonstração <ArrowUpRight size={16} /></a></div>
    </nav></header>

    <main>
      <section className="mk-hero mk-container">
        <div className="mk-hero-copy"><span className="mk-eyebrow"><span className="mk-eyebrow-dot" /> PARA REVENDEDORAS DE VEÍCULOS</span><h1>Mais clareza para sua loja.<br /><em>Mais caminho</em> para cada venda.</h1><p>Seu estoque, seu site e o atendimento dos leads conectados em uma operação só. O Cartalog ajuda sua equipe a sair da planilha e trabalhar com contexto.</p><div className="mk-hero-actions"><a href="#demonstracao" className="mk-button">Quero conhecer o Cartalog <ArrowRight size={19} /></a><a href="#plataforma" className="mk-text-link">Explorar a plataforma <ChevronDown size={17} /></a></div><div className="mk-hero-note"><CircleCheck size={17} /> Demonstração solicitada diretamente à equipe Cartalog</div></div>
        <div className="mk-hero-visual" aria-label="Ilustração do painel Cartalog">
          <div className="mk-visual-orbit mk-orbit-one" /><div className="mk-visual-orbit mk-orbit-two" />
          <div className="mk-demo-window"><div className="mk-demo-toolbar"><span className="mk-demo-dots"><i /><i /><i /></span><span>Visão da loja</span><span className="mk-demo-live"><i /> Ativo</span></div><div className="mk-demo-layout"><aside><Image src="/brand/cartalog-mark.png" alt="" width={28} height={28} /><span className="selected"><LayoutDashboard size={15} /> Visão geral</span><span><CarFront size={15} /> Veículos</span><span><UsersRound size={15} /> Leads</span></aside><div className="mk-demo-content"><small>PAINEL DA LOJA</small><h3>Bom dia, equipe.</h3><p>Seu catálogo e seus contatos em um só lugar.</p><div className="mk-demo-metrics"><div><span>Veículos publicados</span><strong>24</strong><small>Catálogo atualizado</small></div><div><span>Leads em aberto</span><strong>08</strong><small>Prontos para atender</small></div></div><div className="mk-demo-list"><span>Últimos contatos</span><div><i /><b>Interesse no SUV 2023</b><small>Novo</small></div><div><i /><b>Visita agendada</b><small>Em atendimento</small></div></div></div></div></div>
          <div className="mk-float-card"><span><MessageCircle size={18} /></span><div><strong>Lead recebido</strong><small>Da vitrine para o atendimento</small></div><CircleCheck size={19} /></div>
        </div>
      </section>

      <section className="mk-proof-strip"><div className="mk-container"><span>UMA OPERAÇÃO, TRÊS FRENTES</span><div><strong>Gestão da loja</strong><i /> <strong>Vitrine digital</strong><i /> <strong>Atendimento</strong></div></div></section>

      <section id="plataforma" className="mk-section mk-container"><div className="mk-section-heading"><span className="mk-kicker">A PLATAFORMA</span><h2>Organização que acompanha<br />a jornada inteira.</h2><p>Da publicação de um carro ao primeiro contato com o comprador, cada parte tem seu lugar.</p></div><div className="mk-feature-grid">
        <article className="mk-feature mk-feature-dark"><div className="mk-feature-icon"><CarFront size={24} /></div><span>01 / ESTOQUE E CATÁLOGO</span><h3>Seus carros apresentados do jeito certo.</h3><p>Cadastre veículos, fotos e detalhes. Publique um catálogo próprio para sua loja e mantenha sua vitrine alinhada ao estoque.</p><div className="mk-feature-mini"><span>Catálogo público</span><span>Veículos e fotos</span><span>Páginas da loja</span></div></article>
        <article className="mk-feature mk-feature-light"><div className="mk-feature-icon"><UsersRound size={24} /></div><span>02 / LEADS E EQUIPE</span><h3>Todo interesse chega com contexto.</h3><p>Veja os leads, distribua atendimentos e acompanhe o histórico. Cada vendedor sabe qual é o próximo passo.</p><div className="mk-feature-flow"><span>Contato recebido</span><ArrowRight size={15} /><span>Vendedor assume</span><ArrowRight size={15} /><span>Histórico atualizado</span></div></article>
        <article className="mk-feature mk-feature-soft"><div className="mk-feature-icon"><Palette size={24} /></div><span>03 / IDENTIDADE</span><h3>Sua loja tem voz própria.</h3><p>O dono organiza a marca, as cores, os banners e páginas públicas no aplicativo desktop.</p></article>
        <article className="mk-feature mk-feature-red"><div className="mk-feature-icon"><Smartphone size={24} /></div><span>04 / NO RITMO DA EQUIPE</span><h3>Atendimento também no celular.</h3><p>O vendedor pode consultar e atualizar seus leads pela web ou pelo aplicativo mobile.</p></article>
      </div></section>

      <section id="como-funciona" className="mk-process"><div className="mk-container mk-process-grid"><div><span className="mk-kicker">COMO COMEÇAR</span><h2>Do primeiro contato à sua loja no ar.</h2><p>O início é acompanhado pela equipe Cartalog, para configurar a empresa e liberar o acesso do dono.</p><a href="#demonstracao" className="mk-button">Solicitar demonstração <ArrowRight size={18} /></a></div><ol><li><b>01</b><div><h3>Conte sobre sua loja</h3><p>Preencha o formulário e explique o que sua equipe precisa.</p></div></li><li><b>02</b><div><h3>Converse com a Cartalog</h3><p>Recebemos o pedido por e-mail e entramos em contato para apresentar o sistema.</p></div></li><li><b>03</b><div><h3>Comece sua operação</h3><p>Depois da contratação, criamos a conta do dono. Ele configura a loja e cadastra seus vendedores.</p></div></li></ol></div></section>

      <section id="duvidas" className="mk-section mk-container mk-faq"><div><span className="mk-kicker">DÚVIDAS FREQUENTES</span><h2>Antes de começar.</h2><p>O essencial para entender como sua equipe vai usar o Cartalog.</p></div><div className="mk-faq-list"><details><summary>Preciso criar uma conta para pedir uma demonstração?</summary><p>Não. Basta enviar seus dados no formulário. A equipe Cartalog recebe o pedido e entra em contato.</p></details><details><summary>Quem cadastra os vendedores?</summary><p>O dono da loja cadastra os vendedores no aplicativo desktop. São eles que atendem os leads.</p></details><details><summary>O vendedor pode atender pelo celular?</summary><p>Sim. O atendimento pode ser feito pela web ou pelo aplicativo mobile.</p></details><details><summary>Posso personalizar o site da loja?</summary><p>O dono configura cores, conteúdo, banners e páginas públicas no desktop.</p></details></div></section>

      <section id="demonstracao" className="mk-contact"><div className="mk-container mk-contact-grid"><div className="mk-contact-copy"><span className="mk-kicker">VAMOS CONVERSAR</span><h2>Sua próxima venda começa com uma loja mais organizada.</h2><p>Conte um pouco sobre sua operação. A equipe Cartalog vai receber sua solicitação e falar com você sobre uma demonstração.</p><div className="mk-contact-points"><span><Check size={17} /> Apresentação da plataforma</span><span><Check size={17} /> Conversa sobre sua operação</span><span><Check size={17} /> Próximos passos com a equipe Cartalog</span></div></div><DemoForm /></div></section>
    </main>
    <footer className="mk-footer"><div className="mk-container"><div><Link href="/" className="mk-brand"><Image src="/brand/cartalog-mark.png" alt="" width={32} height={32} /><span>Cartalog</span></Link><p>Catálogo, equipe e leads em movimento.</p></div><div><a href="#plataforma">Plataforma</a><a href="#como-funciona">Como funciona</a><Link href="/login">Entrar</Link></div><small>© {new Date().getFullYear()} Cartalog</small></div></footer>
  </div>
}
