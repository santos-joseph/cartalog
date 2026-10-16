# Cartalog

**SaaS de catalogação de veículos multi-tenant** — cada concessionária ou revendedora cria sua conta e recebe um site próprio com catálogo de veículos, painel administrativo e gestão de leads, acessível em seu subdomínio exclusivo.

> Trabalho de Conclusão de Curso — Desenvolvimento de um SaaS multi-tenant para gestão de catálogos de veículos com arquitetura moderna em Node.js e Next.js.

---

## Visão Geral

O Cartalog funciona como uma plataforma no estilo **"Shopify para revendedoras de carros"**: ao se cadastrar, a empresa ganha imediatamente:

- Um **site público** em `slug.cartalog.com` com seu catálogo de veículos
- Um **painel administrativo** privado para gerenciar estoque, leads e equipe
- **Configurações de identidade visual** (logo, cores, banners, SEO)
- Um **sistema de CRM simplificado** para acompanhar os leads recebidos

O isolamento entre empresas é garantido por **multi-tenancy compartilhado** (shared database, row-level isolation por `company_id`), com identificação de tenant via subdomínio.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Backend** | Node.js + TypeScript + Fastify 5 |
| **ORM** | Prisma 7 + pg adapter |
| **Banco de dados** | PostgreSQL 16 |
| **Validação** | Zod v4 |
| **Autenticação** | JWT (access token 15min + refresh token 7d) |
| **Frontend** | Next.js 15 + TypeScript |
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
│   │   │   ├── auth/       # Registro, login, refresh, /me
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
│       │   ├── (auth)/     # Login e cadastro
│       │   ├── (dashboard)/ # Painel administrativo privado
│       │   └── [slug]/     # Site público da empresa (catálogo)
│       ├── components/     # Componentes reutilizáveis
│       └── services/       # Camada de serviços (chamadas à API)
│
├── mobile/                 # App mobile (em desenvolvimento)
├── desktop/                # App desktop (em desenvolvimento)
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
  ├── User[]             — membros da equipe (ADMIN | MANAGER | SELLER)
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
| POST | `/register` | Cria empresa + usuário ADMIN + configurações padrão |
| POST | `/login` | Autentica (slug via body ou header `X-Tenant-Slug`) |
| POST | `/refresh` | Renova access token com refresh token |
| GET | `/me` | Retorna usuário + empresa + configurações |

O registro cria automaticamente: empresa, usuário admin, `SiteSettings`, `SeoSettings` e 5 `LeadStatus` padrão.

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
| POST | `/:id/interactions` | Registra interação (ligação, e-mail, visita...) |
| GET | `/statuses` | Status disponíveis com contagem de leads |
| GET | `/stats` | Totais e leads por status |
| POST/PUT/DELETE | `/statuses` | Gerencia status customizados |

### Catálogo Público (`/catalog`) — sem autenticação

Identificação de empresa **exclusivamente via subdomínio** (sem slug na URL).

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

URL de acesso: `http://localhost:3333/uploads/vehicles/nome-do-arquivo.jpg`

---

## Frontend — Páginas

### Site público (`/[slug]`)

Acessado via subdomínio (`carstore.cartalog.com`). Conteúdo dinâmico por tenant.

- `/` — Home com banners, veículos em destaque e informações da empresa
- `/veiculos` — Listagem com filtros
- `/veiculos/[slug]` — Detalhe do veículo com galeria e formulário de lead

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
| `/dashboard/catalog` | Configuração do catálogo público |
| `/dashboard/team` | Gestão da equipe |
| `/dashboard/settings` | Configurações da empresa |

---

## Fluxo Completo — Da Empresa ao Lead

```
1. Empresa se cadastra em cartalog.com/register
         ↓
2. API cria: Company + User(ADMIN) + SiteSettings + SeoSettings + 5 LeadStatuses
         ↓
3. Empresa configura: logo, cores, banners, categorias, SEO
         ↓
4. Empresa cadastra veículos no painel (com fotos e opcionais)
         ↓
5. Site público fica disponível em {slug}.cartalog.com
         ↓
6. Visitante acessa o site, visualiza veículos e envia formulário de contato
         ↓
7. Lead é criado (POST /api/v1/leads — rota pública com tenant via subdomínio)
         ↓
8. Equipe vê o lead no painel, registra interações e acompanha o funil de vendas
```

---

## Como Rodar Localmente

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

### 1. Banco de dados

```bash
docker compose up -d
```

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
- [x] Autenticação JWT (register/login/refresh)
- [x] Multi-tenancy via subdomínio
- [x] CRUD de veículos com upload de imagens
- [x] Configurações da empresa (site, SEO, localização)
- [x] Sistema de leads com CRM básico
- [x] Catálogo público por subdomínio
- [x] Dashboard com métricas
- [x] Gestão de equipe (ADMIN/MANAGER/SELLER)
- [ ] App mobile (React Native)
- [ ] Planos e assinatura (Stripe)
---

## Licença

Este projeto foi desenvolvido como Trabalho de Conclusão de Curso e está disponível para fins acadêmicos.

---

*Desenvolvido por Joseph Santos — 2025/2026*
