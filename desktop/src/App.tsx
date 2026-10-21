import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, BookOpenText, Building2, CarFront, ChevronDown, Copy, LayoutDashboard, LogOut, Maximize2, Minus, Settings2, ShieldCheck, UsersRound, X } from 'lucide-react'
import logo from '../assets/cartalog-logo.png'
import logoWhite from '../assets/cartalog-logo-white.png'
import type { Bootstrap, DesktopSession } from './types'
import { ApiConnection, errorText, Spinner } from './ui'
import { AuthPage } from './pages/AuthPage'
import { OverviewPage } from './pages/OverviewPage'
import { TeamPage } from './pages/TeamPage'
import { SettingsPage } from './pages/SettingsPage'
import { ContentPage } from './pages/ContentPage'
import { VehiclesPage } from './pages/VehiclesPage'
import { PlatformPage } from './pages/PlatformPage'

type View = 'overview' | 'vehicles' | 'team' | 'settings' | 'content'
type Notice = { text: string; kind: 'success' | 'error' }

const nav: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'vehicles', label: 'Veículos', icon: CarFront },
  { id: 'team', label: 'Vendedores', icon: UsersRound },
  { id: 'settings', label: 'Minha loja', icon: Settings2 },
  { id: 'content', label: 'Catálogo público', icon: BookOpenText },
]

function DesktopWindow({ children }: { children: ReactNode }) {
  const [maximized, setMaximized] = useState(false)
  useEffect(() => {
    window.cartalog.window.isMaximized().then(setMaximized).catch(() => null)
    return window.cartalog.window.onStateChange(setMaximized)
  }, [])
  return <div className="desktop-window"><header className="window-bar" aria-label="Controles da janela"><span className="window-drag-area" /><div className="window-controls"><button type="button" title="Minimizar" aria-label="Minimizar janela" onClick={() => void window.cartalog.window.minimize()}><Minus size={16} /></button><button type="button" title={maximized ? 'Restaurar' : 'Maximizar'} aria-label={maximized ? 'Restaurar janela' : 'Maximizar janela'} onClick={() => void window.cartalog.window.toggleMaximize().then(setMaximized)}>{maximized ? <Copy size={15} /> : <Maximize2 size={15} />}</button><button type="button" className="window-close" title="Fechar" aria-label="Fechar janela" onClick={() => void window.cartalog.window.close()}><X size={17} /></button></div></header>{children}</div>
}

export default function App() {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null)
  const [bootError, setBootError] = useState('')
  const [session, setSession] = useState<DesktopSession | null>(null)
  const [view, setView] = useState<View>('overview')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    window.cartalog.bootstrap().then((result) => { setBootstrap(result); setSession(result.session) }).catch((error) => setBootError(errorText(error)))
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 5000)
    return () => clearTimeout(timer)
  }, [notice])

  const notify = useCallback((text: string, kind: 'success' | 'error' = 'success') => {
    setNotice({ text, kind })
    if (kind === 'error' && /sessão terminou|entre novamente|restrito ao dono/i.test(text)) setSession(null)
  }, [])

  async function logout() {
    setLoggingOut(true)
    try { await window.cartalog.logout(); setSession(null); setView('overview') }
    catch (error) { notify(errorText(error), 'error') }
    finally { setLoggingOut(false) }
  }

  if (bootError) return <DesktopWindow><div className="boot-error"><CarFront size={32} /><h1>Não foi possível abrir o Cartalog</h1><p>{bootError}</p><button onClick={() => location.reload()}>Tentar novamente</button></div></DesktopWindow>
  if (!bootstrap) return <DesktopWindow><div className="boot-loading"><img src={logo} alt="Cartalog" /><Spinner text="Preparando o Cartalog Desktop" /></div></DesktopWindow>
  if (!session) return <DesktopWindow><AuthPage apiOrigin={bootstrap.apiOrigin} onAuth={(result) => { setSession(result); setView('overview') }} /></DesktopWindow>
  if (session.scope === 'platform') return <DesktopWindow><PlatformPage session={session} onLogout={logout} loggingOut={loggingOut} notify={notify} notice={notice} /></DesktopWindow>

  return <DesktopWindow><div className="app-shell">
    <aside className="sidebar">
      <div className="sidebar-top"><img src={logoWhite} alt="Cartalog" /><span className="desktop-badge">DESKTOP</span></div>
      <div className="workspace-label">ESPAÇO DO DONO</div>
      <div className="workspace-card"><span className="workspace-avatar"><Building2 size={20} /></span><span><strong>{session.company.name}</strong><small>{session.company.slug}</small></span><ChevronDown size={16} /></div>
      <div className="nav-label">ADMINISTRAÇÃO</div>
      <nav className="sidebar-nav" aria-label="Navegação principal">
        {nav.map((item) => <button type="button" key={item.id} className={view === item.id ? 'nav-active' : ''} onClick={() => setView(item.id)}><item.icon size={20} /><span>{item.label}</span>{view === item.id && <ArrowRight size={16} />}</button>)}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-info"><ShieldCheck size={20} /><span>Área exclusiva para o dono. O atendimento de leads segue na web e no mobile.</span></div>
      <button type="button" className="sidebar-logout" onClick={logout} disabled={loggingOut}><LogOut size={18} />{loggingOut ? 'Saindo...' : 'Sair da conta'}</button>
    </aside>

    <main className="main-panel">
      <div className="topbar"><span>Cartalog <span className="breadcrumb-slash">/</span> {nav.find((item) => item.id === view)?.label}</span><div><ApiConnection /><span className="topbar-divider" /><span className="user-circle">{session.user.name.slice(0, 1).toUpperCase()}</span><strong>{session.user.name}</strong></div></div>
      <div className="page-content">
        {view === 'overview' && <OverviewPage session={session} apiOrigin={bootstrap.apiOrigin} onNavigate={setView} notify={notify} />}
        {view === 'vehicles' && <VehiclesPage apiOrigin={bootstrap.apiOrigin} notify={notify} />}
        {view === 'team' && <TeamPage notify={notify} />}
        {view === 'settings' && <SettingsPage apiOrigin={bootstrap.apiOrigin} notify={notify} />}
        {view === 'content' && <ContentPage apiOrigin={bootstrap.apiOrigin} notify={notify} />}
      </div>
    </main>
    {notice && <div role="status" className={`toast toast-${notice.kind}`}>{notice.text}</div>}
  </div></DesktopWindow>
}
