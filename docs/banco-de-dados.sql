-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "demo_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "company_name" VARCHAR(100) NOT NULL,
    "message" TEXT,
    "email_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailed_at" TIMESTAMP(3),

    CONSTRAINT "demo_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" VARCHAR(30) NOT NULL DEFAULT 'PLATFORM_ADMIN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "target" VARCHAR(120) NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_name" VARCHAR(100) NOT NULL,
    "actor_email" VARCHAR(255),
    "action" VARCHAR(80) NOT NULL,
    "target" VARCHAR(120) NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "price_cents" INTEGER NOT NULL DEFAULT 0,
    "billing_interval" VARCHAR(20) NOT NULL DEFAULT 'monthly',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'trialing',
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_period_end" TIMESTAMP(3),
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_maintenance_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "message" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_maintenance_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "slug" VARCHAR NOT NULL,
    "logo_url" TEXT,
    "primary_color" VARCHAR,
    "secondary_color" VARCHAR,
    "description" TEXT,
    "phone" VARCHAR,
    "whatsapp" VARCHAR,
    "email" VARCHAR,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" VARCHAR NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "theme" VARCHAR,
    "show_prices" BOOLEAN NOT NULL DEFAULT true,
    "show_whatsapp_button" BOOLEAN NOT NULL DEFAULT true,
    "show_store_name_with_logo" BOOLEAN NOT NULL DEFAULT true,
    "background_color" VARCHAR,
    "font_family" VARCHAR,
    "home_headline" VARCHAR,
    "home_subheadline" TEXT,
    "show_home_stats" BOOLEAN NOT NULL DEFAULT true,
    "maintenance_enabled" BOOLEAN NOT NULL DEFAULT false,
    "maintenance_message" VARCHAR(500),
    "maintenance_updated_at" TIMESTAMP(3),

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "meta_title" VARCHAR,
    "meta_description" TEXT,
    "meta_keywords" TEXT,

    CONSTRAINT "seo_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_locations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "address" VARCHAR,
    "city" VARCHAR,
    "state" VARCHAR,
    "zip_code" VARCHAR,
    "latitude" DECIMAL,
    "longitude" DECIMAL,

    CONSTRAINT "company_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "title" VARCHAR NOT NULL,
    "subtitle" VARCHAR,
    "image_url" TEXT NOT NULL,
    "button_text" VARCHAR,
    "button_link" VARCHAR,
    "position" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "title" VARCHAR NOT NULL,
    "slug" VARCHAR NOT NULL,
    "content" TEXT NOT NULL,
    "blocks" JSONB,
    "is_published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "slug" VARCHAR NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "models" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "brand_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,

    CONSTRAINT "fuels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transmissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,

    CONSTRAINT "transmissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "category_id" UUID,
    "model_id" UUID NOT NULL,
    "fuel_id" UUID,
    "transmission_id" UUID,
    "slug" VARCHAR NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL NOT NULL,
    "color" VARCHAR,
    "description" TEXT,
    "status" VARCHAR NOT NULL DEFAULT 'available',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER,

    CONSTRAINT "vehicle_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_features" (
    "vehicle_id" UUID NOT NULL,
    "feature_id" UUID NOT NULL,

    CONSTRAINT "vehicle_features_pkey" PRIMARY KEY ("vehicle_id","feature_id")
);

-- CreateTable
CREATE TABLE "featured_vehicles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "position" INTEGER,

    CONSTRAINT "featured_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_views" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "searches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "query" VARCHAR NOT NULL,
    "searched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_status" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "position" INTEGER,
    "kind" VARCHAR NOT NULL DEFAULT 'open',

    CONSTRAINT "lead_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "vehicle_id" UUID,
    "assigned_user_id" UUID,
    "status_id" UUID,
    "name" VARCHAR NOT NULL,
    "phone" VARCHAR,
    "email" VARCHAR,
    "message" TEXT,
    "source" VARCHAR,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_interactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "user_id" UUID,
    "type" VARCHAR NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_followups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "user_id" UUID,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lead_followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "lead_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_tag_relations" (
    "lead_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "lead_tag_relations_pkey" PRIMARY KEY ("lead_id","tag_id")
);

-- CreateTable
CREATE TABLE "lead_vehicle_interest" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,

    CONSTRAINT "lead_vehicle_interest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demo_requests_created_at_idx" ON "demo_requests"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "platform_users_email_key" ON "platform_users"("email");

-- CreateIndex
CREATE INDEX "platform_audit_logs_created_at_idx" ON "platform_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "store_audit_logs_created_at_id_idx" ON "store_audit_logs"("created_at", "id");

-- CreateIndex
CREATE INDEX "store_audit_logs_company_id_created_at_idx" ON "store_audit_logs"("company_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "company_subscriptions_company_id_key" ON "company_subscriptions"("company_id");

-- CreateIndex
CREATE INDEX "company_subscriptions_status_idx" ON "company_subscriptions"("status");

-- CreateIndex
CREATE INDEX "site_maintenance_events_company_id_created_at_idx" ON "site_maintenance_events"("company_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_company_id_email_key" ON "users"("company_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_company_id_key" ON "site_settings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "seo_settings_company_id_key" ON "seo_settings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "pages_company_id_slug_key" ON "pages"("company_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_company_id_slug_key" ON "categories"("company_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "models_brand_id_name_key" ON "models"("brand_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "fuels_name_key" ON "fuels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "transmissions_name_key" ON "transmissions"("name");

-- CreateIndex
CREATE INDEX "vehicles_company_id_idx" ON "vehicles"("company_id");

-- CreateIndex
CREATE INDEX "vehicles_model_id_idx" ON "vehicles"("model_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_company_id_slug_key" ON "vehicles"("company_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "features_name_key" ON "features"("name");

-- CreateIndex
CREATE INDEX "leads_company_id_idx" ON "leads"("company_id");

-- CreateIndex
CREATE INDEX "lead_tag_relations_tag_id_idx" ON "lead_tag_relations"("tag_id");

-- CreateIndex
CREATE INDEX "lead_tag_relations_lead_id_idx" ON "lead_tag_relations"("lead_id");

-- AddForeignKey
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "platform_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_audit_logs" ADD CONSTRAINT "store_audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscriptions" ADD CONSTRAINT "company_subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscriptions" ADD CONSTRAINT "company_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_maintenance_events" ADD CONSTRAINT "site_maintenance_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_maintenance_events" ADD CONSTRAINT "site_maintenance_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_locations" ADD CONSTRAINT "company_locations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "models" ADD CONSTRAINT "models_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_fuel_id_fkey" FOREIGN KEY ("fuel_id") REFERENCES "fuels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_transmission_id_fkey" FOREIGN KEY ("transmission_id") REFERENCES "transmissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_features" ADD CONSTRAINT "vehicle_features_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_features" ADD CONSTRAINT "vehicle_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "featured_vehicles" ADD CONSTRAINT "featured_vehicles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "featured_vehicles" ADD CONSTRAINT "featured_vehicles_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_views" ADD CONSTRAINT "vehicle_views_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "searches" ADD CONSTRAINT "searches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_status" ADD CONSTRAINT "lead_status_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "lead_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_interactions" ADD CONSTRAINT "lead_interactions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_interactions" ADD CONSTRAINT "lead_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_followups" ADD CONSTRAINT "lead_followups_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_followups" ADD CONSTRAINT "lead_followups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tags" ADD CONSTRAINT "lead_tags_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tag_relations" ADD CONSTRAINT "lead_tag_relations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tag_relations" ADD CONSTRAINT "lead_tag_relations_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "lead_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_vehicle_interest" ADD CONSTRAINT "lead_vehicle_interest_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_vehicle_interest" ADD CONSTRAINT "lead_vehicle_interest_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
