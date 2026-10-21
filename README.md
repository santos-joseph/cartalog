# Cartalog

**SaaS de catalogação de veículos multi-tenant** — a revendedora solicita uma demonstração e a equipe Cartalog cria a conta do dono. A loja recebe um site próprio com catálogo, painel administrativo e gestão de leads em seu subdomínio.

> Trabalho de Conclusão de Curso — Desenvolvimento de um SaaS multi-tenant para gestão de catálogos de veículos com arquitetura moderna em Node.js e Next.js.

---

## Visão Geral

### Divisão atual das interfaces

- **API:** concentra as regras de empresa, usuários, veículos, leads, demonstrações, contas globais, assinaturas manuais e manutenção do catálogo.
- **Web administrativa:** login, visão do dono, cadastro de veículos e gestão de leads. O cadastro de empresa, vendedores, configurações e identidade visual foi retirado da interface web.
- **Site público:** catálogo por subdomínio e captura de leads.
- **Desktop:** app Electron com acesso global para a equipe Cartalog e acesso da loja para o dono; inclui vendedores, veículos, personalização e páginas públicas. Veja [desktop/README.md](desktop/README.md).
- **Painel global:** login separado em `/platform/login` para a equipe Cartalog criar empresas e donos, gerir planos e assinaturas, acompanhar demonstrações e administrar acessos globais.
- **Mobile:** app React Native/Expo para o vendedor assumir leads, registrar contatos e atualizar status. Veja [mobile/README.md](mobile/README.md).

A criação interna da loja gera um usuário `OWNER`. Somente o dono cadastra vendedores (`SELLER`) e pode atribuir ou reatribuir leads. Somente vendedores podem assumir leads da fila, registrar interações e mudar o status. Ao marcar um lead como `Perdido`, o vendedor informa o motivo. Desativar um vendedor revoga o acesso, devolve seus leads à fila e preserva o histórico.

O Cartalog funciona como uma plataforma no estilo **"Shopify para revendedoras de carros"**: depois da criação da conta pela equipe Cartalog, a empresa recebe:

- Um **site público** em `slug.cartalog.com` com seu catálogo de veículos
- Um **painel administrativo** privado para gerenciar estoque, leads e equipe
- **Configurações de identidade visual** (logo, cores, banners, SEO)
- Um **sistema de CRM simplificado** para acompanhar os leads recebidos

O isolamento entre empresas usa **multi-tenancy compartilhado** (um banco de dados, filtros de aplicação por `company_id`), com identificação do catálogo via subdomínio.

### Pedidos de demonstração e criação de contas

1. A landing em `http://localhost:3000/` envia o formulário para `POST /api/v1/demo-requests`. O pedido é salvo em `demo_requests` no PostgreSQL antes da tentativa de e-mail.
2. Em `api/.env`, configure `SALES_INBOX_EMAIL=sejacartalog@gmail.com`, `SMTP_USER=sejacartalog@gmail.com` e `SMTP_PASS` com uma **senha de app** da conta Gmail. O host padrão é `smtp.gmail.com` na porta 465. Ative a verificação em duas etapas na conta Google para criar a senha de app. Não use a senha comum da conta.
3. Se o envio falhar, o pedido continua no banco com `email_status=failed`. Após corrigir a configuração, execute `npm run demo:retry-emails` dentro de `api/`.
4. Depois do contato comercial, a equipe Cartalog cria a empresa e a conta `OWNER` pelo painel global. Para configurar o primeiro administrador global, execute `npm run platform:bootstrap` dentro de `api/` em um terminal interativo. O comando interno `npm run account:create` continua disponível para recuperação.

O registro público de empresa foi removido da API e do desktop. O formulário de demonstração não cria conta automaticamente.
O modo manutenção é ligado pelo dono nas configurações do desktop. Ele oculta o catálogo público e impede a chegada de novos leads até ser desligado.
Em produção atrás de um proxy reverso confiável, configure `TRUST_PROXY=true` na API para que o limite de pedidos por IP use o endereço correto do visitante.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Backend** | Node.js + TypeScript + Fastify 5 |
| **ORM** | Prisma 7 + pg adapter |
| **Banco de dados** | PostgreSQL 16 |
| **Validação** | Zod v4 |
| **Autenticação** | JWT (access token 15min + refresh token 7d) |
| **Frontend** | Next.js 16 + TypeScript |
| **Estilização** | Tailwind CSS |
| **Estado / Cache** | React Query + Zustand |
| **Upload de arquivos** | @fastify/multipart |
| **Documentação API** | Swagger / OpenAPI 3.0 |
| **Infraestrutura** | Docker Compose (PostgreSQL) |

---

## Arquitetura

```
cartalog/
├── api/                    # Backend — Fastify REST API
│   ├── prisma/
│   │   └── schema.prisma   # Definição do banco de dados
│   ├── src/
│   │   ├── config/         # Variáveis de ambiente (Zod)
│   │   ├── modules/        # Módulos da aplicação
│   │   │   ├── auth/       # Login, refresh, /me; criação interna da loja
│   │   │   ├── companies/  # Configurações, banners, páginas, categorias
│   │   │   ├── vehicles/   # CRUD de veículos + upload de imagens
│   │   │   ├── leads/      # CRM de leads + interações + status
│   │   │   ├── catalog/    # Rotas públicas do site da empresa
│   │   │   ├── dashboard/  # Overview e métricas
│   │   │   └── users/      # Gestão da equipe
│   │   └── shared/
│   │       ├── errors/     # Error handler global
│   │       ├── middlewares/ # Tenant middleware (subdomínio)
│   │       └── types/      # Extensões do Fastify (request.tenant, request.user)
│   └── uploads/            # Arquivos enviados (servidos em /uploads/...)
│
├── web/                    # Frontend — Next.js App Router
│   └── src/
│       ├── app/
│       │   ├── (auth)/     # Login; cadastro redireciona ao login
│       │   ├── (dashboard)/ # Painel administrativo privado
│       │   └── [slug]/     # Site público da empresa (catálogo)
│       ├── components/     # Componentes reutilizáveis
│       └── services/       # Camada de serviços (chamadas à API)
│
├── mobile/                 # App React Native/Expo do vendedor
├── desktop/                # App Electron do dono da loja
└── docker-compose.yml      # PostgreSQL containerizado
```

---

## Multi-Tenancy — Como Funciona

O coração do sistema é a identificação automática de tenant via **subdomínio**:

```
carstore.cartalog.com       →  empresa com slug "carstore"
premium-motors.cartalog.com →  empresa com slug "premium-motors"
```

### Fluxo de identificação

1. O cliente acessa `carstore.cartalog.com`
2. O **`tenantMiddleware`** lê o header `Host` e extrai o subdomínio
3. Busca a empresa no banco pelo slug
4. Injeta `request.tenant` com os dados da empresa
5. Todos os dados retornados já estão filtrados por `company_id`

```typescript
// Todas as queries já incluem o filtro de tenant automaticamente
prisma.vehicle.findMany({
  where: { companyId: request.tenant.id }
})
```

### Em desenvolvimento local

Configure em `/etc/hosts`:
```
127.0.0.1  carstore.localhost
```
E acesse `http://carstore.localhost:3000`.

---

## Banco de Dados — Modelo de Dados

```
Company (1)
  ├── User[]             — dono (OWNER) e vendedores (SELLER)
  ├── SiteSettings       — exibir preços, botão WhatsApp, tema
  ├── SeoSettings        — meta title, description, keywords
  ├── CompanyLocation[]  — endereço físico
  ├── Banner[]           — banners do site (com imagem)
  ├── Page[]             — páginas estáticas ("Sobre nós", "Política"...)
  ├── Category[]         — categorias de veículos (por empresa)
  ├── Vehicle[]
  │     ├── VehicleImage[]    — até 20 imagens, 1 capa
  │     ├── VehicleFeature[]  → Feature (global: "Ar condicionado", "GPS"...)
  │     └── VehicleView[]     — contagem de visualizações
  ├── Lead[]
  │     ├── LeadStatus        — status customizável por empresa
  │     ├── LeadInteraction[] — histórico de contatos
  │     ├── LeadFollowup[]    — agendamentos de retorno
  │     └── LeadTag[]         — etiquetas
  └── FeaturedVehicle[]  — destaques da home

Brand → Model → Vehicle   (marcas e modelos são globais/compartilhados)
Fuel, Transmission         (tabelas de referência globais)
Feature                    (opcionais globais — "GPS", "Teto Solar"...)
```

---

## Módulos da API

Base: `http://localhost:3333/api/v1`
Documentação interativa: `http://localhost:3333/docs`

### Autenticação (`/auth`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/login` | Autentica a conta da loja por e-mail e senha |
| POST | `/desktop-login` | Direciona dono da loja ou administrador global ao ambiente correto |
| POST | `/refresh` | Renova access token com refresh token |
| GET | `/me` | Retorna usuário + empresa + configurações |

`POST /api/v1/demo-requests` recebe os interessados. A criação da empresa e do dono é feita no painel global em `/platform`, que também cria `SiteSettings`, `SeoSettings` e 5 `LeadStatus` padrão. O comando `npm run account:create` permanece para recuperação.

### Veículos (`/vehicles`) — JWT obrigatório

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/brands`, `/models`, `/fuels`... | Dados de referência (público) |
| GET | `/` | Lista com filtros avançados |
| POST | `/` | Cadastra veículo (suporta markdown na descrição) |
| PUT | `/:id` | Atualiza veículo |
| DELETE | `/:id` | Remove veículo |
| POST | `/:id/images` | Upload multipart (máx 20 imagens, 5MB cada) |
| PATCH | `/:id/cover` | Define imagem de capa |
| DELETE | `/:id/images/:imageId` | Remove imagem específica |

**Filtros disponíveis:** `search`, `brandId`, `modelId`, `categoryId`, `fuelId`, `transmissionId`, `status`, `yearMin/Max`, `priceMin/Max`, `orderBy`, `order`.

### Empresa (`/companies`) — JWT obrigatório

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/PUT | `/settings` | Lê/atualiza configurações (cores, SEO, localização, WhatsApp) |
| POST | `/settings/logo` | Upload do logo |
| GET/POST | `/banners` | Gerencia banners do site |
| POST | `/banners/:id/image` | Upload de imagem do banner (máx 8MB) |
| GET/POST | `/pages` | Páginas estáticas |
| GET/POST | `/categories` | Categorias de veículos |

O `PUT /settings` salva em 4 tabelas simultaneamente: `companies`, `site_settings`, `seo_settings` e `company_locations`.

### Leads / CRM (`/leads`) — JWT obrigatório

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Lista com filtros (status, veículo, responsável, busca) |
| GET | `/:id` | Lead completo com interações, followups e tags |
| POST | `/` | Cria lead (origem: catálogo público) |
| PATCH | `/:id` | Atualiza status ou responsável |
| POST | `/:id/claim` | Vendedor assume um lead da fila |
| POST | `/:id/release` | Vendedor devolve seu lead à fila |
| POST | `/:id/interactions` | Registra interação (ligação, e-mail, visita...) |
| GET | `/statuses` | Status disponíveis com contagem de leads |
| GET | `/stats` | Totais e leads por status |
| POST/PUT/DELETE | `/statuses` | Gerencia status customizados |

`GET /leads` aceita `scope=queue|mine|all`. O dono pode atribuir a um vendedor da própria empresa; só o vendedor responsável muda o status e registra interações. `Perdido` exige `lossReason`.

### Catálogo Público (`/catalog`) — sem autenticação

Identificação de empresa pelo subdomínio ou pelo header `X-Tenant-Slug` usado pelo frontend servidor. O slug não aparece na URL pública.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Homepage (empresa, veículos em destaque, banners, páginas) |
| GET | `/vehicles` | Lista paginada (apenas `status=available`) |
| GET | `/vehicles/:slug` | Detalhe do veículo |
| GET | `/pages/:slug` | Página estática pública |

### Dashboard (`/dashboard`) — JWT obrigatório

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/overview` | Veículos (total/disponíveis/vendidos/reservados), stats de leads, mais vistos, últimos leads, leads por dia |

---

## Upload de Arquivos

Os arquivos são armazenados em `./uploads/` e servidos pelo próprio Fastify via `@fastify/static`.

| Categoria | Tamanho máx | Tipos aceitos |
|-----------|-------------|---------------|
| `vehicles` | 5 MB | jpeg, png, webp |
| `logos` | 2 MB | jpeg, png, webp, svg |
| `favicons` | 512 KB | ico, png |
| `banners` | 8 MB | jpeg, png, webp |
| `pages` | 8 MB | jpeg, png, webp |

URL de acesso: `http://localhost:3333/uploads/vehicles/nome-do-arquivo.jpg`

---

## Frontend — Páginas

### Site público (`/[slug]`)

Acessado via subdomínio (`carstore.cartalog.com`). Conteúdo dinâmico por tenant.

- `/` — Home com banners, veículos em destaque e informações da empresa
- `/veiculos` — Listagem com filtros
- `/veiculos/[slug]` — Detalhe do veículo com galeria e formulário de lead
- `/paginas/[slug]` — Página publicada no construtor do desktop

### Painel administrativo (`/dashboard`)

Protegido por autenticação JWT.

| Rota | Funcionalidade |
|------|---------------|
| `/dashboard` | Overview com métricas e gráficos |
| `/dashboard/vehicles` | Listagem e gestão do estoque |
| `/dashboard/vehicles/new` | Cadastro de novo veículo |
| `/dashboard/vehicles/[id]` | Edição de veículo |
| `/dashboard/leads` | CRM de leads |
| `/dashboard/leads/[id]` | Detalhes e interações do lead |

As rotas antigas `/dashboard/catalog`, `/dashboard/team` e `/dashboard/settings` redirecionam ao painel até existirem no app desktop.

---

## Fluxo Completo — Da Empresa ao Lead

```
1. Interessado pede demonstração pela landing page (POST /api/v1/demo-requests)
         ↓
2. Equipe Cartalog recebe o pedido e cria a empresa pelo painel global
         ↓
3. API cria: Company + User(OWNER) + SiteSettings + SeoSettings + 5 LeadStatuses
         ↓
4. Dono cadastra vendedores e configura a loja pelo app desktop
         ↓
5. Empresa cadastra veículos no painel (com fotos e opcionais)
         ↓
6. Site público fica disponível em {slug}.cartalog.com
         ↓
7. Visitante acessa o site, visualiza veículos e envia formulário de contato
         ↓
8. Lead é criado (POST /api/v1/leads/public — rota pública com tenant via subdomínio/header)
         ↓
9. Vendedor assume o lead, registra interações e acompanha o status; dono acompanha e distribui
```

---

## Como Rodar Localmente

### Pré-requisitos

- Node.js 20+
- PostgreSQL 16 (instalação local ou Docker Compose)

### 1. Banco de dados

Se usar Docker:

```bash
docker compose up -d
```

Se já tiver PostgreSQL 16 local, crie o banco `cartalog_dev` e configure `DATABASE_URL` em `api/.env`.

### 2. Backend (API)

```bash
cd api
cp .env.example .env
# Edite .env com suas configurações

npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

API disponível em: `http://localhost:3333`
Documentação Swagger: `http://localhost:3333/docs`

### 3. Frontend (Web)

```bash
cd web
cp .env.example .env.local
# Defina NEXT_PUBLIC_API_URL=http://localhost:3333

npm install
npm run dev
```

Frontend disponível em: `http://localhost:3000`

### 4. App desktop (dono ou administrador global)

```powershell
cd desktop
Copy-Item .env.example .env
npm install
npm run dev
```

Para gerar o instalador Windows: `npm run package:win`. Consulte [desktop/README.md](desktop/README.md) para as configurações de API e segurança.

### Variáveis de ambiente principais (API)

```env
DATABASE_URL="postgresql://cartalog:cartalog_secret@localhost:5432/cartalog_dev"
JWT_SECRET="sua-chave-secreta-64-chars"
JWT_REFRESH_SECRET="outra-chave-diferente-64-chars"
BASE_DOMAIN="cartalog.com"    # domínio base dos subdomínios
PORT=3333
UPLOAD_DIR="./uploads"
```

---

## Segurança

- **Senhas:** hash com bcrypt
- **Autenticação:** JWT stateless com access token (15min) + refresh token (7d)
- **Isolamento de dados:** todo acesso privado valida `company_id === user.companyId`
- **CORS:** em produção, aceita apenas origens do domínio base (`*.cartalog.com`)
- **Upload:** validação de tipo MIME e tamanho no servidor
- **Validação:** Zod em todas as entradas (body, params, query)

---

## Roadmap

- [x] Arquitetura inicial e configuração do projeto
- [x] Autenticação JWT (login/refresh) e criação interna de empresas
- [x] Multi-tenancy via subdomínio
- [x] CRUD de veículos com upload de imagens
- [x] Configurações da empresa (site, SEO, localização)
- [x] Sistema de leads com CRM básico
- [x] Catálogo público por subdomínio
- [x] Dashboard com métricas
- [x] Regras de dono (OWNER) e vendedor (SELLER) na API
- [x] App desktop (Electron) para equipe, configurações e conteúdo do catálogo
- [x] App mobile (React Native/Expo) para atendimento de leads por vendedores
- [x] Painel global com contas por e-mail, criação de empresas, planos e assinaturas manuais
- [x] Manutenção do site por loja no desktop
- [ ] Cobrança automática e integração de pagamento
---

## Licença

Este projeto foi desenvolvido como Trabalho de Conclusão de Curso e está disponível para fins acadêmicos.

---

*Desenvolvido por Joseph Santos — 2025/2026*
