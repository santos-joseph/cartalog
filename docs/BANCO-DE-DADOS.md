# Banco de dados do Cartalog

Fonte: [schema Prisma](../api/prisma/schema.prisma). Abra o [explorador visual](banco-de-dados.html) para seguir cada chave estrangeira, copie o [DBML para dbdiagram](banco-de-dados.dbml) ou consulte o [SQL PostgreSQL](banco-de-dados.sql).

O SQL representa a estrutura de um banco vazio. Para atualizar bancos existentes, use as migrações em `api/prisma/migrations`.

## Leads e atendimento

Distribuição, vendedor responsável, histórico e interesses.

```mermaid
erDiagram
  leads {
    String id PK
    String company_id FK
    String vehicle_id FK
    String assigned_user_id FK
    String status_id FK
  }
  companies {
    String id PK
  }
  users {
    String id PK
    String company_id FK
  }
  vehicles {
    String id PK
    String company_id FK
    String category_id FK
    String model_id FK
    String fuel_id FK
    String transmission_id FK
  }
  lead_status {
    String id PK
    String company_id FK
  }
  lead_interactions {
    String id PK
    String lead_id FK
    String user_id FK
  }
  lead_followups {
    String id PK
    String lead_id FK
    String user_id FK
  }
  lead_tags {
    String id PK
    String company_id FK
  }
  lead_tag_relations {
    String lead_id PK
    String tag_id PK
  }
  lead_vehicle_interest {
    String id PK
    String lead_id FK
    String vehicle_id FK
  }
  companies ||--o{ users : "company_id"
  companies ||--o{ vehicles : "company_id"
  companies ||--o{ lead_status : "company_id"
  companies ||--o{ leads : "company_id"
  vehicles ||--o{ leads : "vehicle_id"
  users ||--o{ leads : "assigned_user_id"
  lead_status ||--o{ leads : "status_id"
  leads ||--o{ lead_interactions : "lead_id"
  users ||--o{ lead_interactions : "user_id"
  leads ||--o{ lead_followups : "lead_id"
  users ||--o{ lead_followups : "user_id"
  companies ||--o{ lead_tags : "company_id"
  leads ||--o{ lead_tag_relations : "lead_id"
  lead_tags ||--o{ lead_tag_relations : "tag_id"
  leads ||--o{ lead_vehicle_interest : "lead_id"
  vehicles ||--o{ lead_vehicle_interest : "vehicle_id"
```

## Veículos e catálogo

Estoque, marca, modelo, fotos e características.

```mermaid
erDiagram
  vehicles {
    String id PK
    String company_id FK
    String category_id FK
    String model_id FK
    String fuel_id FK
    String transmission_id FK
  }
  companies {
    String id PK
  }
  categories {
    String id PK
    String company_id FK
  }
  brands {
    String id PK
  }
  models {
    String id PK
    String brand_id FK
  }
  fuels {
    String id PK
  }
  transmissions {
    String id PK
  }
  vehicle_images {
    String id PK
    String vehicle_id FK
  }
  features {
    String id PK
  }
  vehicle_features {
    String vehicle_id PK
    String feature_id PK
  }
  featured_vehicles {
    String id PK
    String company_id FK
    String vehicle_id FK
  }
  vehicle_views {
    String id PK
    String vehicle_id FK
  }
  searches {
    String id PK
    String company_id FK
  }
  companies ||--o{ categories : "company_id"
  brands ||--o{ models : "brand_id"
  companies ||--o{ vehicles : "company_id"
  categories ||--o{ vehicles : "category_id"
  models ||--o{ vehicles : "model_id"
  fuels ||--o{ vehicles : "fuel_id"
  transmissions ||--o{ vehicles : "transmission_id"
  vehicles ||--o{ vehicle_images : "vehicle_id"
  vehicles ||--o{ vehicle_features : "vehicle_id"
  features ||--o{ vehicle_features : "feature_id"
  companies ||--o{ featured_vehicles : "company_id"
  vehicles ||--o{ featured_vehicles : "vehicle_id"
  vehicles ||--o{ vehicle_views : "vehicle_id"
  companies ||--o{ searches : "company_id"
```

## Lojas e site

Dono, equipe, aparência, páginas e manutenção.

```mermaid
erDiagram
  companies {
    String id PK
  }
  users {
    String id PK
    String company_id FK
  }
  site_settings {
    String id PK
    String company_id FK
  }
  seo_settings {
    String id PK
    String company_id FK
  }
  company_locations {
    String id PK
    String company_id FK
  }
  banners {
    String id PK
    String company_id FK
  }
  pages {
    String id PK
    String company_id FK
  }
  site_maintenance_events {
    String id PK
    String company_id FK
    String user_id FK
  }
  store_audit_logs {
    String id PK
    String company_id FK
  }
  companies ||--o{ store_audit_logs : "company_id"
  companies ||--o{ site_maintenance_events : "company_id"
  users ||--o{ site_maintenance_events : "user_id"
  companies ||--o{ users : "company_id"
  companies ||--o| site_settings : "company_id"
  companies ||--o| seo_settings : "company_id"
  companies ||--o{ company_locations : "company_id"
  companies ||--o{ banners : "company_id"
  companies ||--o{ pages : "company_id"
```

## Plataforma

Administração global, assinaturas e demonstrações.

```mermaid
erDiagram
  company_subscriptions {
    String id PK
    String company_id FK
    String plan_id FK
  }
  platform_users {
    String id PK
  }
  platform_audit_logs {
    String id PK
    String actor_id FK
  }
  demo_requests {
    String id PK
  }
  plans {
    String id PK
  }
  companies {
    String id PK
  }
  platform_users ||--o{ platform_audit_logs : "actor_id"
  companies ||--o| company_subscriptions : "company_id"
  plans ||--o{ company_subscriptions : "plan_id"
```

## Regenerar

Na pasta `api`, execute `npm run docs:db` para atualizar o SQL, esta referência e a página visual após alterar o schema Prisma.
