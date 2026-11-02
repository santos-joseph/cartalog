import type { FastifyInstance } from 'fastify'

type Access = 'public' | 'store' | 'owner' | 'platform' | 'platformOwner'
type Entry = { tag: string; summary: string; access: Access; note?: string }

const entries = new Map<string, Entry>()

function group(tag: string, access: Access, routes: string[]) {
  for (const route of routes) {
    const [key, summary, override, note] = route.split('|')
    const normalizedKey = key === 'GET /' ? key : key.replace(/\/$/, '')
    if (entries.has(normalizedKey)) throw new Error(`Rota duplicada na documentação: ${normalizedKey}`)
    entries.set(normalizedKey, { tag, summary, access: (override as Access) || access, note })
  }
}

group('Saúde', 'public', [
  'GET /|Identificação da API',
  'GET /health|Estado da API e conexão com o PostgreSQL',
])

group('Autenticação', 'public', [
  'POST /api/v1/auth/login|Entrar com e-mail e senha na loja',
  'POST /api/v1/auth/desktop-login|Entrar no desktop como dono ou administrador global',
  'POST /api/v1/auth/refresh|Renovar tokens',
  'GET /api/v1/auth/me|Consultar usuário autenticado|store',
])

group('Plataforma · acesso', 'platform', [
  'POST /api/v1/platform/auth/login|Entrar como administrador global|public',
  'GET /api/v1/platform/me|Consultar administrador global',
  'POST /api/v1/platform/auth/change-password|Alterar senha do administrador global',
  'GET /api/v1/platform/overview|Resumo global da plataforma',
  'GET /api/v1/platform/demo-requests|Listar solicitações de demonstração',
])

group('Plataforma · gestão', 'platform', [
  'GET /api/v1/platform/companies|Listar lojas da plataforma',
  'POST /api/v1/platform/companies|Criar loja e seu dono',
  'GET /api/v1/platform/plans|Listar planos e assinaturas',
  'POST /api/v1/platform/plans|Criar plano',
  'PATCH /api/v1/platform/plans/:id|Editar plano',
  'PUT /api/v1/platform/companies/:id/subscription|Definir assinatura da loja',
])

group('Plataforma · administração', 'platformOwner', [
  'GET /api/v1/platform/admins|Listar administradores globais',
  'POST /api/v1/platform/admins|Criar administrador global',
  'PATCH /api/v1/platform/admins/:id/active|Ativar ou desativar administrador',
  'GET /api/v1/platform/audit|Consultar auditoria global e das lojas',
])

group('Loja · configurações', 'store', [
  'GET /api/v1/companies/me|Consultar dados da loja',
  'GET /api/v1/companies/settings|Consultar aparência e SEO',
  'PUT /api/v1/companies/settings|Salvar aparência e SEO|owner',
  'POST /api/v1/companies/settings/logo|Enviar logotipo|owner',
  'GET /api/v1/companies/settings/maintenance|Consultar manutenção do site|owner',
  'PATCH /api/v1/companies/settings/maintenance|Ativar ou desativar manutenção|owner',
])

group('Loja · categorias', 'store', [
  'GET /api/v1/companies/categories/|Listar categorias',
  'POST /api/v1/companies/categories/|Criar categoria|owner',
  'PUT /api/v1/companies/categories/:id|Editar categoria|owner',
  'DELETE /api/v1/companies/categories/:id|Excluir categoria|owner',
])

group('Loja · banners e páginas', 'store', [
  'GET /api/v1/companies/banners|Listar banners',
  'POST /api/v1/companies/banners|Criar banner|owner',
  'PUT /api/v1/companies/banners/:id|Editar banner|owner',
  'DELETE /api/v1/companies/banners/:id|Excluir banner|owner',
  'POST /api/v1/companies/banners/:id/image|Enviar imagem do banner|owner',
  'GET /api/v1/companies/pages|Listar páginas da loja',
  'GET /api/v1/companies/pages/:id|Consultar página',
  'POST /api/v1/companies/pages|Criar página|owner',
  'PUT /api/v1/companies/pages/:id|Editar página|owner',
  'DELETE /api/v1/companies/pages/:id|Excluir página|owner',
  'POST /api/v1/companies/pages/images|Enviar imagem para página|owner',
])

group('Veículos · referências', 'public', [
  'GET /api/v1/vehicles/brands|Listar marcas',
  'GET /api/v1/vehicles/models|Listar modelos por marca',
  'GET /api/v1/vehicles/fuels|Listar combustíveis',
  'GET /api/v1/vehicles/transmissions|Listar câmbios',
  'GET /api/v1/vehicles/features|Listar características',
])

group('Veículos · estoque', 'store', [
  'GET /api/v1/vehicles/|Listar veículos da loja',
  'GET /api/v1/vehicles/:id|Consultar veículo',
  'POST /api/v1/vehicles/|Cadastrar veículo|owner',
  'PUT /api/v1/vehicles/:id|Editar veículo|owner',
  'DELETE /api/v1/vehicles/:id|Excluir veículo|owner',
  'POST /api/v1/vehicles/:id/images|Enviar imagens do veículo|owner',
  'DELETE /api/v1/vehicles/:id/images/:imageId|Excluir imagem do veículo|owner',
  'PATCH /api/v1/vehicles/:id/cover|Definir imagem de capa|owner',
])

group('Leads · atendimento', 'store', [
  'POST /api/v1/leads/public|Receber lead pelo catálogo público|public|A empresa é identificada pelo subdomínio. Indisponível durante manutenção.',
  'GET /api/v1/leads/|Listar leads visíveis ao usuário',
  'GET /api/v1/leads/:id|Consultar lead',
  'POST /api/v1/leads/|Cadastrar lead',
  'PATCH /api/v1/leads/:id|Atualizar lead',
  'POST /api/v1/leads/:id/claim|Assumir atendimento de lead',
  'POST /api/v1/leads/:id/release|Liberar lead',
  'POST /api/v1/leads/:id/interactions|Registrar interação com lead',
  'GET /api/v1/leads/stats|Consultar métricas de leads|owner',
])

group('Leads · status', 'store', [
  'GET /api/v1/leads/statuses|Listar status da loja',
  'POST /api/v1/leads/statuses|Criar status|owner',
  'PUT /api/v1/leads/statuses/:id|Editar status|owner',
  'DELETE /api/v1/leads/statuses/:id|Excluir status|owner',
])

group('Equipe', 'store', [
  'GET /api/v1/users/|Listar vendedores da loja',
  'GET /api/v1/users/:id|Consultar vendedor',
  'POST /api/v1/users/|Cadastrar vendedor|owner',
  'PUT /api/v1/users/:id|Editar vendedor|owner',
  'DELETE /api/v1/users/:id|Desativar vendedor|owner',
  'PATCH /api/v1/users/:id/reactivate|Reativar vendedor|owner',
  'PATCH /api/v1/users/me/password|Alterar a própria senha',
])

group('Painel', 'owner', [
  'GET /api/v1/dashboard/overview|Resumo do painel da loja',
])

group('Catálogo público', 'public', [
  'GET /api/v1/catalog/status|Consultar estado público da loja|public|Disponível mesmo durante manutenção. Empresa pelo subdomínio.',
  'GET /api/v1/catalog/|Carregar página inicial da loja|public|Empresa pelo subdomínio; retorna 503 durante manutenção.',
  'GET /api/v1/catalog/vehicles|Pesquisar veículos publicados|public|Empresa pelo subdomínio; retorna 503 durante manutenção.',
  'GET /api/v1/catalog/vehicles/:vehicleSlug|Consultar veículo publicado|public|Empresa pelo subdomínio; retorna 503 durante manutenção.',
  'GET /api/v1/catalog/pages/:pageSlug|Consultar página publicada|public|Empresa pelo subdomínio; retorna 503 durante manutenção.',
])

group('Demonstração', 'public', [
  'POST /api/v1/demo-requests/|Solicitar demonstração do Cartalog',
])

const accessText: Record<Access, string> = {
  public: 'Acesso público.',
  store: 'Requer Bearer JWT da loja. Dados limitados à empresa do usuário.',
  owner: 'Requer Bearer JWT com perfil OWNER da loja.',
  platform: 'Requer Bearer JWT de administrador global.',
  platformOwner: 'Requer Bearer JWT com perfil PLATFORM_OWNER.',
}

export const documentedRoutes = entries

export function registerRouteMetadata(app: FastifyInstance) {
  app.addHook('onRoute', (options) => {
    const methods = Array.isArray(options.method) ? options.method : [options.method]
    const url = options.url === '/' ? '/' : options.url.replace(/\/$/, '')
    const entry = methods.map((method) => entries.get(`${method} ${url}`)).find(Boolean)
    if (!entry) return
    options.schema = {
      ...options.schema,
      tags: [entry.tag],
      summary: entry.summary,
      description: `${accessText[entry.access]}${entry.note ? ` ${entry.note}` : ''}`,
      ...(entry.access === 'public' ? {} : { security: [{ bearerAuth: [] }] }),
    }
  })
}
