ALTER TABLE "site_settings"
  ADD COLUMN "background_color" VARCHAR,
  ADD COLUMN "font_family" VARCHAR,
  ADD COLUMN "home_headline" VARCHAR,
  ADD COLUMN "home_subheadline" TEXT,
  ADD COLUMN "show_home_stats" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "pages" ADD COLUMN "blocks" JSONB;
