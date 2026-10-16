/*
  Warnings:

  - The primary key for the `banners` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `active` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `link_url` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `banners` table. All the data in the column will be lost.
  - The `id` column on the `banners` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `brands` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `active` on the `brands` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `brands` table. All the data in the column will be lost.
  - You are about to drop the column `logo_url` on the `brands` table. All the data in the column will be lost.
  - The `id` column on the `brands` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `companies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `active` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `document` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `companies` table. All the data in the column will be lost.
  - The `id` column on the `companies` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `lead_interactions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `description` on the `lead_interactions` table. All the data in the column will be lost.
  - The `id` column on the `lead_interactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `user_id` column on the `lead_interactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `leads` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `assigned_to` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `leads` table. All the data in the column will be lost.
  - The `id` column on the `leads` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `vehicle_id` column on the `leads` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `source` column on the `leads` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `pages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `pages` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `pages` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `pages` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `pages` table. All the data in the column will be lost.
  - The `id` column on the `pages` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `active` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_login_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - The `id` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `vehicle_features` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `category` on the `vehicle_features` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `vehicle_features` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `vehicle_features` table. All the data in the column will be lost.
  - The primary key for the `vehicle_images` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `vehicle_images` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `vehicle_images` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `vehicle_images` table. All the data in the column will be lost.
  - The `id` column on the `vehicle_images` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `vehicles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `brand_id` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `cover_image_url` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `doors` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `engine_size` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `featured` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `fuel_type` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `horsepower` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `license_plate` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `price_on_request` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `seats` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `transmission` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `vehicle_type` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `view_count` on the `vehicles` table. All the data in the column will be lost.
  - The `id` column on the `vehicles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `vehicles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `company_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vehicle_feature_map` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vehicle_models` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `company_id` on the `banners` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lead_id` on the `lead_interactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `leads` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `pages` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `feature_id` to the `vehicle_features` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicle_id` to the `vehicle_features` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image_url` to the `vehicle_images` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `vehicle_id` on the `vehicle_images` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `company_id` on the `vehicles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `model_id` on the `vehicles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "banners" DROP CONSTRAINT "banners_company_id_fkey";

-- DropForeignKey
ALTER TABLE "company_settings" DROP CONSTRAINT "company_settings_company_id_fkey";

-- DropForeignKey
ALTER TABLE "lead_interactions" DROP CONSTRAINT "lead_interactions_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_company_id_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_vehicle_id_fkey";

-- DropForeignKey
ALTER TABLE "pages" DROP CONSTRAINT "pages_company_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_company_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicle_feature_map" DROP CONSTRAINT "vehicle_feature_map_feature_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicle_feature_map" DROP CONSTRAINT "vehicle_feature_map_vehicle_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicle_images" DROP CONSTRAINT "vehicle_images_vehicle_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicle_models" DROP CONSTRAINT "vehicle_models_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_company_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_model_id_fkey";

-- DropIndex
DROP INDEX "banners_company_id_idx";

-- DropIndex
DROP INDEX "companies_document_key";

-- DropIndex
DROP INDEX "companies_email_key";

-- DropIndex
DROP INDEX "lead_interactions_lead_id_idx";

-- DropIndex
DROP INDEX "leads_company_id_status_idx";

-- DropIndex
DROP INDEX "pages_company_id_idx";

-- DropIndex
DROP INDEX "vehicle_features_name_key";

-- DropIndex
DROP INDEX "vehicle_images_vehicle_id_idx";

-- DropIndex
DROP INDEX "vehicles_company_id_featured_idx";

-- DropIndex
DROP INDEX "vehicles_company_id_status_idx";

-- AlterTable
ALTER TABLE "banners" DROP CONSTRAINT "banners_pkey",
DROP COLUMN "active",
DROP COLUMN "created_at",
DROP COLUMN "link_url",
DROP COLUMN "order",
DROP COLUMN "updated_at",
ADD COLUMN     "button_link" VARCHAR,
ADD COLUMN     "button_text" VARCHAR,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "position" INTEGER,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "title" SET DATA TYPE VARCHAR,
ALTER COLUMN "subtitle" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "banners_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "brands" DROP CONSTRAINT "brands_pkey",
DROP COLUMN "active",
DROP COLUMN "created_at",
DROP COLUMN "logo_url",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ALTER COLUMN "name" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "companies" DROP CONSTRAINT "companies_pkey",
DROP COLUMN "active",
DROP COLUMN "document",
DROP COLUMN "updated_at",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "primary_color" VARCHAR,
ADD COLUMN     "secondary_color" VARCHAR,
ADD COLUMN     "whatsapp" VARCHAR,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ALTER COLUMN "name" SET DATA TYPE VARCHAR,
ALTER COLUMN "slug" SET DATA TYPE VARCHAR,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "email" SET DATA TYPE VARCHAR,
ALTER COLUMN "phone" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "lead_interactions" DROP CONSTRAINT "lead_interactions_pkey",
DROP COLUMN "description",
ADD COLUMN     "note" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
DROP COLUMN "lead_id",
ADD COLUMN     "lead_id" UUID NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID,
ALTER COLUMN "type" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "lead_interactions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "leads" DROP CONSTRAINT "leads_pkey",
DROP COLUMN "assigned_to",
DROP COLUMN "status",
DROP COLUMN "updated_at",
ADD COLUMN     "assigned_user_id" UUID,
ADD COLUMN     "status_id" UUID,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
DROP COLUMN "vehicle_id",
ADD COLUMN     "vehicle_id" UUID,
ALTER COLUMN "name" SET DATA TYPE VARCHAR,
ALTER COLUMN "email" SET DATA TYPE VARCHAR,
ALTER COLUMN "phone" SET DATA TYPE VARCHAR,
DROP COLUMN "source",
ADD COLUMN     "source" VARCHAR,
ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "pages" DROP CONSTRAINT "pages_pkey",
DROP COLUMN "created_at",
DROP COLUMN "order",
DROP COLUMN "status",
DROP COLUMN "updated_at",
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "title" SET DATA TYPE VARCHAR,
ALTER COLUMN "slug" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "pages_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "active",
DROP COLUMN "last_login_at",
DROP COLUMN "updated_at",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
ALTER COLUMN "name" SET DATA TYPE VARCHAR,
ALTER COLUMN "email" SET DATA TYPE VARCHAR,
DROP COLUMN "role",
ADD COLUMN     "role" VARCHAR NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "vehicle_features" DROP CONSTRAINT "vehicle_features_pkey",
DROP COLUMN "category",
DROP COLUMN "id",
DROP COLUMN "name",
ADD COLUMN     "feature_id" UUID NOT NULL,
ADD COLUMN     "vehicle_id" UUID NOT NULL,
ADD CONSTRAINT "vehicle_features_pkey" PRIMARY KEY ("vehicle_id", "feature_id");

-- AlterTable
ALTER TABLE "vehicle_images" DROP CONSTRAINT "vehicle_images_pkey",
DROP COLUMN "created_at",
DROP COLUMN "order",
DROP COLUMN "url",
ADD COLUMN     "image_url" TEXT NOT NULL,
ADD COLUMN     "is_cover" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "position" INTEGER,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
DROP COLUMN "vehicle_id",
ADD COLUMN     "vehicle_id" UUID NOT NULL,
ADD CONSTRAINT "vehicle_images_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_pkey",
DROP COLUMN "brand_id",
DROP COLUMN "cover_image_url",
DROP COLUMN "doors",
DROP COLUMN "engine_size",
DROP COLUMN "featured",
DROP COLUMN "fuel_type",
DROP COLUMN "horsepower",
DROP COLUMN "license_plate",
DROP COLUMN "price_on_request",
DROP COLUMN "seats",
DROP COLUMN "title",
DROP COLUMN "transmission",
DROP COLUMN "updated_at",
DROP COLUMN "vehicle_type",
DROP COLUMN "view_count",
ADD COLUMN     "category_id" UUID,
ADD COLUMN     "fuel_id" UUID,
ADD COLUMN     "transmission_id" UUID,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID NOT NULL,
DROP COLUMN "model_id",
ADD COLUMN     "model_id" UUID NOT NULL,
ALTER COLUMN "slug" SET DATA TYPE VARCHAR,
ALTER COLUMN "price" SET DATA TYPE DECIMAL,
ALTER COLUMN "color" SET DATA TYPE VARCHAR,
DROP COLUMN "status",
ADD COLUMN     "status" VARCHAR NOT NULL DEFAULT 'available',
ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "company_settings";

-- DropTable
DROP TABLE "vehicle_feature_map";

-- DropTable
DROP TABLE "vehicle_models";

-- DropEnum
DROP TYPE "FuelType";

-- DropEnum
DROP TYPE "LeadSource";

-- DropEnum
DROP TYPE "LeadStatus";

-- DropEnum
DROP TYPE "PageStatus";

-- DropEnum
DROP TYPE "TransmissionType";

-- DropEnum
DROP TYPE "UserRole";

-- DropEnum
DROP TYPE "VehicleStatus";

-- DropEnum
DROP TYPE "VehicleType";

-- CreateTable
CREATE TABLE "site_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "theme" VARCHAR,
    "show_prices" BOOLEAN NOT NULL DEFAULT true,
    "show_whatsapp_button" BOOLEAN NOT NULL DEFAULT true,

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
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "slug" VARCHAR NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "features" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "lead_status_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "site_settings_company_id_key" ON "site_settings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "seo_settings_company_id_key" ON "seo_settings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_company_id_slug_key" ON "categories"("company_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "models_brand_id_name_key" ON "models"("brand_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "fuels_name_key" ON "fuels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "transmissions_name_key" ON "transmissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "features_name_key" ON "features"("name");

-- CreateIndex
CREATE INDEX "lead_tag_relations_tag_id_idx" ON "lead_tag_relations"("tag_id");

-- CreateIndex
CREATE INDEX "lead_tag_relations_lead_id_idx" ON "lead_tag_relations"("lead_id");

-- CreateIndex
CREATE INDEX "leads_company_id_idx" ON "leads"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "pages_company_id_slug_key" ON "pages"("company_id", "slug");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_company_id_email_key" ON "users"("company_id", "email");

-- CreateIndex
CREATE INDEX "vehicles_company_id_idx" ON "vehicles"("company_id");

-- CreateIndex
CREATE INDEX "vehicles_model_id_idx" ON "vehicles"("model_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_company_id_slug_key" ON "vehicles"("company_id", "slug");

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
