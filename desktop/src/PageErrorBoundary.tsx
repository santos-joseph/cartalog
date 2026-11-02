import { Component, type ErrorInfo, type ReactNode } from 'react'

export class PageErrorBoundary extends Component<{ children: ReactNode; onBack: () => void }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) { return { error } }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Falha ao renderizar a página do desktop:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return <div className="panel page-error" role="alert">
      <h1>Não foi possível mostrar esta tela.</h1>
      <p>A janela continua aberta. Volte ao painel e tente novamente.</p>
      <code>{this.state.error.message}</code>
      <button type="button" className="button button-primary" onClick={this.props.onBack}>Voltar à visão geral</button>
    </div>
  }
}
